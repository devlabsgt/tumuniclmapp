'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Beneficiario {
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
  telefono?: string;
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

  // Logo
  doc.addImage(imgData, 'PNG', imgX, 5, imgWidth, imgHeight);

  // Título
  doc.setFontSize(18);
  doc.text('Listado de Beneficiarios del Programa de Fertilizante', pageWidth / 2, imgHeight + 15, {
    align: 'center',
  });

  // Resumen de Beneficiarios
  const total = beneficiarios.length;
  const hombres = beneficiarios.filter((b) => b.sexo?.toUpperCase() === 'M').length;
  const mujeres = beneficiarios.filter((b) => b.sexo?.toUpperCase() === 'F').length;

  doc.setFontSize(12);
  doc.text(`Total Beneficiarios: ${total} | Hombres: ${hombres} | Mujeres: ${mujeres}`, pageWidth / 2, imgHeight + 25, {
    align: 'center',
  });

  const tableStartY = imgHeight + 30;

  const beneficiariosPorPagina = 10;
  const paginas = Math.ceil(beneficiarios.length / beneficiariosPorPagina);

  for (let i = 0; i < paginas; i++) {
    const inicio = i * beneficiariosPorPagina;
    const fin = inicio + beneficiariosPorPagina;
    const beneficiariosPagina = beneficiarios.slice(inicio, fin);

    const body = beneficiariosPagina.map((b) => [
      b.nombre_completo || 'N/A',
      b.dpi || 'N/A',
      b.telefono || 'N/A',  // 👉 Aquí agregamos Teléfono
      b.lugar || 'N/A',
      b.fecha || 'N/A',
      b.codigo || 'N/A',
      b.sexo?.toUpperCase() === 'M' || b.sexo?.toUpperCase() === 'F' ? b.sexo?.toUpperCase() : 'N/A',
    ]);

    autoTable(doc, {
      startY: i === 0 ? tableStartY : 20,
      head: [['Nombre Completo', 'DPI', 'Teléfono', 'Lugar', 'Fecha', 'Formulario', 'Sexo']], // 👉 Aquí agregamos el encabezado Teléfono
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
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    });

    if (i < paginas - 1) {
      doc.addPage();
    }
  }

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}
