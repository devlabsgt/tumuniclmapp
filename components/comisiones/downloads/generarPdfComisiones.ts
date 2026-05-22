import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';

export interface RegistroComision {
  user_id: string;
  comision_id: string;
  tipo_registro: 'Entrada' | 'Salida';
  created_at: string;
  nota?: string | null;
}

const OFICIO_MM: [number, number] = [216, 330];
const MARGIN = 14;

const getUsuarioNombre = (id: string, usuarios: Usuario[]) =>
  usuarios.find((u) => u.id === id)?.nombre ?? 'Desconocido';

const calcDuracion = (
  entrada?: RegistroComision | null,
  salida?: RegistroComision | null,
): string => {
  if (!entrada || !salida) return '---';
  const diff =
    new Date(salida.created_at).getTime() - new Date(entrada.created_at).getTime();
  if (diff < 0) return '---';
  let minutos = Math.floor(diff / 60000);
  const horas = Math.floor(minutos / 60);
  minutos %= 60;
  const parts: string[] = [];
  if (horas > 0) parts.push(`${horas}h`);
  if (minutos > 0) parts.push(`${minutos}m`);
  return parts.join(' ') || '0m';
};

const formatHora = (dateString?: string | null) =>
  dateString ? format(new Date(dateString), 'h:mm a', { locale: es }) : '---';

/** Etiqueta en negrita + valor normal en la misma línea */
const textoEtiquetaValor = (
  doc: jsPDF,
  x: number,
  y: number,
  etiqueta: string,
  valor: string,
) => {
  doc.setFont('helvetica', 'bold');
  doc.text(`${etiqueta}: `, x, y);
  const labelW = doc.getTextWidth(`${etiqueta}: `);
  doc.setFont('helvetica', 'normal');
  doc.text(valor, x + labelW, y);
};

const textoEtiquetaValorDerecha = (
  doc: jsPDF,
  xRight: number,
  y: number,
  etiqueta: string,
  valor: string,
) => {
  doc.setFont('helvetica', 'normal');
  const valorW = doc.getTextWidth(valor);
  doc.setFont('helvetica', 'bold');
  const labelW = doc.getTextWidth(`${etiqueta}: `);
  const startX = xRight - labelW - valorW;
  doc.text(`${etiqueta}: `, startX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(valor, startX + labelW, y);
};

const agregarNumeracionPaginas = (doc: jsPDF) => {
  const total = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Hoja ${i}/${total}`, pageWidth / 2, pageHeight - 8, {
      align: 'center',
    });
  }
};

const cargarLogoBase64 = (): Promise<{ dataUrl: string; w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar el logo'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error('No se pudo cargar el logo municipal'));
    img.src = `${window.location.origin}/images/logo-muni.png`;
  });

export async function fetchRegistrosComisiones(
  comisionIds: string[],
): Promise<Map<string, RegistroComision[]>> {
  const resultados = await Promise.all(
    comisionIds.map(async (id) => {
      const res = await fetch(`/api/users/comision/registros?comisionId=${id}`);
      if (!res.ok) return [id, []] as const;
      const json = await res.json();
      return [id, (json.data ?? []) as RegistroComision[]] as const;
    }),
  );
  return new Map<string, RegistroComision[]>(
    resultados.map(([id, regs]) => [id, [...regs]]),
  );
}

/** Mismo layout que fertilizante/generarImagenEncargados.ts → encabezadoMunicipalHtml */
function dibujarEncabezadoMunicipal(
  doc: jsPDF,
  logo: { dataUrl: string; w: number; h: number },
  totalComisiones: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const startY = 12;

  // Logo compacto a la izquierda; texto ocupa el resto del ancho
  const logoColW = 46;
  const logoColX = MARGIN + 2;
  const textColX = MARGIN + logoColW;
  const textColW = pageWidth - MARGIN - textColX;
  const textCenterX = textColX + textColW / 2;

  const tituloY = startY + 6;
  const deptoY = tituloY + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(32, 65, 132);
  doc.text('Municipalidad de Concepción Las Minas', textCenterX, tituloY, {
    align: 'center',
    maxWidth: textColW,
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text(
    'Departamento de Chiquimula, Guatemala C.A. | TEL: 7943-5619 - CEL: 4790-2524',
    textCenterX,
    deptoY,
    { align: 'center' },
  );

  const logoMaxH = 28;
  const logoMaxW = logoColW - 8;
  const aspect = logo.w / logo.h;
  let logoH = logoMaxH;
  let logoW = logoH * aspect;
  if (logoW > logoMaxW) {
    logoW = logoMaxW;
    logoH = logoW / aspect;
  }
  const logoY = deptoY - logoH / 2;
  doc.addImage(logo.dataUrl, 'PNG', logoColX, logoY, logoW, logoH);

  let textY = deptoY + 5;
  const barH = 0.45;
  const barW = Math.min(textColW * 0.88, 128);
  const barX = textCenterX - barW / 2;
  const segW = barW / 4;
  const barColors: [number, number, number][] = [
    [32, 65, 132],
    [54, 106, 201],
    [104, 166, 242],
    [194, 218, 251],
  ];
  barColors.forEach(([r, g, b], i) => {
    doc.setFillColor(r, g, b);
    doc.rect(barX + i * segW, textY, segW, barH, 'F');
  });

  textY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('INFORME DE COMISIONES', textCenterX, textY, {
    align: 'center',
    maxWidth: textColW,
  });

  const headerBottom = Math.max(logoY + logoH, textY) + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}`,
    MARGIN,
    headerBottom,
  );
  doc.text(`Total de comisiones: ${totalComisiones}`, pageWidth - MARGIN, headerBottom, {
    align: 'right',
  });

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, headerBottom + 3, pageWidth - MARGIN, headerBottom + 3);

  return headerBottom + 9;
}

export async function generarPdfComisiones(
  comisiones: ComisionConFechaYHoraSeparada[],
  usuarios: Usuario[],
  registrosPorComision: Map<string, RegistroComision[]>,
) {
  const logo = await cargarLogoBase64();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: OFICIO_MM,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  const ordenadas = [...comisiones].sort(
    (a, b) =>
      parseISO(a.fecha_hora.replace(' ', 'T')).getTime() -
      parseISO(b.fecha_hora.replace(' ', 'T')).getTime(),
  );

  let cursorY = dibujarEncabezadoMunicipal(doc, logo, ordenadas.length);

  ordenadas.forEach((comision, index) => {
    const registros = registrosPorComision.get(comision.id) ?? [];
    const fechaCompleta = parseISO(comision.fecha_hora.replace(' ', 'T'));
    const encargado = comision.asistentes?.find((a) => a.encargado);
    const integrantes =
      comision.asistentes
        ?.filter((a) => !a.encargado)
        .sort((a, b) =>
          getUsuarioNombre(a.id, usuarios).localeCompare(
            getUsuarioNombre(b.id, usuarios),
          ),
        ) ?? [];

    const personas = [
      ...(encargado
        ? [{ id: encargado.id, rol: 'Encargado' as const }]
        : []),
      ...integrantes.map((a) => ({ id: a.id, rol: 'Integrante' as const })),
    ];

    const bloqueEstimado = 28 + Math.max(personas.length, 1) * 7 + 14;
    if (cursorY + bloqueEstimado > pageHeight - MARGIN && index > 0) {
      doc.addPage([216, 330], 'p');
      cursorY = MARGIN;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(32, 65, 132);
    doc.text(`${index + 1}. ${comision.titulo}`, MARGIN, cursorY);
    cursorY += 6;

    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);

    const nombreEncargado = encargado
      ? getUsuarioNombre(encargado.id, usuarios)
      : 'No asignado';

    const fechaHoraStr = format(fechaCompleta, 'dd/MM/yy, h:mm a', { locale: es });

    textoEtiquetaValor(doc, MARGIN, cursorY, 'Encargado', nombreEncargado);
    textoEtiquetaValorDerecha(doc, pageWidth - MARGIN, cursorY, 'Fecha', fechaHoraStr);
    cursorY += 5;

    const mismaPersonaCreaAprueba =
      Boolean(comision.creado_por && comision.aprobado_por &&
        comision.creado_por === comision.aprobado_por) ||
      Boolean(
        comision.creador_nombre &&
          comision.aprobador_nombre &&
          comision.creador_nombre === comision.aprobador_nombre,
      );

    if (mismaPersonaCreaAprueba && comision.creador_nombre) {
      textoEtiquetaValor(
        doc,
        MARGIN,
        cursorY,
        'Creado y Aprobado por',
        comision.creador_nombre,
      );
    } else {
      if (comision.creador_nombre) {
        textoEtiquetaValor(doc, MARGIN, cursorY, 'Creado por', comision.creador_nombre);
      }
      if (comision.aprobador_nombre) {
        textoEtiquetaValorDerecha(
          doc,
          pageWidth - MARGIN,
          cursorY,
          'Aprobado por',
          comision.aprobador_nombre,
        );
      }
    }
    cursorY += 5;

    if (comision.comentarios?.length) {
      cursorY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Notas:', MARGIN, cursorY);
      cursorY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      const colGap = 6;
      const colW = (contentWidth - colGap) / 2;
      const col2X = MARGIN + colW + colGap;
      const mitad = Math.ceil(comision.comentarios.length / 2);
      const notasCol1 = comision.comentarios.slice(0, mitad);
      const notasCol2 = comision.comentarios.slice(mitad);

      let yCol1 = cursorY;
      let yCol2 = cursorY;

      notasCol1.forEach((nota) => {
        const lineas = doc.splitTextToSize(`• ${nota}`, colW);
        doc.text(lineas, MARGIN, yCol1);
        yCol1 += lineas.length * 3.5;
      });
      notasCol2.forEach((nota) => {
        const lineas = doc.splitTextToSize(`• ${nota}`, colW);
        doc.text(lineas, col2X, yCol2);
        yCol2 += lineas.length * 3.5;
      });

      cursorY = Math.max(yCol1, yCol2);
    }

    cursorY += 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(32, 65, 132);
    doc.text('Registros de asistencia:', MARGIN, cursorY);
    cursorY += 5;

    const hayObservaciones = personas.some((persona) => {
      const entrada =
        registros.find(
          (r) => r.user_id === persona.id && r.tipo_registro === 'Entrada',
        ) ?? null;
      const salida =
        registros.find(
          (r) => r.user_id === persona.id && r.tipo_registro === 'Salida',
        ) ?? null;
      return Boolean(entrada?.nota?.trim() || salida?.nota?.trim());
    });

    const filasTabla = personas.length
      ? personas.map((persona, i) => {
          const entrada =
            registros.find(
              (r) =>
                r.user_id === persona.id && r.tipo_registro === 'Entrada',
            ) ?? null;
          const salida =
            registros.find(
              (r) =>
                r.user_id === persona.id && r.tipo_registro === 'Salida',
            ) ?? null;
          const notaRegistro = [entrada?.nota, salida?.nota]
            .filter(Boolean)
            .join(' / ');

          const fila: string[] = [
            String(i + 1),
            getUsuarioNombre(persona.id, usuarios),
            formatHora(entrada?.created_at),
            formatHora(salida?.created_at),
            calcDuracion(entrada, salida),
          ];
          if (hayObservaciones) fila.push(notaRegistro || '—');
          return fila;
        })
      : [
          hayObservaciones
            ? ['—', 'Sin asistentes registrados', '—', '—', '—', '—']
            : ['—', 'Sin asistentes registrados', '—', '—', '—'],
        ];

    const encabezadoTabla = hayObservaciones
      ? ['No.', 'Nombre', 'Entrada', 'Salida', 'Duración', 'Observaciones']
      : ['No.', 'Nombre', 'Entrada', 'Salida', 'Duración'];

    const estilosColumnas = hayObservaciones
      ? {
          0: { cellWidth: 10, halign: 'center' as const },
          1: { cellWidth: 52 },
          2: { cellWidth: 24, halign: 'center' as const },
          3: { cellWidth: 24, halign: 'center' as const },
          4: { cellWidth: 22, halign: 'center' as const },
          5: { cellWidth: 'auto' as const },
        }
      : {
          0: { cellWidth: 10, halign: 'center' as const },
          1: { cellWidth: 68 },
          2: { cellWidth: 28, halign: 'center' as const },
          3: { cellWidth: 28, halign: 'center' as const },
          4: { cellWidth: 24, halign: 'center' as const },
        };

    autoTable(doc, {
      startY: cursorY,
      margin: { left: MARGIN, right: MARGIN, bottom: MARGIN + 6 },
      theme: 'grid',
      head: [encabezadoTabla],
      body: filasTabla,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [180, 180, 180],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [229, 231, 235],
        textColor: [32, 65, 132],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: estilosColumnas as Record<string, object>,
    });

    cursorY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? cursorY;
    cursorY += 12;
  });

  agregarNumeracionPaginas(doc);

  const nombreArchivo = `Informe_Comisiones_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  const blob = doc.output('blob') as Blob;
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener noreferrer';
  if (window.innerWidth < 768) {
    link.download = nombreArchivo;
  } else {
    link.target = '_blank';
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
