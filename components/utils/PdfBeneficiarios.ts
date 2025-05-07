'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Beneficiario {
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
  sexo?: string;
}

export async function generarPdfBeneficiarios(beneficiarios: Beneficiario[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    format: 'legal',
  });

  const logoUrl = '/images/logo.png';

  const img = await fetch(logoUrl).then((res) => res.blob());
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
  doc.text('Listado de Beneficiarios del Programa de Fertilizante', pageWidth / 2, imgHeight + 15, {
    align: 'center',
  });

  const body = beneficiarios.map((b) => [
    b.nombre_completo,
    b.dpi,
    b.lugar,
    b.fecha,
    b.codigo,
    b.sexo === 'M' ? 'Masculino' : b.sexo === 'F' ? 'Femenino' : 'N/A',
  ]);

  const tableStartY = imgHeight + 20;

  autoTable(doc, {
    startY: tableStartY,
    head: [['Nombre Completo', 'DPI', 'Lugar', 'Fecha', 'Código', 'Sexo']],
    body,
    theme: 'grid',
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
    margin: { left: 10, right: 10 },
  });

  // Firma
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  const lineWidth = 100;
  const lineX = (pageWidth - lineWidth) / 2;

  doc.setDrawColor(0);
  doc.line(lineX, finalY, lineX + lineWidth, finalY);

  doc.setFontSize(12);
  doc.text('Licda. Katty Anabelli Martínez López', pageWidth / 2, finalY + 10, { align: 'center' });

  doc.setFontSize(10);
  doc.text('Coordinador(a) de la Oficina Municipal de Recursos Humanos', pageWidth / 2, finalY + 16, { align: 'center' });

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}
