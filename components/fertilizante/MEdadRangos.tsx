'use client';

import { Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface RangoEdadEstadistica {
  rango: string;
  total: number;
}

type RangoClave = 'jovenes' | 'adultoMenor' | 'adulto' | 'adultoMayor';

interface MEdadRangosProps {
  conteoPorEdad: RangoEdadEstadistica[];
  detallePorLugar: Record<string, Record<RangoClave, {
    total: number;
    hombres: number;
    mujeres: number;
  }>>;
  onClose: () => void;
}

export default function MEdadRangos({ conteoPorEdad, detallePorLugar, onClose }: MEdadRangosProps) {
  const clavesRango: RangoClave[] = ['jovenes', 'adultoMenor', 'adulto', 'adultoMayor'];

  const totalPorRango: Record<RangoClave, { hombres: number; mujeres: number; total: number }> = {
    jovenes: { hombres: 0, mujeres: 0, total: 0 },
    adultoMenor: { hombres: 0, mujeres: 0, total: 0 },
    adulto: { hombres: 0, mujeres: 0, total: 0 },
    adultoMayor: { hombres: 0, mujeres: 0, total: 0 },
  };

  for (const lugar of Object.values(detallePorLugar)) {
    for (const rango of clavesRango) {
      const datos = lugar[rango];
      if (!datos) continue;
      totalPorRango[rango].hombres += datos.hombres;
      totalPorRango[rango].mujeres += datos.mujeres;
      totalPorRango[rango].total += datos.total;
    }
  }

  const totalHombres = Object.values(totalPorRango).reduce((acc, curr) => acc + curr.hombres, 0);
  const totalMujeres = Object.values(totalPorRango).reduce((acc, curr) => acc + curr.mujeres, 0);
  const totalGeneral = Object.values(totalPorRango).reduce((acc, curr) => acc + curr.total, 0);

  return (
    <Dialog open={true} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <Dialog.Panel className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl text-gray-800">
              Rangos de Edad <span className='font-bold'>({totalGeneral} Personas | Hombres: {totalHombres} | Mujeres: {totalMujeres})</span>
            </Dialog.Title>
            <Button onClick={onClose} variant="ghost">Cerrar</Button>
          </div>

          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: '800px', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conteoPorEdad}
                  margin={{ top: 30, right: 20, left: 20, bottom: 0 }}
                >
                  <XAxis dataKey="rango" tick={{ fontSize: 16 }} />
                  <YAxis tick={{ fontSize: 16 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#06c" barSize={100}>
                    <LabelList dataKey="total" position="top" style={{ fill: '#000', fontSize: 20, fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6">
            <table className="w-full border-collapse text-sm text-center border border-gray-400">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th rowSpan={2} className="p-2 border border-gray-400 align-middle">Lugar</th>
                  <th colSpan={3} className="p-2 border border-gray-400">Jóvenes<br/><span className="text-[10px]">(18-25)</span></th>
                  <th colSpan={3} className="p-2 border border-gray-400">Adulto menor<br/><span className="text-[10px]">(26-35)</span></th>
                  <th colSpan={3} className="p-2 border border-gray-400">Adultos<br/><span className="text-[10px]">(36-59)</span></th>
                  <th colSpan={3} className="p-2 border border-gray-400">Adulto mayor<br/><span className="text-[10px]">(60+)</span></th>
                </tr>
                <tr className="bg-gray-100">
                  {[...Array(4)].flatMap((_, i) => [
                    <th key={`h-${i}`} className="p-2 border border-gray-400">Hombres</th>,
                    <th key={`m-${i}`} className="p-2 border border-gray-400">Mujeres</th>,
                    <th key={`t-${i}`} className="p-2 border border-gray-400">Total</th>
                  ])}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50 font-bold hover:bg-green-100">
                  <td className="p-2 sticky left-0 bg-green-100 z-10 border border-gray-400">Total</td>
                  {clavesRango.flatMap((r) => [
                    <td key={`${r}-h`} className="p-2 border border-gray-400">{totalPorRango[r].hombres}</td>,
                    <td key={`${r}-m`} className="p-2 border border-gray-400">{totalPorRango[r].mujeres}</td>,
                    <td key={`${r}-t`} className="p-2 border border-gray-400">{totalPorRango[r].total}</td>
                  ])}
                </tr>
                {Object.entries(detallePorLugar).map(([lugar, rangos]) => (
                  <tr key={lugar} className="hover:bg-gray-100">
                    <td className="p-2 font-bold bg-white sticky left-0 z-10 border border-gray-400">{lugar}</td>
                    {clavesRango.flatMap((r) => {
                      const datos = rangos[r] ?? { hombres: 0, mujeres: 0, total: 0 };
                      return [
                        <td key={`${r}-h-${lugar}`} className="p-2 border border-gray-400">{datos.hombres}</td>,
                        <td key={`${r}-m-${lugar}`} className="p-2 border border-gray-400">{datos.mujeres}</td>,
                        <td key={`${r}-t-${lugar}`} className="p-2 border border-gray-400">{datos.total}</td>
                      ];
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
