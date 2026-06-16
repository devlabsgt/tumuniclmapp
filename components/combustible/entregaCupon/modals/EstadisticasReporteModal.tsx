'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  Users,
  Receipt,
  Wallet,
  TrendingUp,
  Fuel,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { FilaReporteDependencia } from '../lib/actions';
import SelectorPeriodoReporte from '../SelectorPeriodoReporte';
import {
  calcularEstadisticas,
  EstadisticasReporte,
  FiltroCombustible,
  ItemEstadistica,
} from '../lib/estadisticasReporte';

type LimiteTop = '10' | '20' | 'todos';

const LIMITE_DEFAULT: LimiteTop = '10';

const limitarLista = <T,>(data: T[], limite: LimiteTop) =>
  limite === 'todos' ? data : data.slice(0, Number(limite));

interface Props {
  open: boolean;
  onClose: () => void;
  filas: FilaReporteDependencia[];
  periodo: string;
  mesInicio: string;
  mesFin: string;
  onPeriodoChange: (inicio: string, fin: string) => void;
  cargando?: boolean;
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

const ChartTooltip = ({
  active,
  payload,
  label,
  modoMoneda = true,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  modoMoneda?: boolean;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const data = item.payload;
  const titulo = data?.nombre || data?.etiqueta || label || item.name || '';
  return (
    <div className="rounded-xl border border-slate-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[14rem] break-words">
        {titulo}
      </p>
      <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
        {modoMoneda ? formatearQ(Number(item.value ?? 0)) : item.value}
      </p>
      {data?.solicitudes != null && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {data.solicitudes} solicitud{data.solicitudes === 1 ? '' : 'es'}
        </p>
      )}
    </div>
  );
};

function KpiCard({
  icono,
  etiqueta,
  valor,
  detalle,
  color,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  detalle?: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm">
      <div
        className="absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-10"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-center gap-2">
        <div
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {icono}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-tight">
          {etiqueta}
        </p>
      </div>
      <p className="mt-2 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
        {valor}
      </p>
      {detalle && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{detalle}</p>
      )}
    </div>
  );
}

function SelectLimite({
  value,
  onChange,
}: {
  value: LimiteTop;
  onChange: (valor: LimiteTop) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LimiteTop)}>
      <SelectTrigger
        className="
          h-7 w-[5.75rem] shrink-0 gap-1 px-2 py-0
          border border-slate-200 dark:border-neutral-700
          bg-slate-50 dark:bg-neutral-800/60
          rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300
          shadow-none focus:ring-1 focus:ring-blue-500/30
        "
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[5.75rem]">
        <SelectItem value="10" className="text-xs font-semibold">
          Top 10
        </SelectItem>
        <SelectItem value="20" className="text-xs font-semibold">
          Top 20
        </SelectItem>
        <SelectItem value="todos" className="text-xs font-semibold">
          Todos
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function ChartCard({
  titulo,
  icono,
  descripcion,
  children,
  className = '',
  limite,
  onLimiteChange,
}: {
  titulo: string;
  icono: React.ReactNode;
  descripcion?: string;
  children: React.ReactNode;
  className?: string;
  limite: LimiteTop;
  onLimiteChange: (valor: LimiteTop) => void;
}) {
  return (
    <div
      className={`relative flex flex-col w-full min-w-0 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 pr-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            {icono}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {titulo}
            </h3>
            {descripcion && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                {descripcion}
              </p>
            )}
          </div>
        </div>
        <SelectLimite value={limite} onChange={onLimiteChange} />
      </div>
      <div className="flex-1 w-full min-w-0">{children}</div>
    </div>
  );
}

const SinDatos = ({ texto = 'Sin datos para mostrar' }: { texto?: string }) => (
  <div className="flex h-full min-h-[12rem] items-center justify-center text-sm text-slate-400">
    {texto}
  </div>
);

const COLOR_TODOS = '#3b82f6';
const COLOR_GASOLINA = '#10b981';
const COLOR_DIESEL = '#eab308';

const esGasolina = (nombre: string) => nombre.toLowerCase().includes('gasolina');
const esDiesel = (nombre: string) => nombre.toLowerCase().includes('diesel');

const colorCombustible = (nombre: string) => {
  if (esGasolina(nombre)) return COLOR_GASOLINA;
  if (esDiesel(nombre)) return COLOR_DIESEL;
  return '#8b5cf6';
};

const OPCIONES_COMBUSTIBLE: { id: FiltroCombustible; label: string; color: string }[] = [
  { id: 'todos', label: 'Todos', color: COLOR_TODOS },
  { id: 'gasolina', label: 'Gasolina', color: COLOR_GASOLINA },
  { id: 'diesel', label: 'Diesel', color: COLOR_DIESEL },
];

function SwitchCombustible({
  filtro,
  onChange,
}: {
  filtro: FiltroCombustible;
  onChange: (valor: FiltroCombustible) => void;
}) {
  return (
    <div className="flex w-full sm:w-auto rounded-xl sm:rounded-full border border-slate-200 dark:border-neutral-700 p-1 bg-white dark:bg-neutral-900 shadow-sm">
      {OPCIONES_COMBUSTIBLE.map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            className={`flex-1 sm:flex-initial px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-extrabold rounded-lg sm:rounded-full transition-all duration-200 ${
              filtro === op.id ? 'text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
            }`}
            style={filtro === op.id ? { backgroundColor: op.color } : undefined}
          >
          {op.label}
        </button>
      ))}
    </div>
  );
}

function GraficaCombustible({
  datos,
  granTotal,
  mostrarPorcentaje,
}: {
  datos: ItemEstadistica[];
  granTotal: number;
  mostrarPorcentaje: boolean;
}) {
  if (datos.length === 0) return <SinDatos />;

  return (
    <div className="flex flex-col w-full gap-3">
      <div className="h-[13rem] w-full max-w-[17rem] mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              data={datos}
              dataKey="total"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="82%"
              paddingAngle={datos.length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="none"
            >
              {datos.map((entry) => (
                <Cell key={entry.nombre} fill={colorCombustible(entry.nombre)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-2">
        {datos.map((item) => {
          const color = colorCombustible(item.nombre);
          const pct = granTotal > 0 ? (item.total / granTotal) * 100 : 0;
          return (
            <div
              key={item.nombre}
              className="w-full rounded-lg bg-slate-50 dark:bg-neutral-800/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-bold" style={{ color }}>
                  {item.nombre}
                </span>
              </div>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatearQ(item.total)}
                {item.solicitudes > 0 && (
                  <span>
                    {' '}
                    · {item.solicitudes} solicitud{item.solicitudes === 1 ? '' : 'es'}
                  </span>
                )}
                {mostrarPorcentaje && (
                  <span className="text-blue-500/80"> · {pct.toFixed(1)}%</span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarrasHorizontales({
  data,
  paletteOffset = 0,
  animKey,
}: {
  data: ItemEstadistica[];
  paletteOffset?: number;
  animKey: string;
}) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="w-full space-y-3 py-1">
      {data.map((item, i) => {
        const pct = (item.total / max) * 100;
        const color = PALETA[(i + paletteOffset) % PALETA.length];
        return (
          <div key={`${item.nombre}-${i}`} className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-baseline lg:gap-x-2 min-w-0">
              <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                {item.nombre}
              </p>
              {item.puesto && (
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 leading-snug mt-0.5 lg:mt-0 min-w-0 lg:truncate">
                  {item.puesto}
                </p>
              )}
            </div>
            <motion.p
              key={`${animKey}-monto-${item.nombre}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 mb-1"
            >
              {formatearQ(item.total)}
              {item.solicitudes > 0 && (
                <span className="font-semibold text-blue-500 dark:text-blue-400/80">
                  {' '}
                  · {item.solicitudes} solicitud{item.solicitudes === 1 ? '' : 'es'}
                </span>
              )}
            </motion.p>
            <div className="relative h-3.5 w-full rounded-r-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
              <motion.div
                key={`${animKey}-bar-${item.nombre}`}
                className="absolute inset-y-0 left-0 rounded-r-full min-w-[3px]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: 0.55,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: i * 0.05,
                }}
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EstadisticasReporteModal({
  open,
  onClose,
  filas,
  periodo,
  mesInicio,
  mesFin,
  onPeriodoChange,
  cargando = false,
}: Props) {
  const [filtro, setFiltro] = useState<FiltroCombustible>('todos');
  const [limitePersonas, setLimitePersonas] = useState<LimiteTop>(LIMITE_DEFAULT);
  const [limiteDepartamentos, setLimiteDepartamentos] = useState<LimiteTop>(LIMITE_DEFAULT);
  const [limiteAreas, setLimiteAreas] = useState<LimiteTop>(LIMITE_DEFAULT);
  const [limiteCombustible, setLimiteCombustible] = useState<LimiteTop>(LIMITE_DEFAULT);
  const [limiteTendencia, setLimiteTendencia] = useState<LimiteTop>(LIMITE_DEFAULT);

  useEffect(() => {
    if (!open) {
      setFiltro('todos');
      setLimitePersonas(LIMITE_DEFAULT);
      setLimiteDepartamentos(LIMITE_DEFAULT);
      setLimiteAreas(LIMITE_DEFAULT);
      setLimiteCombustible(LIMITE_DEFAULT);
      setLimiteTendencia(LIMITE_DEFAULT);
    }
  }, [open]);

  const stats: EstadisticasReporte = useMemo(
    () => calcularEstadisticas(filas, filtro),
    [filas, filtro]
  );

  const datosPersonas = useMemo(
    () => limitarLista(stats.porPersona, limitePersonas),
    [stats.porPersona, limitePersonas]
  );
  const datosDepartamentos = useMemo(
    () => limitarLista(stats.porDepartamento, limiteDepartamentos),
    [stats.porDepartamento, limiteDepartamentos]
  );
  const datosAreas = useMemo(
    () => limitarLista(stats.porArea, limiteAreas),
    [stats.porArea, limiteAreas]
  );
  const datosCombustible = useMemo(
    () => limitarLista(stats.porCombustible, limiteCombustible),
    [stats.porCombustible, limiteCombustible]
  );
  const datosTendencia = useMemo(() => {
    const data = stats.tendencia;
    if (limiteTendencia === 'todos') return data;
    const n = Number(limiteTendencia);
    return data.length <= n ? data : data.slice(-n);
  }, [stats.tendencia, limiteTendencia]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="
          fixed inset-0 left-0 top-0 z-50 flex flex-col
          w-screen h-[100dvh] max-w-none max-h-none
          translate-x-0 translate-y-0
          rounded-none border-0 p-0 gap-0 overflow-hidden
          bg-slate-50 dark:bg-neutral-950
        "
      >
        <div className="flex items-center gap-2.5 shrink-0 px-3 sm:px-5 py-2.5 pr-12 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
            <BarChart3 size={16} />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Estadísticas de Consumo
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              {periodo}
            </DialogDescription>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-3 relative">
          {cargando && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/70 dark:bg-neutral-950/70 backdrop-blur-[1px] rounded-lg">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          )}

          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 min-w-0 flex justify-center">
              <SwitchCombustible filtro={filtro} onChange={setFiltro} />
            </div>
            <SelectorPeriodoReporte
              inicio={mesInicio}
              fin={mesFin}
              onChange={onPeriodoChange}
              className="shrink-0"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <KpiCard
              icono={<Wallet size={15} />}
              etiqueta="Consumo total"
              valor={formatearQ(stats.granTotal)}
              detalle={`${stats.totalSolicitudes} solicitudes`}
              color="#3b82f6"
            />
            <KpiCard
              icono={<Users size={15} />}
              etiqueta="Personas activas"
              valor={String(stats.totalPersonas)}
              detalle={`Promedio ${formatearQ(stats.promedioPorPersona)}`}
              color="#a855f7"
            />
            <KpiCard
              icono={<Receipt size={15} />}
              etiqueta="Prom. solicitud"
              valor={formatearQ(stats.promedioPorSolicitud)}
              detalle={`${stats.totalDependencias} dependencias`}
              color="#f97316"
            />
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 w-full">
            <ChartCard
              titulo="Personas con mayor consumo"
              descripcion="Por monto entregado"
              icono={<Users size={14} />}
              className="w-full"
              limite={limitePersonas}
              onLimiteChange={setLimitePersonas}
            >
              {datosPersonas.length > 0 ? (
                <BarrasHorizontales
                  data={datosPersonas}
                  paletteOffset={2}
                  animKey={`${filtro}-${limitePersonas}`}
                />
              ) : (
                <SinDatos />
              )}
            </ChartCard>

            <ChartCard
              titulo="Departamentos con mayor consumo"
              descripcion="Nivel 2 — unidades administrativas (sin puestos)"
              icono={<Building2 size={14} />}
              className="w-full"
              limite={limiteDepartamentos}
              onLimiteChange={setLimiteDepartamentos}
            >
              {datosDepartamentos.length > 0 ? (
                <BarrasHorizontales
                  data={datosDepartamentos}
                  paletteOffset={0}
                  animKey={`${filtro}-${limiteDepartamentos}`}
                />
              ) : (
                <SinDatos />
              )}
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 w-full">
            <ChartCard
              titulo="Distribución por área principal"
              descripcion="Participación de cada área en el total"
              icono={<Building2 size={14} />}
              limite={limiteAreas}
              onLimiteChange={setLimiteAreas}
            >
              {datosAreas.length > 0 ? (
                <BarrasHorizontales
                  data={datosAreas}
                  paletteOffset={1}
                  animKey={`${filtro}-${limiteAreas}`}
                />
              ) : (
                <SinDatos />
              )}
            </ChartCard>

            <ChartCard
              titulo="Consumo por tipo de combustible"
              descripcion="Monto entregado según combustible"
              icono={<Fuel size={14} />}
              limite={limiteCombustible}
              onLimiteChange={setLimiteCombustible}
            >
              {datosCombustible.length > 0 ? (
                <GraficaCombustible
                  datos={datosCombustible}
                  granTotal={stats.granTotal}
                  mostrarPorcentaje={filtro === 'todos'}
                />
              ) : (
                <SinDatos />
              )}
            </ChartCard>

            <ChartCard
              titulo="Tendencia de consumo"
              descripcion="Evolución del monto por mes"
              icono={<TrendingUp size={14} />}
              className="lg:col-span-2"
              limite={limiteTendencia}
              onLimiteChange={setLimiteTendencia}
            >
              {datosTendencia.length > 0 ? (
                <div className="h-[15rem] w-full text-slate-500 dark:text-slate-400">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={datosTendencia}
                      margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
                    >
                      <defs>
                        <linearGradient id="gradTendencia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="currentColor"
                        strokeOpacity={0.12}
                      />
                      <XAxis
                        dataKey="etiqueta"
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatearCompacto}
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        cursor={{ stroke: '#3b82f6', strokeOpacity: 0.3 }}
                        content={<ChartTooltip />}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#gradTendencia)"
                        dot={{ r: 3, fill: '#3b82f6' }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <SinDatos />
              )}
            </ChartCard>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
