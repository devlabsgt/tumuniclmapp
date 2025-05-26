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

interface MTopLugaresProps {
  conteoPorLugar: Record<string, number>;
  onClose: () => void;
}

export default function MTopLugares({ conteoPorLugar, onClose }: MTopLugaresProps) {
  const datosGrafica = Object.entries(conteoPorLugar)
    .sort((a, b) => b[1] - a[1])
    .map(([lugar, cantidad], index) => ({
      index: index + 1,
      name: lugar,
      value: cantidad,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded px-3 py-2 text-xs shadow">
          <p><strong>{data.name}</strong></p>
          <p>Cantidad: {data.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={true} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <Dialog.Panel className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-bold text-gray-800">
              Estadísticas de entrega de abono por lugar
            </Dialog.Title>
            <Button onClick={onClose} variant="ghost">Cerrar</Button>
          </div>

          {/* Gráfica de Barras */}
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: '1000px', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosGrafica}
                  margin={{ top: 30, right: 20, left: 20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="index"
                    tick={{ fontSize:14, fill: '#333', fontWeight: 'bold' }}
                    label={{ value: 'No.', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    tick={{ fontSize: 14, fill: '#333' }}
                    ticks={Array.from(
                      { length: Math.ceil(Math.max(...datosGrafica.map(d => d.value)) / 50) + 1 },
                      (_, i) => i * 50
                    )}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#06c" barSize={20}>
                    <LabelList
                      dataKey="value"
                      position="top"
                      offset={10}
                      style={{
                        fill: '#333',
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla completa */}
          <div className="mt-6">
            <table className="w-full border-collapse text-lg">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">No.</th>
                  <th className="p-2 border">Lugar</th>
                  <th className="p-2 border">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {datosGrafica.map(({ index, name, value }) => (
                  <tr key={name}>
                    <td className="p-2 border text-center">{index}</td>
                    <td className="p-2 border">{name}</td>
                    <td className="p-2 border">{value}</td>
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
