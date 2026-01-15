'use client';

import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { Tarea, Usuario } from './types'; 
import TareaItem from './TareaItem';
import NewTarea from './modals/NewTarea'; 
import { Plus, Filter, SearchX, ArrowLeft, Search, Calendar as CalendarIcon, User, Users } from 'lucide-react';

interface Props {
  tareas: Tarea[];
  usuarios: Usuario[];
  usuarioActual: string;
  esJefe: boolean;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - 1 + i);

const getFechaCabecera = (fechaIso: string) => {
  if (!fechaIso) return 'Sin fecha';
  const fechaParte = fechaIso.split('T')[0];
  const [year, month, day] = fechaParte.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const opciones: Intl.DateTimeFormatOptions = { 
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' 
  };
  return new Intl.DateTimeFormat('es-ES', opciones)
    .format(fecha)
    .replace('.', '')
    .replace(/de /g, '');
};

// --- CONFIGURACIÓN DE COLORES POR ESTADO ---
const TAB_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'Todos': {
    active: 'bg-slate-700 text-white shadow-md shadow-slate-500/30 ring-1 ring-slate-600',
    inactive: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800',
    badge: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400'
  },
  'Asignado': {
    active: 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-500',
    inactive: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  },
  'En Proceso': {
    active: 'bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-500',
    inactive: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  },
  'Completado': {
    active: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-1 ring-emerald-500',
    inactive: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
  },
  'Vencido': {
    active: 'bg-red-600 text-white shadow-md shadow-red-500/30 ring-1 ring-red-500',
    inactive: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
};

export default function TareaList({ tareas, usuarios, usuarioActual, esJefe }: Props) {
  const [viewMode, setViewMode] = useState<'mis_tareas' | 'equipo'>('mis_tareas');
  
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear()); 
  
  const scrollPositionRef = useRef(0);

  const toggleAccordion = (id: string) => {
    if (expandedId === id) {
        setExpandedId(null);
    } else {
        scrollPositionRef.current = window.scrollY;
        setExpandedId(id);
        window.scrollTo({ top: 0, behavior: 'instant' }); 
    }
  };

  useLayoutEffect(() => {
    if (expandedId === null) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
    }
  }, [expandedId]);

  // --- LÓGICA DE FILTRADO ---
  const tareasFiltradasGlobal = useMemo(() => {
    return tareas.filter(t => {
      // 1. Filtro Vista (Mis Tareas vs Mi Equipo)
      if (viewMode === 'mis_tareas') {
         if (t.assigned_to !== usuarioActual) return false;
      } else {
         // Modo Equipo: Ocultamos lo que es asignado a mí mismo
         if (t.assigned_to === usuarioActual) return false;
      }
      
      // 2. Filtro Fecha
      if (!t.due_date) return false;
      const [tYear, tMonth] = t.due_date.split('T')[0].split('-').map(Number);
      const coincideFecha = (tMonth - 1) === mesSeleccionado && tYear === anioSeleccionado;
      
      // 3. Filtro Busqueda
      const termino = busqueda.toLowerCase();
      const coincideTitulo = t.title.toLowerCase().includes(termino);
      const coincideUsuario = (t.assignee?.nombre || '').toLowerCase().includes(termino);
      const coincideBusqueda = coincideTitulo || coincideUsuario;

      return coincideFecha && coincideBusqueda;
    }).map(t => {
      const esVencida = new Date() > new Date(t.due_date) && t.status !== 'Completado';
      return { ...t, estadoFiltro: esVencida ? 'Vencido' : t.status };
    });
  }, [tareas, mesSeleccionado, anioSeleccionado, busqueda, viewMode, usuarioActual]);

  const conteos = useMemo(() => {
    return {
      Todos: tareasFiltradasGlobal.length,
      Asignado: tareasFiltradasGlobal.filter(t => t.estadoFiltro === 'Asignado').length,
      'En Proceso': tareasFiltradasGlobal.filter(t => t.estadoFiltro === 'En Proceso').length,
      'Completado': tareasFiltradasGlobal.filter(t => t.estadoFiltro === 'Completado').length,
      'Vencido': tareasFiltradasGlobal.filter(t => t.estadoFiltro === 'Vencido').length,
    };
  }, [tareasFiltradasGlobal]);

  const listaVisual = tareasFiltradasGlobal.filter(t => {
    if (filtroEstado === 'Todos') return true;
    return t.estadoFiltro === filtroEstado;
  });

  const tareasRenderizadas = expandedId 
    ? listaVisual.filter(t => t.id === expandedId)
    : listaVisual;

  const tareasAgrupadas = useMemo(() => {
    if (expandedId) {
        return [{ fechaKey: 'expanded', titulo: null, tareas: tareasRenderizadas }];
    }
    const grupos: Record<string, Tarea[]> = {};
    tareasRenderizadas.forEach((tarea) => {
        const fechaKey = tarea.due_date.split('T')[0]; 
        if (!grupos[fechaKey]) grupos[fechaKey] = [];
        grupos[fechaKey].push(tarea);
    });
    const fechasOrdenadas = Object.keys(grupos).sort();
    return fechasOrdenadas.map(fechaKey => ({
        fechaKey,
        titulo: getFechaCabecera(fechaKey),
        tareas: grupos[fechaKey]
    }));
  }, [tareasRenderizadas, expandedId]);

  const pestañas = ['Todos', 'Asignado', 'En Proceso', 'Completado', 'Vencido'];

  return (
    <div className="space-y-6 relative w-full max-w-full mx-auto px-0">
      
      {!expandedId && (
        <div className="flex flex-col gap-6 mb-2 animate-in fade-in slide-in-from-top-2">
            
            {/* CABECERA PRINCIPAL */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                
                {/* Título y descripción */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {viewMode === 'mis_tareas' ? 'Mis Actividades' : 'Mi Equipo'}
                        </h1>
                        
                        {esJefe && (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 transform translate-y-0.5">
                                Admin
                           </span>
                        )}
                    </div>
                    
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                        {viewMode === 'mis_tareas' 
                            ? 'Gestiona tus actividades y prioridades del día' 
                            : 'Supervisa las actividades asignadas al resto del equipo'}
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                    
                    {esJefe && (
                        <div className="bg-slate-100 dark:bg-neutral-800 p-1.5 rounded-xl flex items-center border border-slate-200 dark:border-neutral-700 w-full sm:w-auto">
                            <button
                                onClick={() => setViewMode('mis_tareas')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'mis_tareas' 
                                    ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'
                                }`}
                            >
                                <User size={15} />
                                Mías
                            </button>
                            <button
                                onClick={() => setViewMode('equipo')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'equipo' 
                                    ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-gray-400'
                                }`}
                            >
                                <Users size={15} />
                                Mi Equipo
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
                    >
                        <Plus size={20} />
                        Nueva Actividad
                    </button>
                </div>
            </div>

            {/* FILTROS Y BUSCADOR */}
            <div className="flex flex-col xl:flex-row gap-4 mt-2">
                
                {/* 1. TABS DE ESTADO */}
                <div className="w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
                    <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm min-w-max"> 
                        {pestañas.map((tab) => {
                            const styles = TAB_STYLES[tab] || TAB_STYLES['Todos'];
                            const isActive = filtroEstado === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setFiltroEstado(tab);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0
                                    ${isActive ? styles.active : styles.inactive}`}
                                >
                                    {tab === 'Todos' && <Filter size={12} className="opacity-70"/>}
                                    {tab.toUpperCase()}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center
                                    ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>
                                        {conteos[tab as keyof typeof conteos]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. BUSCADOR Y FILTROS DE FECHA */}
                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder={viewMode === 'equipo' ? "Buscar por título..." : "Buscar en mis Actividades..."}
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200"
                        />
                    </div>

                    <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        
                        {/* SELECTOR MES */}
                        <div className="relative min-w-[110px]">
                            <select 
                                value={mesSeleccionado} 
                                onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                                className="w-full appearance-none pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200"
                            >
                                {MESES.map((mes, index) => (
                                    <option key={index} value={index}>{mes}</option>
                                ))}
                            </select>
                            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* SELECTOR AÑO */}
                        <div className="relative">
                            <select 
                                value={anioSeleccionado} 
                                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                                className="appearance-none pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200"
                            >
                                {ANIOS.map((anio) => (
                                    <option key={anio} value={anio}>{anio}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {expandedId && (
          <button 
            onClick={() => toggleAccordion(expandedId)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 font-medium text-sm transition-colors animate-in fade-in slide-in-from-left-2 mb-2"
          >
            <ArrowLeft size={16} />
            Volver a la lista
          </button>
      )}

      <div className="pb-20 space-y-6"> 
        {listaVisual.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 sm:py-24 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800 text-center px-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <SearchX size={32} className="text-slate-300 dark:text-gray-600" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">
                    {viewMode === 'mis_tareas' ? 'No tienes actividades asignadas' : 'No se encontraron actividades'}
                </h3>
                <p className="text-slate-400 dark:text-gray-500 text-sm mb-4 max-w-xs mx-auto">
                    No hay resultados para estos filtros.
                </p>
                
                {(filtroEstado !== 'Todos' || busqueda) && (
                    <button onClick={() => { setFiltroEstado('Todos'); setBusqueda(''); }} className="px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                        Limpiar todos los filtros
                    </button>
                )}
           </div>
        ) : (
           tareasAgrupadas.map((grupo) => (
               <div key={grupo.fechaKey} className="animate-in fade-in duration-500">
                   
                   {grupo.titulo && (
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 mt-2 flex items-center gap-2">
                           {grupo.titulo}
                           <span className="bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 px-2 py-0.5 rounded-full text-[10px]">
                             {grupo.tareas.length}
                           </span>
                       </h3>
                   )}

                   <div className="grid grid-cols-1 gap-3 sm:gap-4">
                       {grupo.tareas.map((tarea) => (
                           <div key={tarea.id}>
                               <TareaItem 
                                 tarea={tarea} 
                                 isExpanded={expandedId === tarea.id}
                                 onToggle={() => toggleAccordion(tarea.id)}
                                 isJefe={esJefe} 
                                 usuarioActual={usuarioActual}
                                 usuarios={usuarios} 
                               />
                           </div>
                       ))}
                   </div>
               </div>
           ))
        )}
      </div>

      {isModalOpen && (
        <NewTarea 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          usuarios={usuarios}
          usuarioActual={usuarioActual}
          esJefe={esJefe}
        />
      )}

    </div>
  );
}