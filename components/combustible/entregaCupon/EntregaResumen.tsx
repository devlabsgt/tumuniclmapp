import React from 'react';
import {
  MapPin,
  Gauge,
  Car,
  Fuel,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  FileSignature,
} from 'lucide-react';
import { SolicitudEntrega } from './lib/schemas';

const getSimpleDate = (dateStr: string) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '');
  return `${day}-${month}`;
};

const getSimpleTime = (dateStr: string) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getStatusColor = (status: string) => {
  if (status.includes('aprobado') || status.includes('aprobada')) return 'emerald';
  if (status.includes('rechazado') || status.includes('rechazada')) return 'red';
  return 'amber';
};

const getButtonContent = (sol: SolicitudEntrega) => {
  switch (sol.estado) {
    case 'aprobado':
      if (sol.solvente === false) {
        return {
          text: 'Validar Liquidación',
          style:
            'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 shadow-sm cursor-pointer border-none',
          action: 'validar' as const,
          icon: <FileSignature size={16} />,
        };
      }
      return {
        text: 'Solicitud Finalizada',
        style:
          'bg-emerald-100 text-emerald-700 border-emerald-200 cursor-not-allowed dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 border',
        action: 'none' as const,
        icon: <CheckCircle2 size={16} />,
      };
    case 'rechazado':
      return {
        text: 'Solicitud Rechazada',
        style:
          'bg-red-100 text-red-700 border-red-200 cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 border',
        action: 'none' as const,
        icon: <XCircle size={16} />,
      };
    default:
      return {
        text: 'Procesar Solicitud',
        style:
          'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm',
        action: 'procesar' as const,
        icon: null,
      };
  }
};

interface EntregaResumenCabeceraProps {
  sol: SolicitudEntrega;
}

export function EntregaResumenCabecera({ sol }: EntregaResumenCabeceraProps) {
  const color = getStatusColor(sol.estado);

  return (
    <div className="p-5 bg-white dark:bg-neutral-900">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-start gap-4 overflow-hidden">
          <div
            className={`
              w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border-2 transition-colors
              ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : ''}
              ${color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : ''}
              ${color === 'red' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : ''}
            `}
          >
            {color === 'amber' && <Clock size={24} />}
            {color === 'emerald' && <CheckCircle2 size={24} />}
            {color === 'red' && <XCircle size={24} />}
          </div>

          <div className="flex flex-col min-w-0 gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`
                  text-[10px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border
                  ${
                    sol.correlativo
                      ? 'text-white bg-blue-600 border-blue-600 shadow-sm shadow-blue-500/50'
                      : 'text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-neutral-800 border-slate-100 dark:border-neutral-700'
                  }
                `}
              >
                {sol.correlativo ? `No. ${sol.correlativo}` : `ID: ${sol.id}`}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {sol.municipio_destino}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-500">
                <Calendar size={12} />
                {new Date(sol.created_at).toLocaleDateString()}
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {sol.usuario?.nombre}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EntregaResumenBodyProps {
  sol: SolicitudEntrega;
  showActionButton?: boolean;
  layout?: 'split' | 'wide';
  onValidar?: (sol: SolicitudEntrega) => void;
  onClick?: (sol: SolicitudEntrega) => void;
}

export function EntregaResumenBody({
  sol,
  showActionButton = true,
  layout = 'split',
  onValidar,
  onClick,
}: EntregaResumenBodyProps) {
  const totalKms = sol.detalles?.reduce((acc, d) => acc + (d.kilometros_recorrer || 0), 0) || 0;

  const isMaquinaria =
    ['maquinaria', 'retroexcavadora', 'tractor', 'patrulla de caminos', 'motoniveladora'].some((t) =>
      sol.vehiculo?.tipo_vehiculo?.toLowerCase().includes(t)
    ) || sol.vehiculo?.tipo_vehiculo?.toLowerCase() === 'maquinaria';

  const btnProps = getButtonContent(sol);

  const comisionSection = (
    <>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <MapPin size={14} /> DATOS DE LA COMISION
        </h4>
        <span className="text-[10px] bg-white dark:bg-neutral-800 px-2 py-1 rounded-md text-slate-500 font-bold border border-slate-200 dark:border-neutral-700 shadow-sm">
          {sol.detalles?.length || 0} destinos
        </span>
      </div>

      <div className="space-y-3">
        {sol.detalles?.map((det, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" />
                <div className="min-w-0">
                  <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase break-words">
                    {det.lugar_visitar}
                  </h5>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 inline-block">
                    {isMaquinaria ? 'Horas:' : 'Distancia:'} {det.kilometros_recorrer}{' '}
                    {isMaquinaria ? 'hr' : 'km'}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-auto shrink-0">
                <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-neutral-700 border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 rounded-lg overflow-hidden w-full sm:min-w-[300px]">
                  <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                      Salida
                    </span>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                      {getSimpleDate(det.fecha_inicio)}, {getSimpleTime(det.fecha_inicio)}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
                      Retorno
                    </span>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                      {getSimpleDate(det.fecha_fin)}, {getSimpleTime(det.fecha_fin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {(!sol.detalles || sol.detalles.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-slate-300 dark:border-neutral-800">
            <MapPin size={24} className="mb-2 opacity-50" />
            <p>No hay detalles de comision.</p>
          </div>
        )}
      </div>
    </>
  );

  if (layout === 'wide') {
    return (
      <div className="px-5 pb-5 pt-1 bg-slate-50/50 dark:bg-neutral-950/30 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
            <Gauge size={16} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {isMaquinaria ? 'H. Inicial' : 'Inicial'}
              </p>
              <p className="font-mono font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                {sol.kilometraje_inicial.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
            <MapPin size={16} className="text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Total</p>
              <p className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 truncate">
                {totalKms} {isMaquinaria ? 'hr' : 'km'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
            <Car size={16} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vehículo</p>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                {sol.vehiculo?.modelo || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Placa</p>
              <p className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 truncate">
                {sol.placa}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 col-span-2 sm:col-span-1">
            <Fuel
              size={16}
              className={
                sol.vehiculo?.tipo_combustible === 'Diesel'
                  ? 'text-emerald-500 shrink-0'
                  : 'text-orange-500 shrink-0'
              }
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Combustible</p>
              <p
                className={`font-black text-sm uppercase truncate ${
                  sol.vehiculo?.tipo_combustible === 'Diesel'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                {sol.vehiculo?.tipo_combustible || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
          <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
            <FileText size={12} /> Justificación
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
            &ldquo;{sol.justificacion || 'Sin justificación'}&rdquo;
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 p-4">
          {comisionSection}
        </div>

        {showActionButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (btnProps.action === 'validar' && onValidar) {
                onValidar(sol);
              } else if (btnProps.action === 'procesar' && onClick) {
                onClick(sol);
              }
            }}
            disabled={btnProps.action === 'none'}
            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:active:scale-100 ${btnProps.style}`}
          >
            {btnProps.icon}
            {btnProps.text}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-50/50 dark:bg-neutral-950/30">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm space-y-5">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-100 dark:border-neutral-700">
              <div className="flex-1 flex items-center gap-2 border-r border-slate-200 dark:border-neutral-700 pr-2 overflow-hidden">
                <Gauge size={14} className="text-slate-400 shrink-0" />
                <div className="text-xs truncate">
                  <span className="font-bold text-slate-400 uppercase tracking-tight mr-1">
                    {isMaquinaria ? 'H. Inicial:' : 'Inicial:'}
                  </span>
                  <span className="font-mono font-black text-slate-700 dark:text-slate-200">
                    {sol.kilometraje_inicial.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 pl-1 overflow-hidden">
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <div className="text-xs truncate">
                  <span className="font-bold text-blue-400 uppercase tracking-tight mr-1">Total:</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                    {totalKms} {isMaquinaria ? 'hr' : 'km'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                <Car size={12} /> Vehículo
              </h4>
              <div className="flex flex-row items-center justify-between gap-2 bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-slate-100 dark:border-neutral-700 overflow-hidden">
                <span className="font-bold text-xs text-slate-700 dark:text-white truncate">
                  {sol.vehiculo?.modelo || 'N/A'}
                </span>
                <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  PLACA: {sol.placa}
                </span>
                {sol.vehiculo?.tipo_combustible && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Fuel
                      size={12}
                      className={
                        sol.vehiculo.tipo_combustible === 'Diesel'
                          ? 'text-emerald-500'
                          : 'text-orange-500'
                      }
                    />
                    <span
                      className={`text-[10px] font-black uppercase ${
                        sol.vehiculo.tipo_combustible === 'Diesel'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {sol.vehiculo.tipo_combustible}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <FileText size={12} /> Justificación
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-neutral-800 p-3 rounded-lg border border-slate-100 dark:border-neutral-700 leading-relaxed">
                &ldquo;{sol.justificacion || 'Sin justificación'}&rdquo;
              </p>
            </div>

            {showActionButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (btnProps.action === 'validar' && onValidar) {
                    onValidar(sol);
                  } else if (btnProps.action === 'procesar' && onClick) {
                    onClick(sol);
                  }
                }}
                disabled={btnProps.action === 'none'}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:active:scale-100 ${btnProps.style}`}
              >
                {btnProps.icon}
                {btnProps.text}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {comisionSection}
        </div>
      </div>
    </div>
  );
}
