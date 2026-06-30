'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts';
import {
  Building2,
  Users,
  Wallet,
  PackageSearch,
  BarChart3,
  Loader2,
  X,
} from 'lucide-react';
import { FilaReporteInventario } from '../lib/schemas';
import {
  calcularEstadisticasInventario,
  EstadisticasInventario,
  FiltroEstadoInventario,
  ItemEstadistica,
} from '../lib/estadisticasInventario';

type LimiteTop = '10' | '20' | 'todos';

const LIMITE_DEFAULT: LimiteTop = '10';

const limitarLista = <T,>(data: T[], limite: LimiteTop) =>
  limite === 'todos' ? data : data.slice(0, Number(limite));

interface Props {
  open: boolean;
  onClose: () => void;
  filas: FilaReporteInventario[];
  cargando?: boolean;
  estadoFiltroContexto?: string;
}

const PALETA = [
  '#3b82f6',
  '#a855f7',
  '#ef4444',
  '#f97316',
  '#10b981',
  '#eab308',
  '#06b6d4',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
];

const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 2,
  }).format(monto);

const formatearCompacto = (monto: number) => {
  if (monto >= 1000) return `Q${(monto / 1000).toFixed(monto >= 10000 ? 0 : 1)}k`;
  return `Q${monto}`;
};

const truncar = (texto: string, max = 22) =>
  texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: ItemEstadistica & { etiqueta?: string };
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (!data) return null;
  
  return (
    <div className="bg-white/95 dark:bg-neutral-900/95 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-neutral-800 text-sm backdrop-blur-md">
      <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
        {data.etiqueta || data.nombre}
      </p>
      <div className="space-y-1">
        <p className="text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {formatearQ(data.total)}
          </span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          {data.cantidad} bienes registrados
        </p>
        {data.detalle && (
          <p className="text-xs text-slate-400 italic">({data.detalle})</p>
        )}
      </div>
    </div>
  );
};

export default function EstadisticasInventarioModal({
  open,
  onClose,
  filas,
  cargando = false,
  estadoFiltroContexto = 'Activo',
}: Props) {
  const [limite, setLimite] = useState<LimiteTop>(LIMITE_DEFAULT);
  
  // Inicializar el filtro del modal según el filtro principal
  const [filtro, setFiltro] = useState<FiltroEstadoInventario>(() => {
    if (estadoFiltroContexto === 'Inactivo') return 'inactivos';
    if (estadoFiltroContexto === 'Todos') return 'todos';
    return 'activos';
  });

  // Si el filtro contexto cambia externamente mientras el modal está cerrado, actualizar
  useEffect(() => {
    if (open) {
      if (estadoFiltroContexto === 'Inactivo') setFiltro('inactivos');
      else if (estadoFiltroContexto === 'Todos') setFiltro('todos');
      else setFiltro('activos');
    }
  }, [open, estadoFiltroContexto]);

  const stats = useMemo(() => {
    if (cargando || !filas.length) return null;
    return calcularEstadisticasInventario(filas, filtro);
  }, [filas, filtro, cargando]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        aria-describedby={undefined}
        className="max-w-full w-screen h-screen p-0 m-0 rounded-none overflow-hidden bg-slate-50 dark:bg-neutral-950 border-0 flex flex-col shadow-2xl"
      >
        <div className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Estadísticas de Inventario
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Resumen analítico de los bienes municipales
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={limite} onValueChange={(val: LimiteTop) => setLimite(val)}>
              <SelectTrigger className="w-[120px] h-9 bg-slate-50 border-slate-200 dark:bg-neutral-800 dark:border-neutral-700">
                <SelectValue placeholder="Mostrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-500 dark:text-slate-400 transition-colors ml-2"
              title="Cerrar estadísticas"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
          {cargando ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-neutral-950/50 backdrop-blur-sm z-20">
              <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Procesando datos...</p>
            </div>
          ) : !stats ? (
            <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              No hay datos disponibles para mostrar
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Tarjetas de Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Valor Total"
                  value={formatearQ(stats.granTotal)}
                  icon={<Wallet size={20} />}
                  color="blue"
                  subtitle={`Promedio: ${formatearQ(stats.promedioPorBien)} / bien`}
                />
                <StatCard
                  title="Cantidad de Bienes"
                  value={stats.totalBienes.toLocaleString('es-GT')}
                  icon={<PackageSearch size={20} />}
                  color="indigo"
                  subtitle="Artículos registrados"
                />
                <StatCard
                  title="Personas Asignadas"
                  value={stats.totalPersonas.toLocaleString('es-GT')}
                  icon={<Users size={20} />}
                  color="emerald"
                  subtitle={`Promedio: ${formatearQ(stats.promedioPorPersona)} / persona`}
                />
                <StatCard
                  title="Dependencias"
                  value={stats.totalDependencias.toLocaleString('es-GT')}
                  icon={<Building2 size={20} />}
                  color="amber"
                  subtitle="Áreas involucradas"
                />
              </div>

              {/* Gráficos de Distribución */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Por Área (Top)">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={limitarLista(stats.porArea, '10')}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        cornerRadius={8}
                        stroke="none"
                        dataKey="total"
                        label={({ x, y, cx, value }) => (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#94a3b8" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central" 
                            fontSize={12} 
                            fontWeight="bold"
                          >
                            {Number(value).toLocaleString('es-GT')}
                          </text>
                        )}
                        labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                      >
                        {limitarLista(stats.porArea, '10').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETA[index % PALETA.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <CustomLegend data={limitarLista(stats.porArea, '10')} />
                </ChartContainer>

                <ChartContainer title="Distribución de Asignación">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={stats.porAsignacion}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        cornerRadius={8}
                        stroke="none"
                        dataKey="total"
                        label={({ x, y, cx, value }) => (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#94a3b8" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central" 
                            fontSize={12} 
                            fontWeight="bold"
                          >
                            {Number(value).toLocaleString('es-GT')}
                          </text>
                        )}
                        labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                      >
                        {stats.porAsignacion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETA[index % PALETA.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <CustomLegend data={stats.porAsignacion} />
                </ChartContainer>
              </div>

              {/* Listas Top */}
              <div className="grid grid-cols-1 gap-6">
                <ListContainer title="Top Dependencias (por valor)">
                  <TopList data={limitarLista(stats.porDepartamento, limite)} totalMax={stats.porDepartamento[0]?.total || 1} />
                </ListContainer>
                
                <ListContainer title="Top Empleados (por valor)">
                  <TopList data={limitarLista(stats.porPersona, limite)} totalMax={stats.porPersona[0]?.total || 1} />
                </ListContainer>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  }[color as string];

  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorClasses} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5 tracking-tight">
          {value}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function ChartContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] relative">
        {children}
      </div>
    </div>
  );
}

function CustomLegend({ data }: { data: ItemEstadistica[] }) {
  const totalSum = data.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="flex flex-col gap-2 mt-6 w-full">
      {data.map((entry, index) => {
        const color = PALETA[index % PALETA.length];
        const pct = totalSum > 0 ? ((entry.total / totalSum) * 100).toFixed(1) : '0.0';
        return (
          <div key={`legend-${index}`} className="flex flex-col bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-slate-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-bold text-sm" style={{ color }}>
                {entry.nombre}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400 ml-5">
              <span>{formatearQ(entry.total)}</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">
                · {entry.cantidad} bienes · {pct}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm h-full flex flex-col overflow-hidden">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-5 uppercase tracking-wider shrink-0">
        {title}
      </h3>
      <div className="flex-1 overflow-x-auto pb-2 scrollbar-hide">
        <div className="min-w-full w-max pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function TopList({ data, totalMax }: { data: ItemEstadistica[]; totalMax: number }) {
  if (!data.length) {
    return <div className="text-sm text-slate-400 py-4 text-center">Sin datos en esta categoría</div>;
  }

  return (
    <div className="space-y-5">
      {data.map((item, i) => {
        const pct = Math.max((item.total / totalMax) * 100, 2);
        return (
          <div key={i} className="group">
            <div className="flex flex-col mb-2 gap-1">
              <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {item.nombre}
                </span>
                {item.detalle && (
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-[13px]">
                    {item.detalle}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400">
                <span>{formatearQ(item.total)}</span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  · {item.cantidad} bienes
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: PALETA[i % PALETA.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
