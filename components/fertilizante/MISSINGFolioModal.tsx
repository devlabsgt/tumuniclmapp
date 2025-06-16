'use client';

import { Dialog } from '@headlessui/react';
import { useMemo } from 'react';

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
    for (let i = 2; i <= 6000; i++) {
      if (!foliosRegistrados.includes(i)) {
        total.push(i.toString().padStart(4, '0'));
      }
    }
    return total;
  }, [foliosRegistrados]);

  return (
    <Dialog open={visible} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-3xl overflow-auto max-h-[80vh]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Folios faltantes (0002 - 6000)
            <span className="text-orange-600">({faltantes.length})</span>
          </h2>

          <div className="grid grid-cols-4 gap-2 text-sm max-h-[60vh] overflow-y-auto border rounded p-4 bg-gray-50">
            {faltantes.map((folio, idx) => (
              <div key={idx} className="text-center border-b py-1">
                {folio}
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
