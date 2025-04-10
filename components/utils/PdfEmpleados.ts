'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Empleado {
  direccion?: string;
  telefono?: string;
  dpi?: string;
  nit?: string;
  igss?: string;
  cargo?: string;
  banco?: string;
  cuenta?: string;
  sueldo?: number;
  bonificacion?: number;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  contrato_no?: string;
  renglon?: string;
}

interface Usuario {
  nombre: string;
  email: string;
  rol: string;
}

export async function generarPdfEmpleado(usuario: Usuario, empleado?: Empleado) {
  const doc = new jsPDF();

  const logoUrl = '/images/logo.png';

  const img = await fetch(logoUrl).then(res => res.blob());
  const imgData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(img);
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const imgWidth = 60;
  const imgHeight = (imgWidth * 9) / 16;
  const imgX = (pageWidth - imgWidth) / 2;

  doc.addImage(imgData, 'PNG', imgX, 5, imgWidth, imgHeight);

  doc.setFontSize(18);
  doc.text('Informe Datos de Empleado Municipal', pageWidth / 2, imgHeight + 15, { align: 'center' });

  const rows = [
    ['Nombre', usuario.nombre],
    ['Correo', usuario.email],
    ...(empleado
      ? [
          ['Dirección', empleado.direccion ?? '—'],
          ['Teléfono', empleado.telefono ?? '—'],
          ['DPI', empleado.dpi ?? '—'],
          ['NIT', empleado.nit ?? '—'],
          ['IGSS', empleado.igss ?? '—'],
          ['Cargo', empleado.cargo ?? '—'],
          ['Banco', empleado.banco ?? '—'],
          ['Cuenta', empleado.cuenta ?? '—'],
          ['Sueldo', empleado.sueldo ? `Q ${empleado.sueldo.toFixed(2)}` : '—'],
          ['Bonificación', empleado.bonificacion ? `Q ${empleado.bonificacion.toFixed(2)}` : '—'],
          ['Fecha de Inicio', empleado.fecha_inicio ?? '—'],
          ['Fecha de Finalización', empleado.fecha_finalizacion ?? '—'],
          ['Contrato No.', empleado.contrato_no ?? '—'],
          ['Renglón', empleado.renglon ?? '—'],
        ]
      : []),
  ];

  const tableTotalWidth = 50 + 60;
  const marginX = (pageWidth - tableTotalWidth) / 2;

  autoTable(doc, {
    startY: imgHeight + 20,
    body: rows,
    theme: 'grid',
    tableWidth: tableTotalWidth,
    margin: { left: marginX },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 60 },
    },
    styles: {
      halign: 'left',
      valign: 'middle',
      fontSize: 10,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      cellPadding: 3,
    },
    headStyles: { fillColor: [255, 255, 255] },
    bodyStyles: { fillColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [255, 255, 255] },
  });

  // Agregar línea para firma
  const finalY = (doc as any).lastAutoTable.finalY + 30; // posición final de la tabla
  const lineWidth = 100;
  const lineX = (pageWidth - lineWidth) / 2;

  doc.setDrawColor(0);
  doc.line(lineX, finalY, lineX + lineWidth, finalY); // Línea horizontal

  // Nombre de la persona
  doc.setFontSize(12);
  doc.text('Licda. Katty Anabelli Martínez López', pageWidth / 2, finalY + 10, { align: 'center' });

  // Cargo
  doc.setFontSize(10);
  doc.text('Coordinador(a) de la Oficina Municipal de Recursos Humanos', pageWidth / 2, finalY + 16, { align: 'center' });

  // Abrir en una nueva pestaña
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}
