'use client';

import { Dialog } from '@headlessui/react';
import { Fragment, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import type { Beneficiario, MTopLugaresProps } from './types';

type ModoVista = 'cantidad' | 'beneficiario';

const COLOR_BARRA = '#4F7FE0';
const RADIO_BARRA_HORIZONTAL: [number, number, number, number] = [4, 12, 12, 4];

const calcularPorLugar = (beneficiarios: Beneficiario[]) => {
  const cantidad: Record<string, number> = {};
  const beneficiariosPorLugar: Record<string, number> = {};

  beneficiarios
    .filter((b) => b.estado !== 'Anulado')
    .forEach((b) => {
      if (!b.lugar) return;
      const ctd = b.cantidad ?? 0;
      if (ctd <= 0) return;
      cantidad[b.lugar] = (cantidad[b.lugar] || 0) + ctd;
      beneficiariosPorLugar[b.lugar] = (beneficiariosPorLugar[b.lugar] || 0) + 1;
    });

  return { cantidad, beneficiariosPorLugar };
};

const EtiquetaLugarHorizontal = ({
  x,
  y,
  width,
  value,
}: {
  x?: number;
  y?: number;
  width?: number;
  value?: string;
}) => {
  if (x == null || y == null || !value) return null;

  return (
    <text
      x={x + 8}
      y={y - 8}
      fill="#475569"
      textAnchor="start"
      fontSize={14}
      fontWeight={600}
    >
      {value}
    </text>
  );
};

export default function MTopLugares({ beneficiarios, onClose }: MTopLugaresProps) {
  const [modo, setModo] = useState<ModoVista>('cantidad');

  const { cantidad, beneficiariosPorLugar } = useMemo(
    () => calcularPorLugar(beneficiarios),
    [beneficiarios],
  );

  const totalCantidad = useMemo(
    () => Object.values(cantidad).reduce((sum, n) => sum + n, 0),
    [cantidad],
  );

  const totalBeneficiarios = useMemo(
    () => Object.values(beneficiariosPorLugar).reduce((sum, n) => sum + n, 0),
    [beneficiariosPorLugar],
  );

  const datosGrafica = useMemo(() => {
    const mapa = modo === 'cantidad' ? cantidad : beneficiariosPorLugar;
    const total = modo === 'cantidad' ? totalCantidad : totalBeneficiarios;

    return Object.entries(mapa)
      .filter(([, valor]) => valor > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([lugar, valor]) => ({
        lugar,
        valor,
        porcentaje: total ? ((valor / total) * 100).toFixed(1) : '0.0',
        etiqueta: `${lugar} (${total ? ((valor / total) * 100).toFixed(1) : '0.0'}%)`,
      }));
  }, [modo, cantidad, beneficiariosPorLugar, totalCantidad, totalBeneficiarios]);

  const alturaGrafica = Math.max(480, datosGrafica.length * 64);

  const botonModo = (valor: ModoVista, etiqueta: string, activo: string) => (
    <button
      type="button"
      onClick={() => setModo(valor)}
      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
        modo === valor
          ? activo
          : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <Dialog open={true} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3">
        <Dialog.Panel className="bg-white dark:bg-neutral-900 rounded-xl w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] flex flex-col overflow-hidden p-4 sm:p-5 shadow-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-3 shrink-0">
            <Dialog.Title className="text-xl sm:text-2xl lg:text-3xl text-gray-800 dark:text-gray-200 leading-tight min-w-0">
              Sacos por lugar{' '}
              <span className="font-bold block sm:inline mt-1 sm:mt-0">
                ({totalCantidad} sacos | {totalBeneficiarios} beneficiarios)
              </span>
            </Dialog.Title>
            <div className="flex flex-wrap gap-2 shrink-0">
              {botonModo(
                'cantidad',
                `Cantidad (${totalCantidad})`,
                'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
              )}
              {botonModo(
                'beneficiario',
                `Beneficiarios (${totalBeneficiarios})`,
                'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
              )}
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="shrink-0 text-base self-end lg:ml-auto lg:self-center"
            >
              Cerrar
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gradient-to-b from-gray-50/80 to-white dark:from-neutral-800/40 dark:to-neutral-900 px-3 sm:px-4 py-4 shadow-sm">
            {datosGrafica.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-16 text-lg">
                No hay datos para mostrar.
              </p>
            ) : (
              <div style={{ width: '100%', height: alturaGrafica }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={datosGrafica}
                    layout="vertical"
                    margin={{ top: 28, right: 56, left: 8, bottom: 8 }}
                    barCategoryGap="28%"
                  >
                    <defs>
                      <linearGradient id="gradTopLugares" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={COLOR_BARRA} />
                        <stop offset="100%" stopColor="#7BA4FF" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 14, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="lugar"
                      hide
                      width={0}
                    />
                    <Tooltip content={() => null} cursor={false} />
                    <Bar
                      dataKey="valor"
                      fill="url(#gradTopLugares)"
                      radius={RADIO_BARRA_HORIZONTAL}
                      barSize={28}
                    >
                      <LabelList
                        dataKey="etiqueta"
                        content={(props) => <EtiquetaLugarHorizontal {...props} />}
                      />
                      <LabelList
                        dataKey="valor"
                        position="right"
                        offset={8}
                        style={{ fontSize: 14, fontWeight: 700, fill: '#475569' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
