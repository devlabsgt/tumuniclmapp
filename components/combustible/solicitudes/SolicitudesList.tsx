import React, { useState, useMemo, useEffect } from 'react';
import { SolicitudCombustible } from './types';
import { SolicitudItem } from './SolicitudItem';
import { Calendar as CalendarIcon, Filter, SearchX, ListFilter, CalendarDays, RefreshCw } from 'lucide-react';

interface Props {
  solicitudes: SolicitudCombustible[];
  onRefresh: () => void;
  onEdit: (solicitud: SolicitudCombustible) => void;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, i) => ANIO_ACTUAL - 2 + i);

const TAB_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'Todos': {
    active: 'bg-slate-800 text-white shadow-sm',
    inactive: 'text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
    badge: 'bg-slate-200 text-slate-700 dark:bg-neutral-700 dark:text-neutral-300'
  },
  'pendiente': {
    active: 'bg-amber-500 text-white shadow-sm',
    inactive: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40'
  },
  'aprobado': { 
    active: 'bg-emerald-600 text-white shadow-sm',
    inactive: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40'
  },
  'rechazado': { 
    active: 'bg-red-600 text-white shadow-sm',
    inactive: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40'
  }
};

const getGTDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Date(date.toLocaleString("en-US", { timeZone: "America/Guatemala" }));
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeek = firstDay.getDay(); 
  const offsetDate = date.getDate() + dayOfWeek - 1;
  return Math.floor(offsetDate / 7) + 1;
};

const formatTinyDate = (date: Date) => {
    return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
};

const getWeeksInMonth = (year: number, month: number) => {
    const weeks = [];
    let currentDate = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let weekNum = 1;
    while (currentDate <= lastDayOfMonth) {
        const startOfWeek = new Date(currentDate);
        let endOfWeek = new Date(currentDate);
        const dayOfWeek = currentDate.getDay(); 
        const daysUntilSaturday = 6 - dayOfWeek; 
        endOfWeek.setDate(currentDate.getDate() + daysUntilSaturday);
        if (endOfWeek > lastDayOfMonth) endOfWeek = lastDayOfMonth;
        weeks.push({
            id: weekNum.toString(),
            label: `${formatTinyDate(startOfWeek)} - ${formatTinyDate(endOfWeek)}`
        });
        currentDate = new Date(endOfWeek);
        currentDate.setDate(currentDate.getDate() + 1);
        weekNum++;
    }
    return weeks;
};

const getSimpleDateLabel = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric' };
    const dateText = date.toLocaleDateString('es-GT', options);
    return dateText.charAt(0).toUpperCase() + dateText.slice(1);
};

export const RequestList: React.FC<Props> = ({ solicitudes, onRefresh, onEdit }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('all'); 
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const weekOptions = useMemo(() => getWeeksInMonth(anioSeleccionado, mesSeleccionado), [anioSeleccionado, mesSeleccionado]);

  useEffect(() => {
     if (semanaSeleccionada !== 'all') {
         const exists = weekOptions.find(w => w.id === semanaSeleccionada);
         if (!exists) setSemanaSeleccionada('all');
     }
  }, [weekOptions, semanaSeleccionada]);

  const solicitudesFiltradasGlobal = useMemo(() => {
    return solicitudes.filter(sol => {
      const dateGT = getGTDate(sol.created_at);
      if (dateGT.getFullYear() !== anioSeleccionado) return false;
      if (dateGT.getMonth() !== mesSeleccionado) return false;
      if (semanaSeleccionada !== 'all') {
        const week = getWeekOfMonth(dateGT);
        if (week !== parseInt(semanaSeleccionada)) return false;
      }
      return true;
    });
  }, [solicitudes, anioSeleccionado, mesSeleccionado, semanaSeleccionada]);

  const conteos = useMemo(() => ({
    'Todos': solicitudesFiltradasGlobal.length,
    'pendiente': solicitudesFiltradasGlobal.filter(s => (s.estado as any) === 'pendiente').length,
    'aprobado': solicitudesFiltradasGlobal.filter(s => (s.estado as any) === 'aprobado').length,
    'rechazado': solicitudesFiltradasGlobal.filter(s => (s.estado as any) === 'rechazado').length,
  }), [solicitudesFiltradasGlobal]);

  const pestañas = ['Todos', 'pendiente', 'aprobado', 'rechazado'];

  const listaVisual = useMemo(() => {
      const filtered = solicitudesFiltradasGlobal.filter(s => filtroEstado === 'Todos' ? true : s.estado === filtroEstado);
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [solicitudesFiltradasGlobal, filtroEstado]);

  const groupedSolicitudes = useMemo(() => {
    const groups: { label: string; dateObj: Date; items: SolicitudCombustible[] }[] = [];
    listaVisual.forEach((sol) => {
        const dateGT = getGTDate(sol.created_at);
        const dateKey = dateGT.toDateString(); 
        let group = groups.find(g => g.dateObj.toDateString() === dateKey);
        if (!group) {
            group = { label: getSimpleDateLabel(dateGT), dateObj: dateGT, items: [] };
            groups.push(group);
        }
        group.items.push(sol);
    });
    return groups;
  }, [listaVisual]);

  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col gap-6 pb-20 relative">
      <div className="flex flex-col xl:flex-row gap-4">
        
        <div className="overflow-x-auto pb-1 xl:pb-0">
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm min-w-max">
            {pestañas
              .filter(t => t !== 'Todos')
              .map((tab) => {
                const styles = TAB_STYLES[tab];
                const isActive = filtroEstado === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFiltroEstado(isActive ? 'Todos' : tab)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-tight
                    ${isActive ? styles.active : styles.inactive}`}
                  >
                    {tab}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[20px] text-center font-extrabold
                    ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>
                      {conteos[tab as keyof typeof conteos]}
                    </span>
                  </button>
                );
            })}
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0 xl:ml-auto">
            <div className="relative">
                <select 
                    value={anioSeleccionado} 
                    onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                    className="pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 appearance-none text-center"
                >
                    {ANIOS.map((anio) => (
                        <option key={anio} value={anio}>{anio}</option>
                    ))}
                </select>
            </div>

            <div className="relative min-w-[120px]">
                <select 
                    value={mesSeleccionado} 
                    onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                    className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 appearance-none"
                >
                    {MONTHS.map((mes, index) => (
                        <option key={index} value={index}>{mes}</option>
                    ))}
                </select>
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[140px]">
                <select 
                    value={semanaSeleccionada} 
                    onChange={(e) => setSemanaSeleccionada(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 appearance-none text-center"
                >
                    <option value="all">Todo el mes</option>
                    {weekOptions.map((w) => (
                        <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                </select>
            </div>

            <button 
                onClick={onRefresh}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl transition-colors"
                title="Actualizar lista"
            >
                <RefreshCw size={18} />
            </button>
        </div>
      </div>

      {listaVisual.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800">
            <SearchX size={32} className="text-slate-300 mb-4" />
            <h3 className="text-slate-900 dark:text-white font-bold">No se encontraron solicitudes</h3>
            <p className="text-slate-500 text-sm mt-1">Intente cambiar los filtros de fecha o estado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            {groupedSolicitudes.map((group) => (
                <div key={group.dateObj.toISOString()} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 pl-1">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700">
                            <CalendarDays size={14} className="text-slate-500 dark:text-gray-400" />
                            <span className="text-[10px] font-bold text-slate-700 dark:text-gray-200 uppercase tracking-wider">
                                {group.label}
                            </span>
                        </div>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-neutral-800/50"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {group.items.map((sol) => (
                            <SolicitudItem 
                                key={sol.id} 
                                sol={sol} 
                                isExpanded={expandedId === sol.id}
                                onToggleExpand={() => setExpandedId(expandedId === sol.id ? null : sol.id)}
                                onRefresh={onRefresh}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};