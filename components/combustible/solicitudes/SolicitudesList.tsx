// features/solicitudes/SolicitudesList.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { SolicitudCombustible } from './types';
import { SolicitudItem } from './SolicitudItem';
import { Calendar as CalendarIcon, Filter, SearchX, ListFilter, CalendarDays } from 'lucide-react';

interface Props {
  solicitudes: SolicitudCombustible[];
  onRefresh: () => void;
  onEdit: (solicitud: SolicitudCombustible) => void;
}

// --- CONSTANTES Y ESTILOS ---
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, i) => ANIO_ACTUAL - 2 + i);

const TAB_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'Todos': {
    active: 'bg-slate-800 text-white shadow-lg shadow-slate-900/20 ring-1 ring-slate-900',
    inactive: 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700',
    badge: 'bg-slate-100 text-slate-700 dark:bg-neutral-700 dark:text-neutral-300'
  },
  'pendiente': {
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-1 ring-amber-500',
    inactive: 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30 dark:hover:bg-amber-900/20',
    badge: 'bg-amber-200/50 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  },
  'aprobada': {
    active: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-500',
    inactive: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-900/20',
    badge: 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  'rechazada': {
    active: 'bg-red-600 text-white shadow-lg shadow-red-500/30 ring-1 ring-red-500',
    inactive: 'bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20',
    badge: 'bg-red-200/50 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  }
};

// --- UTILIDADES ---
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
            label: `Sem. ${weekNum} (${formatTinyDate(startOfWeek)} - ${formatTinyDate(endOfWeek)})`
        });

        currentDate = new Date(endOfWeek);
        currentDate.setDate(currentDate.getDate() + 1);
        weekNum++;
    }
    return weeks;
};

// Nueva función de formateo simplificada: "Viernes 23"
const getSimpleDateLabel = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric' };
    const dateText = date.toLocaleDateString('es-GT', options);
    // Capitalizar: "viernes 23" -> "Viernes 23"
    return dateText.charAt(0).toUpperCase() + dateText.slice(1);
};

export const RequestList: React.FC<Props> = ({ solicitudes, onRefresh, onEdit }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('all'); 
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const weekOptions = useMemo(() => {
    return getWeeksInMonth(anioSeleccionado, mesSeleccionado);
  }, [anioSeleccionado, mesSeleccionado]);

  useEffect(() => {
     if (semanaSeleccionada !== 'all') {
         const exists = weekOptions.find(w => w.id === semanaSeleccionada);
         if (!exists) setSemanaSeleccionada('all');
     }
  }, [mesSeleccionado, anioSeleccionado, weekOptions, semanaSeleccionada]);

  // --- FILTRADO GLOBAL ---
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

  // --- CONTEOS Y PESTAÑAS ---
  const conteos = useMemo(() => {
    return {
      'Todos': solicitudesFiltradasGlobal.length,
      'pendiente': solicitudesFiltradasGlobal.filter(s => s.estado === 'pendiente').length,
      'aprobada': solicitudesFiltradasGlobal.filter(s => s.estado === 'aprobada').length,
      'rechazada': solicitudesFiltradasGlobal.filter(s => s.estado === 'rechazada').length,
    };
  }, [solicitudesFiltradasGlobal]);

  const pestañas = useMemo(() => {
    const base = ['Todos', 'pendiente', 'aprobada', 'rechazada'];
    return base.filter(tab => conteos[tab as keyof typeof conteos] > 0 || (tab === 'Todos' && solicitudesFiltradasGlobal.length > 0));
  }, [conteos, solicitudesFiltradasGlobal.length]);

  useEffect(() => {
    if (pestañas.length > 0 && !pestañas.includes(filtroEstado)) {
        setFiltroEstado('Todos');
    }
  }, [pestañas, filtroEstado]);

  // --- LISTA FILTRADA Y ORDENADA ---
  const listaVisual = useMemo(() => {
      const filtered = solicitudesFiltradasGlobal.filter(s => 
          filtroEstado === 'Todos' ? true : s.estado === filtroEstado
      );
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [solicitudesFiltradasGlobal, filtroEstado]);

  // --- AGRUPACIÓN POR DÍAS ---
  const groupedSolicitudes = useMemo(() => {
    const groups: { label: string; dateObj: Date; items: SolicitudCombustible[] }[] = [];
    
    listaVisual.forEach((sol) => {
        const dateGT = getGTDate(sol.created_at);
        const dateKey = dateGT.toDateString(); 
        
        let group = groups.find(g => g.dateObj.toDateString() === dateKey);
        
        if (!group) {
            group = {
                label: getSimpleDateLabel(dateGT), // Usamos la nueva función simplificada
                dateObj: dateGT,
                items: []
            };
            groups.push(group);
        }
        group.items.push(sol);
    });

    return groups;
  }, [listaVisual]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col gap-6 pb-20 relative">
      
      {/* ========================================================= */}
      {/* BARRA DE FILTROS */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* TABS DE ESTADO */}
        {pestañas.length > 0 ? (
            <div className="w-full lg:w-auto overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex items-center gap-2 p-1 min-w-max">
                    {pestañas.map((tab) => {
                        const styles = TAB_STYLES[tab] || TAB_STYLES['Todos'];
                        const isActive = filtroEstado === tab;
                        const label = tab.charAt(0).toUpperCase() + tab.slice(1);

                        return (
                            <button
                                key={tab}
                                onClick={() => setFiltroEstado(tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0
                                ${isActive ? styles.active : styles.inactive}`}
                            >
                                {tab === 'Todos' && <Filter size={14} className={isActive ? "opacity-100" : "opacity-60"}/>}
                                {label}
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[20px] text-center font-extrabold
                                ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>
                                    {conteos[tab as keyof typeof conteos]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        ) : <div />}

        {/* SELECTORES DE FECHA */}
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide justify-end">
            <div className="relative min-w-[260px]">
                <select 
                    value={semanaSeleccionada} 
                    onChange={(e) => setSemanaSeleccionada(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium text-gray-700 dark:text-gray-200"
                >
                    <option value="all">Todas las semanas</option>
                    {weekOptions.map((w) => (
                        <option key={w.id} value={w.id}>{w.label}</option>
                    ))}
                </select>
                <ListFilter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[140px]">
                <select 
                    value={mesSeleccionado} 
                    onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium text-gray-700 dark:text-gray-200"
                >
                    {MONTHS.map((mes, index) => (
                        <option key={index} value={index}>{mes}</option>
                    ))}
                </select>
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative min-w-[90px]">
                <select 
                    value={anioSeleccionado} 
                    onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium text-gray-700 dark:text-gray-200 text-center"
                >
                    {ANIOS.map((anio) => (
                        <option key={anio} value={anio}>{anio}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>
      {/* ========================================================= */}


      {/* --- LISTA AGRUPADA O EMPTY STATE --- */}
      {listaVisual.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-gray-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-neutral-800 text-center px-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <SearchX size={32} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1">
                No se encontraron solicitudes
            </h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 max-w-xs mx-auto">
                No hay resultados para esta fecha. Intenta cambiar los filtros.
            </p>
            
            {(semanaSeleccionada !== 'all' || filtroEstado !== 'Todos' || mesSeleccionado !== new Date().getMonth()) && (
                <button 
                    onClick={() => { 
                        setFiltroEstado('Todos'); 
                        setSemanaSeleccionada('all');
                        setMesSeleccionado(new Date().getMonth()); 
                        setAnioSeleccionado(new Date().getFullYear());
                    }} 
                    className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                    Restablecer todo
                </button>
            )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            {groupedSolicitudes.map((group) => (
                <div key={group.dateObj.toISOString()} className="flex flex-col gap-3">
                    
                    {/* ENCABEZADO DE GRUPO (FECHA) */}
                    <div className="flex items-center gap-3 pl-1">
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700">
                            <CalendarDays size={14} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                {group.label}
                            </span>
                        </div>
                        <div className="h-px flex-1 bg-gray-200 dark:bg-neutral-800"></div>
                    </div>

                    {/* ITEMS DEL GRUPO */}
                    <div className="flex flex-col gap-3">
                        {group.items.map((sol) => (
                            <SolicitudItem 
                                key={sol.id} 
                                sol={sol} 
                                isExpanded={expandedId === sol.id}
                                onToggleExpand={() => toggleExpand(sol.id)}
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