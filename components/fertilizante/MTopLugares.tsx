'use client';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import type {MTopLugaresProps} from './types';


export default function MTopLugares({ conteoPorLugar, onClose }: MTopLugaresProps) {
  // Filtrar los lugares con al menos un saco
  const lugaresConCantidad = Object.entries(conteoPorLugar).filter(([, cantidad]) => cantidad > 0);

  const totalEntregados = lugaresConCantidad.reduce((sum, [, cantidad]) => sum + cantidad, 0);

  const datosGrafica = lugaresConCantidad
    .sort((a, b) => b[1] - a[1])
    .map(([lugar, cantidad], index) => ({
      index: index + 1,
      name: `${lugar} (${((cantidad / totalEntregados) * 100).toFixed(1)}%)`,
      value: cantidad,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded px-3 py-2 text-xs shadow">
          <p><strong>{data.name}</strong></p>
          <p>Sacos entregados: {data.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-6xl transform overflow-hidden bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <DialogTitle as="h3" className="text-2xl font-bold text-gray-800">
                    Sacos entregados: {totalEntregados}
                  </DialogTitle>
                  <Button onClick={onClose} variant="ghost">Cerrar</Button>
                </div>

                <div className="w-full overflow-x-auto max-h-[80vh] overflow-y-scroll pr-2">
                <div style={{ width: '100%', height: `${datosGrafica.length * 70}px`, minHeight: '500px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosGrafica}
                      layout="vertical"
                      margin={{ top: 20, right: 60, left: 0, bottom: 10 }}
                      barCategoryGap={60} // Aumentamos la separación entre barras
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 20, fill: '#333' }}
                          allowDecimals={false}
                          domain={[0, 'dataMax + 50']}
                          tickCount={Math.ceil((Math.max(...datosGrafica.map(d => d.value)) + 50) / 100)}
                          interval={0}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 20, fill: '#333' }}
                          width={240}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#06c" barSize={30}> {/* Aumentamos el grosor de la barra */}
                          <LabelList
                            dataKey="value"
                            position="right"
                            style={{ fill: '#333', fontSize: 16, fontWeight: 'bold' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
