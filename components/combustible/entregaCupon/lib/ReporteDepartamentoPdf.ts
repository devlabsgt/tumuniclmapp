import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cargarLogoMunicipal, dibujarEncabezadoMunicipalPdf } from './encabezadoMunicipalPdf';
import {
  datosSolicitudReporte,
  formatoLineaSolicitud,
  colorCombustiblePdf,
  colorDatosVehiculoPdf,
} from './formatoSolicitudReporte';
import { debeSubrayarTotalReporte, TipoFilaReporte } from './formatoSolicitudReporte';

const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);

type PdfColoresFila = {
  rowFill: [number, number, number];
  text: [number, number, number];
  badgeFill?: [number, number, number];
  badgeText?: [number, number, number];
  underlineRgb?: [number, number, number];
};

const getPdfColorNivel = (fila: FilaPdfReporte): PdfColoresFila => {
  if (fila.tipo === 'solicitud') {
    return {
      rowFill: [248, 250, 252],
      text: [71, 85, 105],
    };
  }

  if (fila.tipo === 'total-empleado') {
    return {
      rowFill: [248, 250, 252],
      text: [133, 77, 14],
      underlineRgb: [202, 138, 4],
    };
  }

  if (fila.tipo === 'empleado' || fila.esPuesto) {
    return {
      rowFill: [254, 252, 232],
      text: [133, 77, 14],
      badgeFill: [254, 249, 195],
      badgeText: [133, 77, 14],
      underlineRgb: [202, 138, 4],
    };
  }

  switch (fila.level % 4) {
    case 0:
      return {
        rowFill: [239, 246, 255],
        text: [30, 64, 175],
        badgeFill: [219, 234, 254],
        badgeText: [30, 64, 175],
        underlineRgb: [59, 130, 246],
      };
    case 1:
      return {
        rowFill: [254, 242, 242],
        text: [153, 27, 27],
        badgeFill: [254, 226, 226],
        badgeText: [153, 27, 27],
        underlineRgb: [239, 68, 68],
      };
    case 2:
      return {
        rowFill: [250, 245, 255],
        text: [107, 33, 168],
        badgeFill: [243, 232, 255],
        badgeText: [107, 33, 168],
        underlineRgb: [168, 85, 247],
      };
    default:
      return {
        rowFill: [255, 247, 237],
        text: [154, 52, 18],
        badgeFill: [255, 237, 213],
        badgeText: [154, 52, 18],
        underlineRgb: [249, 115, 22],
      };
  }
};

export interface FilaPdfReporte {
  prefix: string;
  nombre: string;
  nombrePuesto?: string;
  total: number;
  tipo: TipoFilaReporte;
  esPuesto?: boolean;
  level: number;
  ocultarTotalFila?: boolean;
  solicitud?: {
    correlativo?: number | null;
    id?: number;
    placa?: string;
    vehiculo?: string;
    tipo_combustible?: string;
    justificacion?: string | null;
    created_at?: string;
  };
}

export interface OpcionesPdfReporte {
  filas: FilaPdfReporte[];
  tituloFiltro: string;
  periodo: string;
  granTotal: number;
}

type SegmentoPdf = {
  texto: string;
  negrita: boolean;
  color?: [number, number, number];
};

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

const segmentosSolicitudLinea1 = (
  sol: NonNullable<FilaPdfReporte['solicitud']>
): SegmentoPdf[] => {
  const { fecha, vehiculo, placa, combustible } = datosSolicitudReporte(sol);
  const azul = colorDatosVehiculoPdf();
  const colorComb = colorCombustiblePdf(combustible);
  const negro: [number, number, number] = [15, 23, 42];
  return [
    { texto: `${fecha} `, negrita: true, color: negro },
    { texto: `${vehiculo}, `, negrita: true, color: azul },
    { texto: `${placa}, `, negrita: true, color: azul },
    { texto: combustible, negrita: true, color: colorComb },
  ];
};

const segmentosSolicitudLinea2 = (
  sol: NonNullable<FilaPdfReporte['solicitud']>
): SegmentoPdf[] => {
  const { justificacion } = datosSolicitudReporte(sol);
  return [{ texto: justificacion, negrita: false }];
};

const subrayarTextoPdf = (
  pdf: jsPDF,
  texto: string,
  x: number,
  baselineY: number,
  color: [number, number, number]
) => {
  const ancho = pdf.getTextWidth(texto);
  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setLineWidth(0.35);
  pdf.line(x, baselineY + 0.6, x + ancho, baselineY + 0.6);
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
      const rgb = seg.color ?? color;
      pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
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
      f.tipo === 'dependencia' && f.prefix && f.prefix !== '—' && !f.esPuesto
        ? f.prefix
        : f.tipo === 'solicitud' && f.solicitud
          ? datosSolicitudReporte(f.solicitud).noEtiqueta
          : '';
    const nombre =
      f.tipo === 'solicitud' && f.solicitud
        ? formatoLineaSolicitud(f.solicitud)
        : f.tipo === 'empleado' && f.nombrePuesto
          ? `${f.nombrePuesto}\n${f.nombre}`
          : f.nombre;
    const totalCelda = f.ocultarTotalFila ? '' : formatearQ(f.total);
    return [no, nombre, totalCelda];
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

      if (fila.tipo === 'total-empleado') {
        data.cell.styles.cellPadding = { top: 2.5, right: 2.5, bottom: 7, left: 2.5 };
        data.cell.styles.valign = 'top';
      }

      if (data.column.index === 0) {
        data.cell.styles.halign = 'left';
        if (fila.tipo === 'dependencia' && fila.prefix && fila.prefix !== '—' && !fila.esPuesto) {
          data.cell.styles.fillColor = colores.badgeFill ?? colores.rowFill;
          data.cell.styles.textColor = colores.badgeText ?? colores.text;
          data.cell.styles.fontStyle = 'bold';
        }
        if (fila.tipo === 'solicitud' && fila.solicitud) {
          data.cell.text = [datosSolicitudReporte(fila.solicitud).noEtiqueta];
          data.cell.styles.halign = 'center';
          data.cell.styles.fontStyle = 'normal';
          data.cell.styles.fontSize = 7;
          data.cell.styles.valign = 'middle';
        }
        return;
      }

      if (data.column.index === 1) {
        data.cell.styles.halign = 'left';
        if (fila.tipo === 'total-empleado') {
          data.cell.text = [''];
          return;
        }
        if (fila.tipo === 'empleado' && fila.nombrePuesto) {
          data.cell.text = [fila.nombrePuesto, fila.nombre];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = colores.rowFill;
          return;
        }
        data.cell.styles.fontStyle =
          fila.tipo === 'empleado' || fila.esPuesto || fila.tipo === 'dependencia'
            ? 'bold'
            : 'normal';
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
        data.cell.styles.textColor = colores.text;
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;

      const fila = opts.filas[data.row.index];
      if (!fila) return;

      const colores = getPdfColorNivel(fila);
      const pdf = data.doc;

      if (data.column.index === 2 && debeSubrayarTotalReporte(fila) && !fila.ocultarTotalFila) {
        const texto = formatearQ(fila.total);
        const padRight = paddingCelda(data.cell.styles.cellPadding, 'right');
        const padTop = paddingCelda(data.cell.styles.cellPadding, 'top');
        const padBottom = paddingCelda(data.cell.styles.cellPadding, 'bottom');
        const fontSize = typeof data.cell.styles.fontSize === 'number' ? data.cell.styles.fontSize : 8;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);
        const textWidth = pdf.getTextWidth(texto);
        const x = data.cell.x + data.cell.width - padRight - textWidth;
        const baselineY =
          data.cell.y + padTop + (data.cell.height - padTop - padBottom) / 2 + fontSize * 0.15;
        const [ur, ug, ub] = colores.underlineRgb ?? colores.text;
        pdf.setDrawColor(ur, ug, ub);
        pdf.setLineWidth(0.35);
        pdf.line(x, baselineY + 0.6, x + textWidth, baselineY + 0.6);
        return;
      }

      if (data.column.index !== 1) return;

      if (fila.tipo === 'total-empleado') {
        const fontSize = typeof data.cell.styles.fontSize === 'number' ? data.cell.styles.fontSize : 8;
        const padLeft = paddingCelda(data.cell.styles.cellPadding, 'left');
        const padTop = paddingCelda(data.cell.styles.cellPadding, 'top');
        const padBottom = paddingCelda(data.cell.styles.cellPadding, 'bottom');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(colores.text[0], colores.text[1], colores.text[2]);
        const baselineY =
          data.cell.y + padTop + (data.cell.height - padTop - padBottom) / 2 + fontSize * 0.15;
        pdf.text('Total', data.cell.x + padLeft, baselineY);
        subrayarTextoPdf(
          pdf,
          'Total',
          data.cell.x + padLeft,
          baselineY,
          colores.underlineRgb ?? colores.text
        );
        return;
      }

      if (fila.tipo === 'empleado' && fila.nombrePuesto) {
        const fontSize = 8;
        const padLeft = paddingCelda(data.cell.styles.cellPadding, 'left');
        const padTop = paddingCelda(data.cell.styles.cellPadding, 'top');
        const nombreY = data.cell.y + padTop + 7;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colores.text[0], colores.text[1], colores.text[2]);
        pdf.text(fila.nombrePuesto, data.cell.x + padLeft, data.cell.y + padTop + 3);
        pdf.text(fila.nombre, data.cell.x + padLeft, nombreY);
        subrayarTextoPdf(
          pdf,
          fila.nombre,
          data.cell.x + padLeft,
          nombreY,
          colores.underlineRgb ?? colores.text
        );
        return;
      }

      if (fila.tipo === 'empleado') {
        const fontSize = typeof data.cell.styles.fontSize === 'number' ? data.cell.styles.fontSize : 8;
        const padLeft = paddingCelda(data.cell.styles.cellPadding, 'left');
        const padTop = paddingCelda(data.cell.styles.cellPadding, 'top');
        const padBottom = paddingCelda(data.cell.styles.cellPadding, 'bottom');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);
        const baselineY =
          data.cell.y + padTop + (data.cell.height - padTop - padBottom) / 2 + fontSize * 0.15;
        subrayarTextoPdf(
          pdf,
          fila.nombre,
          data.cell.x + padLeft,
          baselineY,
          colores.underlineRgb ?? colores.text
        );
        return;
      }

      if (fila.tipo !== 'solicitud' || !fila.solicitud) return;

      const fontSize = 7;
      const padLeft = paddingCelda(data.cell.styles.cellPadding, 'left');
      const padRight = paddingCelda(data.cell.styles.cellPadding, 'right');
      const padTop = paddingCelda(data.cell.styles.cellPadding, 'top');
      const x = data.cell.x + padLeft;
      const y = data.cell.y + padTop + 1.5;
      const maxW = data.cell.width - padLeft - padRight;
      const lineHeight = 3.2;

      dibujarSegmentosConSalto(
        pdf,
        segmentosSolicitudLinea1(fila.solicitud),
        x,
        y,
        maxW,
        fontSize,
        colores.text
      );
      dibujarSegmentosConSalto(
        pdf,
        segmentosSolicitudLinea2(fila.solicitud),
        x,
        y + lineHeight,
        maxW,
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
