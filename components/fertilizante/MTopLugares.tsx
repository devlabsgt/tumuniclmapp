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
    .map(([lugar, cantidad]) => ({
      name: lugar,
      value: cantidad,
    }));

  return (
    <Dialog open={true} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <Dialog.Panel className="bg-white rounded-lg max-w-6xl w-full p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-bold text-gray-800">
              Estadísticas
            </Dialog.Title>
            <Button onClick={onClose} variant="ghost">Cerrar</Button>
          </div>

          {/* Gráfica de Barras */}
          <div className="w-full h-[400px]">
            <ResponsiveContainer>
              <BarChart
                data={datosGrafica}
                margin={{ top: 30, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  interval={0}
                  height={80}
                  tick={({ x, y, payload }) => {
                    const palabras = payload.value.split(' ');
                    return (
                      <g transform={`translate(${x},${y})`}>
                        {palabras.map((word: string, index: number) => (
                          <text
                            key={index}
                            x={0}
                            y={(index + 1) * 12}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#333"
                            fontWeight="bold"
                          >
                            {word}
                          </text>
                        ))}
                      </g>
                    );
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#333' }}
                  axisLine={true}
                  tickLine={true}
                  ticks={Array.from({ length: Math.ceil(Math.max(...datosGrafica.map(d => d.value)) / 50) + 1 }, (_, i) => i * 50)}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#06c" barSize={40}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    offset={10} // Espacio entre barra y número
                    style={{
                      fill: '#333',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla completa */}
          <div className="mt-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">Lugar</th>
                  <th className="p-2 border">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {datosGrafica.map(({ name, value }) => (
                  <tr key={name}>
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
