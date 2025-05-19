'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/Progress';
import MTopLugares from './MTopLugares';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
  telefono?: string;
  sexo?: string;
}

interface Props {
  data: Beneficiario[]; // TODOS los beneficiarios (no paginados)
}

export default function EstadisticasBeneficiarios({ data }: Props) {
  const totalMeta = 7000;
  const total = data.length;
  const hombres = data.filter((b) => b.sexo === 'M').length;
  const mujeres = data.filter((b) => b.sexo === 'F').length;
  const porcentaje = Math.min((total / totalMeta) * 100, 100);

  const conteoPorLugar = data.reduce((acc: Record<string, number>, curr) => {
    acc[curr.lugar] = (acc[curr.lugar] || 0) + 1;
    return acc;
  }, {});

  const top3 = Object.entries(conteoPorLugar)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const [mostrarModal, setMostrarModal] = useState(false);

  return (
    <div className="mb-4">
      <div className="text-lg font-bold text-green-700">
        <span className="text-green-800">Entregados: {total}</span> / {totalMeta} (
        {porcentaje.toFixed(2)}%) <br />
        
      </div>
     
      <div className="mt-2">
        <Progress value={porcentaje} className="h-3" />
      </div>
        <div className="text-lg font-bold text-gray-700">
            Hombres: <span className="text-gray-700 font-semibold">{hombres}</span> | 
            Mujeres: <span className="text-gray-700 font-semibold">{mujeres}</span>
        </div>
      <div className="mt-4">
        <div className="font-semibold mb-2">🏆 Top 3 lugares con más registros</div>
        <div className="flex gap-4">
          {top3.map(([lugar, cantidad]) => (
            <div
              key={lugar}
              onClick={() => setMostrarModal(true)}
              className="cursor-pointer px-3 py-2 border rounded shadow hover:bg-gray-100"
            >
              <div className="text-blue-600 font-bold">{lugar}</div>
              <div className="text-gray-700 text-sm">{cantidad} beneficiarios</div>
            </div>
          ))}
        </div>
        <div>
          <span className="text-gray-700 text-sm"> Haz click en cualquier tarjeta para ver estadísticas completas</span>
        </div>
      </div>

      {mostrarModal && (
        <MTopLugares
          conteoPorLugar={conteoPorLugar}
          onClose={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}
