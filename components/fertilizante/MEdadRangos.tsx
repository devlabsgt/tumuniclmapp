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
  CartesianGrid,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';

type RangoClave = 'jovenes' | 'adultoMenor' | 'adulto' | 'adultoMayor';

const COLORES_GRAFICA = {
  hombres: '#4F7FE0',
  mujeres: '#D96B63',
  total: '#4FAF7C',
} as const;

const RADIO_BARRA: [number, number, number, number] = [12, 12, 4, 4];

interface MEdadRangosProps {
  conteoPorEdad: { rango: string; total: number }[];
  detallePorLugar: Record<
    string,
    Record<
      RangoClave,
      {
        total: number;
        hombres: number;
        mujeres: number;
      }
    >
  >;
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

const datosPorRango = clavesRango.map((clave) => {
  const hombres = totalPorRango[clave].hombres;
  const mujeres = totalPorRango[clave].mujeres;
  const total = hombres + mujeres;

  const nombre =
    clave === 'jovenes'
      ? 'Jóvenes'
      : clave === 'adultoMenor'
      ? 'Adulto menor'
      : clave === 'adulto'
      ? 'Adultos'
      : 'Adulto mayor';

  const porcentajeTotal = totalGeneral
    ? ((total / totalGeneral) * 100).toFixed(1)
    : '0.0';

  return {
    etiqueta: `${nombre} (${porcentajeTotal}%)`,
    hombres,
    mujeres,
    total,
  };
});

const datosGrafica = [
  {
    etiqueta: 'Gran Total (100%)',
    hombres: totalHombres,
    mujeres: totalMujeres,
    total: totalGeneral,
  },
  ...datosPorRango,
];


  return (
    <Dialog open={true} onClose={onClose} as={Fragment}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3">
        <Dialog.Panel className="bg-white dark:bg-neutral-900 rounded-xl w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] flex flex-col overflow-hidden p-4 sm:p-5 shadow-2xl">
          <div className="flex justify-between items-start gap-4 mb-3 shrink-0">
            <Dialog.Title className="text-xl sm:text-2xl lg:text-3xl text-gray-800 dark:text-gray-200 leading-tight">
              Rangos de Edad{' '}
              <span className="font-bold block sm:inline mt-1 sm:mt-0">
                ({totalGeneral} Personas |{' '}
                <span style={{ color: COLORES_GRAFICA.hombres }}>Hombres: {totalHombres}</span> |{' '}
                <span style={{ color: COLORES_GRAFICA.mujeres }}>Mujeres: {totalMujeres}</span>)
              </span>
            </Dialog.Title>
            <Button onClick={onClose} variant="ghost" className="shrink-0 text-base">
              Cerrar
            </Button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Gráfica */}
          <div className="flex-[1.35] min-h-[240px] w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gradient-to-b from-gray-50/80 to-white dark:from-neutral-800/40 dark:to-neutral-900 px-3 sm:px-4 pt-3 pb-1 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosGrafica}
                  margin={{ top: 12, right: 16, left: 4, bottom: 0 }}
                  barCategoryGap="16%"
                  barGap={8}
                >
                  <defs>
                    <linearGradient id="gradHombres" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7BA4FF" />
                      <stop offset="100%" stopColor={COLORES_GRAFICA.hombres} />
                    </linearGradient>
                    <linearGradient id="gradMujeres" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F0A9A3" />
                      <stop offset="100%" stopColor={COLORES_GRAFICA.mujeres} />
                    </linearGradient>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7DD3A8" />
                      <stop offset="100%" stopColor={COLORES_GRAFICA.total} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="etiqueta"
                    tick={{ fontSize: 14, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={0}
                    height={48}
                    tickMargin={8}
                    padding={{ left: 12, right: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 14, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip content={() => null} cursor={false} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={32}
                    iconSize={12}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 15, paddingBottom: 0, color: '#475569' }}
                    formatter={(value) =>
                      value.charAt(0).toUpperCase() + value.slice(1)
                    }
                  />
                  <Bar
                    dataKey="hombres"
                    name="hombres"
                    fill="url(#gradHombres)"
                    radius={RADIO_BARRA}
                    maxBarSize={72}
                  >
                    <LabelList
                      dataKey="hombres"
                      position="top"
                      style={{ fontSize: 14, fontWeight: 700, fill: '#475569' }}
                    />
                  </Bar>
                  <Bar
                    dataKey="mujeres"
                    name="mujeres"
                    fill="url(#gradMujeres)"
                    radius={RADIO_BARRA}
                    maxBarSize={72}
                  >
                    <LabelList
                      dataKey="mujeres"
                      position="top"
                      style={{ fontSize: 14, fontWeight: 700, fill: '#475569' }}
                    />
                  </Bar>
                  <Bar
                    dataKey="total"
                    name="total"
                    fill="url(#gradTotal)"
                    radius={RADIO_BARRA}
                    maxBarSize={72}
                  >
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fontSize: 14, fontWeight: 700, fill: '#475569' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>

          {/* Tabla */}
          <div className="flex-1 min-h-[140px] overflow-auto rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
            <table className="w-full border-collapse text-base text-center">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-800 text-sm text-gray-500 dark:text-gray-400">
                  <th rowSpan={2} className="p-3 border border-gray-400 dark:border-neutral-700 align-middle text-base">Lugar</th>
                  <th colSpan={3} className="p-3 border border-gray-400 dark:border-neutral-700">Jóvenes<br /><span className="text-xs">(18-25)</span></th>
                  <th colSpan={3} className="p-3 border border-gray-400 dark:border-neutral-700">Adulto menor<br /><span className="text-xs">(26-35)</span></th>
                  <th colSpan={3} className="p-3 border border-gray-400 dark:border-neutral-700">Adultos<br /><span className="text-xs">(36-59)</span></th>
                  <th colSpan={3} className="p-3 border border-gray-400 dark:border-neutral-700">Adulto mayor<br /><span className="text-xs">(60+)</span></th>
                </tr>
                <tr className="bg-gray-100 dark:bg-neutral-800/80 text-sm">
                  {[...Array(4)].flatMap((_, i) => [
                    <th key={`h-${i}`} className="p-3 border border-gray-400 dark:border-neutral-700">Hombres</th>,
                    <th key={`m-${i}`} className="p-3 border border-gray-400 dark:border-neutral-700">Mujeres</th>,
                    <th key={`t-${i}`} className="p-3 border border-gray-400 dark:border-neutral-700">Total</th>
                  ])}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50 dark:bg-green-900/20 font-bold hover:bg-green-100 dark:hover:bg-green-900/30 text-lg">
                  <td className="p-3 sticky left-0 bg-green-100 dark:bg-green-900/30 z-10 border border-gray-400 dark:border-neutral-700">Total</td>
                  {clavesRango.flatMap((r) => [
                    <td key={`${r}-h`} className="p-3 border border-gray-400 dark:border-neutral-700">{totalPorRango[r].hombres}</td>,
                    <td key={`${r}-m`} className="p-3 border border-gray-400 dark:border-neutral-700">{totalPorRango[r].mujeres}</td>,
                    <td key={`${r}-t`} className="p-3 border border-gray-400 dark:border-neutral-700">{totalPorRango[r].total}</td>
                  ])}
                </tr>
                {Object.entries(detallePorLugar).map(([lugar, rangos]) => (
                  <tr key={lugar} className="hover:bg-gray-100 dark:hover:bg-neutral-800/80 text-base">
                    <td className="p-3 font-bold bg-white dark:bg-neutral-900 sticky left-0 z-10 border border-gray-400 dark:border-neutral-700">{lugar}</td>
                    {clavesRango.flatMap((r) => {
                      const datos = rangos[r] ?? { hombres: 0, mujeres: 0, total: 0 };
                      return [
                        <td key={`${r}-h-${lugar}`} className="p-3 border border-gray-400 dark:border-neutral-700">{datos.hombres}</td>,
                        <td key={`${r}-m-${lugar}`} className="p-3 border border-gray-400 dark:border-neutral-700">{datos.mujeres}</td>,
                        <td key={`${r}-t-${lugar}`} className="p-3 border border-gray-400 dark:border-neutral-700">{datos.total}</td>
                      ];
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
