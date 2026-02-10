import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPdfMensualOficinas = (datosAgrupados: any, mesNombre: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [216, 330] });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight(); 

  Object.keys(datosAgrupados).forEach((oficina, index) => {
    if (index > 0) doc.addPage(); 
    const info = datosAgrupados[oficina];

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`INFORME No. ${info.informeNo}.`, width - 20, 20, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text(`Concepción Las Minas, Chiquimula.`, width - 20, 25, { align: 'right' });
    doc.text(`${new Date().getDate()} de ${mesNombre.toLowerCase()} del año 2,026.`, width - 20, 30, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.text("NELBIA SUCELY DUARTE RAMOS", 20, 45);
    doc.text("DIRECTORA DAFIM", 20, 50);
    doc.text("DIRECCIÓN DE ADMINISTRACIÓN FINANCIERA INTEGRADA MUNICIPAL", 20, 55);
    doc.text("MUNICIPALIDAD DE CONCEPCIÓN LAS MINAS, CHIQUIMULA.", 20, 60);

    doc.setFont("helvetica", "normal");
    doc.text("Reciba un Cordial Saludo,", 20, 75);

    const intro = `Por medio de la Presente me permito Trasladarle el informe sobre los cupones de combustibles consumidos para el funcionamiento de planes, programas y proyectos para el año 2026, correspondientes al mes de ${mesNombre.toUpperCase()} para iniciar el proceso de pago de factura.`;
    doc.text(intro, 20, 85, { maxWidth: 175, align: 'justify' });

    autoTable(doc, {
      startY: 105,
      margin: { left: 20, right: 20, bottom: 45 }, 
      theme: 'grid',
      head: [
        [{ 
            content: oficina.toUpperCase(), 
            colSpan: 6, 
            styles: { halign: 'center', fillColor: [255, 244, 190], textColor: [0, 0, 0], fontStyle: 'bold' } 
        }],
        ['No.', 'NUMERO DE CUPON', 'CANTIDAD', 'VEHÍCULO', 'FECHA', 'TIPO DE COMBUSTIBLE']
      ],
      body: info.items.map((d: any, i: number) => [
        i + 1,
        d.correlativoInicio === d.correlativoFin ? d.correlativoInicio : `${d.correlativoInicio} - ${d.correlativoFin}`,
        `Q${d.monto.toFixed(2)}`,
        d.placa,
        d.fecha,
        d.tipo
      ]),
      headStyles: { 
        fillColor: [255, 244, 190], 
        textColor: [0, 0, 0], 
        fontSize: 8, 
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.1 
      },
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      columnStyles: {
        2: { fontStyle: 'bold' },
        5: { fontStyle: 'bold' }
      },
      foot: [[
        { content: 'CANTIDAD TOTAL:', colSpan: 2, styles: { halign: 'left' } },
        `Q${info.items.reduce((s: number, i: any) => s + i.monto, 0).toFixed(2)}`,
        '', '', ''
      ]],
      footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9, lineColor: [0, 0, 0] },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 35; 

    if (finalY > height - 30) {
        doc.addPage();
        finalY = 40; 
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DIANA RAQUEL MARTÍNEZ MEJÍA", width / 2, finalY, { align: 'center' });
    doc.text("OFICIAL II DE LA DIRECCIÓN DE SECRETARÍA MUNICIPAL", width / 2, finalY + 5, { align: 'center' });
  });

  doc.save(`Reporte_Oficial_Combustible_${mesNombre}_2026.pdf`);
};