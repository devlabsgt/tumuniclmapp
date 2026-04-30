'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSolicitudesJefes } from './lib/hook';
import { SolicitudJefe } from './lib/zod';
import SolitJefeItem from './SolitJefeItem';
import CrearSolicitud from './modals/CrearSolicitud';
import CambioEstadoJefesModal from './modals/CambioEstadoJefesModal';
import { useSolicitudJefeMutations } from './lib/hook';

import { Search, Calendar as CalendarIcon, SearchX, CalendarDays, Plus, RefreshCw, ArrowRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Calendario from '@/components/ui/Calendario';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';

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
  'completado': {
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

const GT_OFFSET_MS = -6 * 60 * 60 * 1000;
const getGTDate = (dateString: string) => {
  const utc = new Date(dateString);
  return new Date(utc.getTime() + GT_OFFSET_MS);
};

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const getSimpleDateLabel = (date: Date) => {
  const weekday = DIAS_SEMANA[date.getUTCDay()];
  const day = date.getUTCDate();
  return `${weekday} ${day}`;
};

interface Props {
  initialData: SolicitudJefe[];
  userServerSide?: {
    userId: string | null;
    isOperario: boolean;
  };
}

export default function ListSolitJefes({ initialData, userServerSide }: Props) {
  const router = useRouter();
  const { solicitudes, loading, refresh, updateLocalSolicitud } = useSolicitudesJefes(initialData);
  const { eliminar } = useSolicitudJefeMutations();
  const [isMounted, setIsMounted] = useState(false);
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudJefe | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudJefe | null>(null);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);

  // Filters state
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'dia' | 'semana' | 'rango'>('semana');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [semanaMes, setSemanaMes] = useState(new Date().getMonth());
  const [semanaAnio, setSemanaAnio] = useState(new Date().getFullYear());
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('0');

  useEffect(() => { setIsMounted(true); }, []);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return format(d, "EEE, d MMM yy", { locale: es });
  };

  const weekOptionsData = useMemo(() => {
    const weeks: { id: string; label: string; start: Date; end: Date }[] = [];
    let currentDate = new Date(semanaAnio, semanaMes, 1);
    const lastDayOfMonth = new Date(semanaAnio, semanaMes + 1, 0);
    let weekNum = 0;
    while (currentDate <= lastDayOfMonth) {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      let endOfWeek = new Date(currentDate);
      endOfWeek.setDate(currentDate.getDate() + daysUntilSunday);
      if (endOfWeek > lastDayOfMonth) endOfWeek = lastDayOfMonth;

      const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const label = `${DIAS_CORTOS[startOfWeek.getDay()]} ${startOfWeek.getDate()} - ${DIAS_CORTOS[endOfWeek.getDay()]} ${endOfWeek.getDate()}`;
      weeks.push({ id: weekNum.toString(), label, start: startOfWeek, end: endOfWeek });

      currentDate = new Date(endOfWeek);
      currentDate.setDate(currentDate.getDate() + 1);
      weekNum++;
    }
    return weeks;
  }, [semanaAnio, semanaMes]);

  useEffect(() => {
    const today = new Date();
    if (semanaMes === today.getMonth() && semanaAnio === today.getFullYear()) {
      const todayDay = today.getDate();
      const idx = weekOptionsData.findIndex(w => todayDay >= w.start.getDate() && todayDay <= w.end.getDate());
      if (idx >= 0) setSemanaSeleccionada(idx.toString());
      else setSemanaSeleccionada('0');
    } else {
      setSemanaSeleccionada('0');
    }
  }, [weekOptionsData, semanaMes, semanaAnio]);

  const solicitudesFiltradasGlobal = useMemo(() => {
    if (!isMounted) return [];

    return solicitudes.filter(sol => {
      if (!sol.created_at) return false;
      const dateGT = getGTDate(sol.created_at);
      const solDay = new Date(dateGT.getFullYear(), dateGT.getMonth(), dateGT.getDate()).getTime();

      let coincideFecha = false;
      if (dateFilterMode === 'dia') {
        const sel = new Date(selectedDate + 'T00:00:00');
        coincideFecha = solDay === new Date(sel.getFullYear(), sel.getMonth(), sel.getDate()).getTime();
      } else if (dateFilterMode === 'semana') {
        const weekData = weekOptionsData[parseInt(semanaSeleccionada)];
        if (weekData) {
          const sTime = new Date(weekData.start.getFullYear(), weekData.start.getMonth(), weekData.start.getDate()).getTime();
          const eTime = new Date(weekData.end.getFullYear(), weekData.end.getMonth(), weekData.end.getDate()).getTime();
          coincideFecha = solDay >= sTime && solDay <= eTime;
        }
      } else {
        const s = new Date(startDate + 'T00:00:00');
        const e = new Date(endDate + 'T00:00:00');
        const sTime = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
        const eTime = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
        coincideFecha = solDay >= sTime && solDay <= eTime;
      }

      const lowerTerm = searchTerm.toLowerCase();

      return coincideFecha && (
        (sol.nombre_responsable || '').toLowerCase().includes(lowerTerm) ||
        (sol.ubicacion || '').toLowerCase().includes(lowerTerm) ||
        (sol.telefono_contacto || '').toLowerCase().includes(lowerTerm) ||
        sol.id.toLowerCase().includes(lowerTerm)
      );
    });
  }, [solicitudes, dateFilterMode, selectedDate, startDate, endDate, semanaSeleccionada, weekOptionsData, searchTerm, isMounted]);

  const conteos = useMemo(() => ({
    'Todos': solicitudesFiltradasGlobal.length,
    'pendiente': solicitudesFiltradasGlobal.filter(s => s.estado === 'pendiente').length,
    'completado': solicitudesFiltradasGlobal.filter(s => s.estado === 'completado').length,
    'rechazado': solicitudesFiltradasGlobal.filter(s => s.estado === 'rechazado').length,
  }), [solicitudesFiltradasGlobal]);

  const pestañas = ['Todos', 'pendiente', 'completado', 'rechazado'];
  const pestañasLabel: Record<string, string> = {
    'Todos': 'Todos',
    'pendiente': 'Pendiente',
    'completado': 'Confirmado',
    'rechazado': 'Rechazado',
  };

  const listaVisual = useMemo(() => {
    const filtered = solicitudesFiltradasGlobal.filter(s => filtroEstado === 'Todos' ? true : s.estado === filtroEstado);
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [solicitudesFiltradasGlobal, filtroEstado]);

  const groupedSolicitudes = useMemo(() => {
    const groups: { label: string; dateObj: Date; items: SolicitudJefe[] }[] = [];
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

  const handleCambiarEstado = (sol: SolicitudJefe) => {
    setSelectedSolicitud(sol);
    setIsEstadoModalOpen(true);
  };

  const handleEditar = (sol: SolicitudJefe) => {
    setEditingSolicitud(sol);
    setIsCrearOpen(true);
  };

  const handleEliminar = async (sol: SolicitudJefe) => {
    const result = await Swal.fire({
      title: '¿Eliminar solicitud?',
      html: `<p style="margin-top:8px">Se eliminará permanentemente la solicitud de <b>${sol.ubicacion || 'sin ubicación'}</b>.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await eliminar.mutateAsync(sol.id);
      if (res.success) {
        Swal.fire({ title: '¡Eliminada!', text: 'La solicitud fue eliminada.', icon: 'success', timer: 1500, showConfirmButton: false });
        refresh();
      } else {
        Swal.fire('Error', res.error || 'No se pudo eliminar', 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Error al eliminar', 'error');
    }
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-[1600px] w-full mx-auto px-2 sm:px-6 lg:px-8 flex flex-col gap-4 pb-20 mt-5 sm:mt-7">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Solicitudes de Jefes</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
            Gestione las solicitudes entre jefes.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsCrearOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>NUEVA SOLICITUD</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 mb-2 mt-4">
        <div className="overflow-x-auto pb-1 xl:pb-0 flex justify-center xl:justify-start">
          <div className="flex items-center gap-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm min-w-max">
            {pestañas
              .filter(t => t !== 'Todos')
              .map((tab) => {
                const styles = TAB_STYLES[tab];
                const isActive = filtroEstado === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFiltroEstado(isActive ? 'Todos' : tab)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap uppercase tracking-tight
                    ${isActive ? styles.active : styles.inactive}`}
                  >
                    {pestañasLabel[tab]}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center font-extrabold
                    ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>
                      {conteos[tab as keyof typeof conteos]}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-3 xl:ml-auto w-full xl:w-auto items-center xl:items-start">
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64 group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar nombre, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200"
              />
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-neutral-800/50 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setDateFilterMode('dia')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${dateFilterMode === 'dia' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >Día</button>
              <button
                onClick={() => setDateFilterMode('semana')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${dateFilterMode === 'semana' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >Semana</button>
              <button
                onClick={() => setDateFilterMode('rango')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${dateFilterMode === 'rango' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >Rango</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dateFilterMode === 'dia' ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
                    <CalendarIcon size={16} className="text-blue-500" />
                    <span className="capitalize">{formatDateLabel(selectedDate)}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendario fechaSeleccionada={selectedDate} onSelectDate={setSelectedDate} />
                </PopoverContent>
              </Popover>
            ) : dateFilterMode === 'semana' ? (
              <div className="flex items-center gap-2">
                <select
                  value={semanaSeleccionada}
                  onChange={(e) => setSemanaSeleccionada(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                >
                  {weekOptionsData.map((w) => (
                    <option key={w.id} value={w.id}>{w.label}</option>
                  ))}
                </select>
                <input
                  type="month"
                  value={`${semanaAnio}-${String(semanaMes + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-');
                    setSemanaAnio(parseInt(y));
                    setSemanaMes(parseInt(m) - 1);
                  }}
                  className="px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
                      <CalendarIcon size={16} className="text-emerald-500" />
                      <span className="capitalize">{formatDateLabel(startDate)}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendario fechaSeleccionada={startDate} onSelectDate={setStartDate} />
                  </PopoverContent>
                </Popover>
                <ArrowRight size={16} className="text-slate-400 shrink-0" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
                      <CalendarIcon size={16} className="text-red-500" />
                      <span className="capitalize">{formatDateLabel(endDate)}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendario fechaSeleccionada={endDate} onSelectDate={setEndDate} />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <button
              onClick={() => refresh()}
              className="bg-white hover:bg-slate-50 border border-slate-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl transition-colors shadow-sm shrink-0"
              title="Actualizar lista"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {listaVisual.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800 mt-4">
          <SearchX size={32} className="text-slate-300 mb-4" />
          <h3 className="text-slate-900 dark:text-white font-bold">No se encontraron solicitudes</h3>
          <p className="text-slate-500 text-sm mt-1">Intente cambiar los filtros de búsqueda o fecha.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-in fade-in duration-500">
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
                  <SolitJefeItem
                    key={sol.id}
                    sol={sol}
                    isOpen={expandedId === sol.id}
                    onToggle={() => setExpandedId(expandedId === sol.id ? null : sol.id)}
                    onCambiarEstado={handleCambiarEstado}
                    onEditar={handleEditar}
                    onEliminar={handleEliminar}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CrearSolicitud
        isOpen={isCrearOpen}
        onClose={() => { setIsCrearOpen(false); setEditingSolicitud(null); }}
        onSuccess={() => { setIsCrearOpen(false); setEditingSolicitud(null); refresh(); }}
        editData={editingSolicitud}
      />

      <CambioEstadoJefesModal
        isOpen={isEstadoModalOpen}
        onClose={() => { setIsEstadoModalOpen(false); setSelectedSolicitud(null); }}
        onSuccess={() => { setIsEstadoModalOpen(false); setSelectedSolicitud(null); refresh(); }}
        solicitud={selectedSolicitud}
      />
    </div>
  );
}
