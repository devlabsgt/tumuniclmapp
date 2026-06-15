import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cargarLogoMunicipal, dibujarEncabezadoMunicipalPdf } from './encabezadoMunicipalPdf';
import { formatoLineaSolicitud } from './formatoSolicitudReporte';

const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);

type PdfColoresFila = {
  rowFill: [number, number, number];
  text: [number, number, number];
  badgeFill?: [number, number, number];
  badgeText?: [number, number, number];
};

const getPdfColorNivel = (fila: FilaPdfReporte): PdfColoresFila => {
  if (fila.tipo === 'solicitud') {
    return {
      rowFill: [248, 250, 252],
      text: [71, 85, 105],
    };
  }

  if (fila.tipo === 'empleado' || fila.esPuesto) {
    return {
      rowFill: [254, 252, 232],
      text: [133, 77, 14],
      badgeFill: [254, 249, 195],
      badgeText: [133, 77, 14],
    };
  }

  switch (fila.level % 4) {
    case 0:
      return {
        rowFill: [239, 246, 255],
        text: [30, 64, 175],
        badgeFill: [219, 234, 254],
        badgeText: [30, 64, 175],
      };
    case 1:
      return {
        rowFill: [254, 242, 242],
        text: [153, 27, 27],
        badgeFill: [254, 226, 226],
        badgeText: [153, 27, 27],
      };
    case 2:
      return {
        rowFill: [250, 245, 255],
        text: [107, 33, 168],
        badgeFill: [243, 232, 255],
        badgeText: [107, 33, 168],
      };
    default:
      return {
        rowFill: [255, 247, 237],
        text: [154, 52, 18],
        badgeFill: [255, 237, 213],
        badgeText: [154, 52, 18],
      };
  }
};

export interface FilaPdfReporte {
  prefix: string;
  nombre: string;
  total: number;
  tipo: 'dependencia' | 'empleado' | 'solicitud';
  esPuesto?: boolean;
  level: number;
  solicitud?: {
    correlativo?: number | null;
    placa?: string;
    justificacion?: string | null;
  };
}

export interface OpcionesPdfReporte {
  filas: FilaPdfReporte[];
  tituloFiltro: string;
  periodo: string;
  granTotal: number;
}

type SegmentoPdf = { texto: string; negrita: boolean };

const paddingCelda = (
  cellPadding: unknown,
  lado: 'left' | 'right' | 'top' | 'bottom'
) => {
  if (typeof cellPadding === 'object' && cellPadding !== null && lado in cellPadding) {
    return Number((cellPadding as Record<string, number>)[lado]);
  }
  if (typeof cellPadding === 'number') return cellPadding;
  return 2.5;
};

const segmentosSolicitudPdf = (
  sol: NonNullable<FilaPdfReporte['solicitud']>
): SegmentoPdf[] => {
  const numero = String(sol.correlativo ?? sol.id ?? '—');
  const placa = sol.placa?.trim() || '—';
  const justificacion = sol.justificacion?.trim() || 'Sin justificación';
  return [
    { texto: 'No.:', negrita: false },
    { texto: ` ${numero}, `, negrita: true },
    { texto: 'Placa:', negrita: false },
    { texto: ` ${placa}, `, negrita: true },
    { texto: 'Just.', negrita: false },
    { texto: ` ${justificacion}`, negrita: true },
  ];
};

const dibujarSegmentosConSalto = (
  pdf: jsPDF,
  segmentos: SegmentoPdf[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  color: [number, number, number],
  lineHeight = 3.2
) => {
  pdf.setFontSize(fontSize);
  pdf.setTextColor(color[0], color[1], color[2]);
  let cx = x;
  let cy = y;

  for (const seg of segmentos) {
    const partes = seg.texto.match(/\S+|\s+/g) ?? [];
    for (const parte of partes) {
      pdf.setFont('helvetica', seg.negrita ? 'bold' : 'normal');
      const ancho = pdf.getTextWidth(parte);
      if (cx + ancho > x + maxWidth && cx > x) {
        cx = x;
        cy += lineHeight;
      }
      pdf.text(parte, cx, cy);
      cx += ancho;
    }
  }
};

const construirPdfReporte = async (opts: OpcionesPdfReporte) => {
  const logo = await cargarLogoMunicipal();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const margin = 14;

  const startY = dibujarEncabezadoMunicipalPdf(doc, logo, {
    tituloDocumento: 'Reporte de Consumo de Combustible',
    lineas: [
      `Periodo: ${opts.periodo}`,
      `Área: ${opts.tituloFiltro}`,
      `Generado: ${new Date().toLocaleString('es-GT', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`,
    ],
  });

  const body = opts.filas.map((f) => {
    const no =
      f.tipo === 'dependencia' && f.prefix && f.prefix !== '—' && !f.esPuesto ? f.prefix : '';
    const nombre =
      f.tipo === 'solicitud' && f.solicitud
        ? formatoLineaSolicitud(f.solicitud)
        : f.nombre;
    return [no, nombre, formatearQ(f.total)];
  });

  autoTable(doc, {
    startY,
    margin: { left: margin, right: margin, bottom: 20 },
    theme: 'grid',
    head: [['No.', 'Dependencia / Nombre', 'Total']],
    body,
    foot: [['', 'TOTAL', formatearQ(opts.granTotal)]],
    showFoot: 'lastPage',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      fillColor: [255, 255, 255],
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.fillColor = [255, 255, 255];
        data.cell.styles.textColor = [15, 23, 42];
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index === 2) data.cell.styles.halign = 'right';
        else data.cell.styles.halign = 'left';
        return;
      }

      if (data.section !== 'body') return;

      const fila = opts.filas[data.row.index];
      if (!fila) return;

      const colores = getPdfColorNivel(fila);
      data.cell.styles.fillColor = colores.rowFill;
      data.cell.styles.textColor = colores.text;

      if (fila.tipo === 'solicitud') {
        data.cell.styles.valign = 'top';
      }

      if (data.column.index === 0) {
        data.cell.styles.halign = 'left';
        if (fila.tipo === 'dependencia' && fila.prefix && fila.prefix !== '—' && !fila.esPuesto) {
          data.cell.styles.fillColor = colores.badgeFill ?? colores.rowFill;
          data.cell.styles.textColor = colores.badgeText ?? colores.text;
          data.cell.styles.fontStyle = 'bold';
        }
        return;
      }

      if (data.column.index === 1) {
        data.cell.styles.halign = 'left';
        data.cell.styles.fontStyle = fila.tipo === 'empleado' || fila.esPuesto ? 'bold' : 'normal';
        if (fila.tipo === 'solicitud' && fila.solicitud) {
          const fontSize = 7;
          const padX =
            paddingCelda(data.cell.styles.cellPadding, 'left') +
            paddingCelda(data.cell.styles.cellPadding, 'right');
          const anchoPagina = data.doc.internal.pageSize.getWidth();
          const anchoCol =
            data.cell.width > 10
              ? data.cell.width
              : anchoPagina - margin * 2 - 18 - 28;
          const maxW = Math.max(20, anchoCol - padX);

          data.doc.setFont('helvetica', 'normal');
          data.doc.setFontSize(fontSize);
          data.cell.text = data.doc.splitTextToSize(
            formatoLineaSolicitud(fila.solicitud),
            maxW
          );
          data.cell.styles.fontSize = fontSize;
          data.cell.styles.textColor = colores.rowFill;
        }
        return;
      }

      if (data.column.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'right';
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 1) return;

      const fila = opts.filas[data.row.index];
      if (fila?.tipo !== 'solicitud' || !fila.solicitud) return;

      const colores = getPdfColorNivel(fila);
      const fontSize = 7;
      const padLeft = paddingCelda(data.cell.styles.cellPadding, 'left');
      const padRight = paddingCelda(data.cell.styles.cellPadding, 'right');
      const padTop = paddingCelda(data.cell.styles.cellPadding, 'top');

      dibujarSegmentosConSalto(
        data.doc,
        segmentosSolicitudPdf(fila.solicitud),
        data.cell.x + padLeft,
        data.cell.y + padTop + 1.5,
        data.cell.width - padLeft - padRight,
        fontSize,
        colores.text
      );
    },
  });

  return doc;
};

export async function crearUrlPdfReporteDepartamento(opts: OpcionesPdfReporte): Promise<string> {
  const doc = await construirPdfReporte(opts);
  const blob = doc.output('blob') as Blob;
  const pdfBlob =
    blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
  return URL.createObjectURL(pdfBlob);
}
