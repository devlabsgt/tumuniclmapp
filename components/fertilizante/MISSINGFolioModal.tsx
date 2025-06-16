'use client';

import { Dialog } from '@headlessui/react';
import { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  visible: boolean;
  onClose: () => void;
  beneficiarios: { codigo: string }[];
}

export default function MISSINGFolioModal({ visible, onClose, beneficiarios }: Props) {
  const foliosRegistrados = useMemo(() => {
    return beneficiarios.map(b => parseInt(b.codigo)).filter(n => !isNaN(n));
  }, [beneficiarios]);

  const faltantes = useMemo(() => {
    const total = [];
    for (let i = 2; i <= 7000; i++) {
      if (!foliosRegistrados.includes(i)) {
        total.push(i.toString().padStart(4, '0'));
      }
    }
    return total;
  }, [foliosRegistrados]);

const generarPdfFoliosFaltantes = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(16);
  doc.text('Listado de Folios Faltantes (0002 - 7000)', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Total faltantes: ${faltantes.length}`, pageWidth / 2, 28, { align: 'center' });

  // Reorganizar los folios en columnas de 4
  const filas = [];
  for (let i = 0; i < faltantes.length; i += 4) {
    filas.push([
      faltantes[i] || '',
      faltantes[i + 1] || '',
      faltantes[i + 2] || '',
      faltantes[i + 3] || '',
    ]);
  }

  autoTable(doc, {
    startY: 35,
    head: [['Columna 1', 'Columna 2', 'Columna 3', 'Columna 4']],
    body: filas,
    theme: 'grid',
    styles: {
      fontSize: 10,
      halign: 'center',
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 14, right: 14 },
  });

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

  return (
    <Dialog open={visible} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-3xl overflow-auto max-h-[80vh]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Folios faltantes (0002 - 7000):
            <span className="text-orange-600">({faltantes.length})</span>
          </h2>

          <div className="grid grid-cols-4 gap-2 text-sm max-h-[60vh] overflow-y-auto border rounded p-4 bg-gray-50">
            {faltantes.map((folio, idx) => (
              <div key={idx} className="text-center border-b py-1">
                {folio}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={generarPdfFoliosFaltantes}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Descargar PDF
            </button>

            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
