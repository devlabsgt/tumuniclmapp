'use client';

import { Dialog } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';

interface MTopLugaresProps {
  conteoPorLugar: Record<string, number>;
  onClose: () => void;
}

export default function MTopLugares({ conteoPorLugar, onClose }: MTopLugaresProps) {
  const lugares = Object.entries(conteoPorLugar).sort((a, b) => b[1] - a[1]);

  const [paginaActual, setPaginaActual] = useState(0);
  const porPagina = 10;

  const totalPaginas = Math.ceil(lugares.length / porPagina);
  const desde = paginaActual * porPagina;
  const hasta = desde + porPagina;
  const actuales = lugares.slice(desde, hasta);

  const cambiarPagina = (dir: number) => {
    setPaginaActual((prev) => Math.min(Math.max(prev + dir, 0), totalPaginas - 1));
  };

  return (
    <Dialog open={true} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <Dialog.Panel className="bg-white rounded-lg max-w-lg w-full p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <Dialog.Title className="text-xl font-bold text-gray-800">
              Lugares con beneficiarios
            </Dialog.Title>
            <Button onClick={onClose} variant="ghost">Cerrar</Button>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">Lugar</th>
                <th className="p-2 border">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {actuales.map(([lugar, cantidad]) => (
                <tr key={lugar}>
                  <td className="p-2 border">{lugar}</td>
                  <td className="p-2 border">{cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <Button onClick={() => cambiarPagina(-1)} disabled={paginaActual === 0}>
              Anterior
            </Button>
            <span className="text-gray-600">
              Página {paginaActual + 1} de {totalPaginas}
            </span>
            <Button onClick={() => cambiarPagina(1)} disabled={paginaActual >= totalPaginas - 1}>
              Siguiente
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
