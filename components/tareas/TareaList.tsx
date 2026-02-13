'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Tarea, Usuario, PerfilUsuario, TipoVistaTareas } from './types'; 
import TareaItem from './TareaItem';
import NewTarea from './modals/NewTarea'; 
import { Plus, SearchX, ArrowLeft, Search, Calendar as CalendarIcon, Building2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestorData } from './hooks';

interface Props {
  initialData: {
      tareas: Tarea[];
      usuarios: Usuario[];
      perfil: PerfilUsuario;
  };
  tipoVista: TipoVistaTareas;
}

const MESES = [ 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre' ];
const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - 1 + i);

const formatearFechaCorta = (fecha: Date) => {
  return `${fecha.getDate()} ${MESES_ABREV[fecha.getMonth()]}`;
};

const obtenerSemanas = (mes: number, anio: number) => {
  const primerDiaMes = new Date(anio, mes, 1);
  const diaSemana = primerDiaMes.getDay();
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioPrimerSemana = new Date(anio, mes, 1 - offset);

  return Array.from({ length: 5 }, (_, i) => {
    const inicio = new Date(inicioPrimerSemana.getFullYear(), inicioPrimerSemana.getMonth(), inicioPrimerSemana.getDate() + (i * 7));
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    return { id: i, label: `${formatearFechaCorta(inicio)} - ${formatearFechaCorta(fin)}`, inicio, fin };
  });
};

const getFechaCabecera = (fechaIso: string) => {
  if (!fechaIso) return 'Sin fecha';
  const fechaParte = fechaIso.split('T')[0];
  const [year, month, day] = fechaParte.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric' };
  const str = new Intl.DateTimeFormat('es-ES', opciones).format(fecha);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const TAB_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'Asignado': { active: 'bg-purple-600 text-white', inactive: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700' },
  'Completado': { active: 'bg-emerald-600 text-white', inactive: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  'Vencido': { active: 'bg-red-600 text-white', inactive: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', badge: 'bg-red-100 text-red-700' }
};

export default function TareaList({ initialData, tipoVista }: Props) {
  const { data } = useGestorData(tipoVista, initialData);
  
  const tareas = (data?.tareas || []) as Tarea[];
  const usuarios = (data?.usuarios || []) as Usuario[];
  const perfilUsuario = (data?.perfil || initialData.perfil) as PerfilUsuario;

  const [isMounted, setIsMounted] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(0); 
  const [anioSeleccionado, setAnioSeleccionado] = useState(ANIO_ACTUAL);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(-1);
  
  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const hoy = new Date();
    setMesSeleccionado(hoy.getMonth());
    setAnioSeleccionado(hoy.getFullYear());
    setIsMounted(true);
  }, []);

  const semanasDisponibles = useMemo(() => {
    return obtenerSemanas(mesSeleccionado, anioSeleccionado);
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    setSemanaSeleccionada(-1);
  }, [mesSeleccionado, anioSeleccionado]);

  const toggleAccordion = (id: string) => {
    if (expandedId === id) setExpandedId(null);
    else {
        scrollPositionRef.current = window.scrollY;
        setExpandedId(id);
        window.scrollTo({ top: 0, behavior: 'instant' }); 
    }
  };

  const toggleOficina = (nombre: string) => {
    setOficinasAbiertas(prev => ({ ...prev, [nombre]: !prev[nombre] }));
  };

  useEffect(() => {
    if (expandedId === null) window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
  }, [expandedId]);

  const tareasFiltradas = useMemo(() => {
    if (!isMounted) return [];

    return tareas.filter((t: Tarea) => {
      if (!t.due_date) return false;
      const [tYear, tMonth, tDay] = t.due_date.split('T')[0].split('-').map(Number);
      const tDate = new Date(tYear, tMonth - 1, tDay);

      let coincideFecha = false;
      if (semanaSeleccionada !== -1) {
          const sem = semanasDisponibles[semanaSeleccionada];
          sem.inicio.setHours(0,0,0,0);
          sem.fin.setHours(23,59,59,999);
          coincideFecha = tDate >= sem.inicio && tDate <= sem.fin;
      } else {
          coincideFecha = (tMonth - 1) === mesSeleccionado && tYear === anioSeleccionado;
      }
      
      const termino = busqueda.toLowerCase();
      const coincideTitulo = t.title.toLowerCase().includes(termino);
      const coincideUsuario = (t.assignee?.nombre || '').toLowerCase().includes(termino);
      
      return coincideFecha && (coincideTitulo || coincideUsuario);
    }).map((t: Tarea) => {
      const esVencida = new Date() > new Date(t.due_date) && t.status !== 'Completado';
      return { ...t, estadoFiltro: esVencida ? 'Vencido' : t.status };
    });
  }, [tareas, mesSeleccionado, anioSeleccionado, semanaSeleccionada, semanasDisponibles, busqueda, isMounted]);

  const conteos = useMemo(() => ({
      Asignado: tareasFiltradas.filter((t: Tarea) => t.estadoFiltro === 'Asignado' || t.estadoFiltro === 'En Proceso').length,
      'Completado': tareasFiltradas.filter((t: Tarea) => t.estadoFiltro === 'Completado').length,
      'Vencido': tareasFiltradas.filter((t: Tarea) => t.estadoFiltro === 'Vencido').length,
  }), [tareasFiltradas]);

  const pestañas = useMemo(() => ['Asignado', 'Completado', 'Vencido'].filter(t => conteos[t as keyof typeof conteos] > 0), [conteos]);

  useEffect(() => {
    if (isMounted && pestañas.length > 0 && filtroEstado !== '' && !pestañas.includes(filtroEstado)) {
        setFiltroEstado('');
    }
  }, [pestañas, filtroEstado, isMounted]);

  const listaVisual = useMemo(() => {
      return tareasFiltradas.filter((t: Tarea) => filtroEstado === '' ? true : (filtroEstado === 'Asignado' ? (t.estadoFiltro === 'Asignado' || t.estadoFiltro === 'En Proceso') : t.estadoFiltro === filtroEstado));
  }, [tareasFiltradas, filtroEstado]);
  
  const tareasRenderizadas = useMemo(() => {
      return expandedId ? listaVisual.filter((t: Tarea) => t.id === expandedId) : listaVisual;
  }, [expandedId, listaVisual]);

  const tareasAgrupadas = useMemo(() => {
      if (!isMounted) return [];
      if (expandedId) return [{ key: 'expanded', titulo: null, tareas: tareasRenderizadas }];

      if (tipoVista === 'mis_actividades') {
          const grupos: any[] = [];
          tareasRenderizadas.forEach((t: Tarea) => {
              const fechaKey = t.due_date.split('T')[0];
              let g = grupos.find(x => x.key === fechaKey);
              if (!g) { g = { key: fechaKey, titulo: getFechaCabecera(fechaKey), tareas: [] }; grupos.push(g); }
              g.tareas.push(t);
          });
          return grupos.sort((a, b) => a.key.localeCompare(b.key));
      } else {
          const grupos: Record<string, { key: string, titulo: string, tareas: Tarea[] }> = {};
          
          if (tipoVista === 'gestion_jefe') {
              perfilUsuario.oficinasACargo.forEach(of => {
                  grupos[of.nombre] = { key: of.nombre, titulo: of.nombre, tareas: [] };
              });
          }

          tareasRenderizadas.forEach((t: Tarea) => {
              const ofName = t.assignee?.oficina_nombre || 'Sin Oficina';
              if (!grupos[ofName]) grupos[ofName] = { key: ofName, titulo: ofName, tareas: [] };
              grupos[ofName].tareas.push(t);
          });

          return Object.values(grupos).filter(g => g.tareas.length > 0).sort((a, b) => a.titulo.localeCompare(b.titulo));
      }
  }, [tareasRenderizadas, tipoVista, expandedId, perfilUsuario, isMounted]);

  const tituloPagina = useMemo(() => {
      if (tipoVista === 'mis_actividades') return 'Mis Actividades';
      if (tipoVista === 'gestion_jefe') return `Supervisión (${perfilUsuario.nombre})`;
      if (tipoVista === 'gestion_rrhh') return 'Administración de Actividades';
      return 'Actividades';
  }, [tipoVista, perfilUsuario]);

  if (!isMounted) return <div className="w-full h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6 w-full max-w-full">
      {!expandedId && (
        <div className="flex flex-col gap-6 mb-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{tituloPagina}</h1>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                        {tipoVista === 'mis_actividades' ? 'Gestiona tus prioridades del día' : 'Supervisa el avance de tu equipo'}
                    </p>
                </div>
                {(tipoVista === 'mis_actividades' || (tipoVista === 'gestion_jefe' && perfilUsuario.esJefe)) && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm active:scale-95">
                        <Plus size={20} /> Nueva Actividad
                    </button>
                )}
            </div>

            <div className="flex flex-col xl:flex-row gap-4 mt-2">
                {pestañas.length > 0 && (
                    <div className="overflow-x-auto pb-1 xl:pb-0">
                        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm min-w-max">
                            {pestañas.map((tab) => {
                                const styles = TAB_STYLES[tab];
                                const isActive = filtroEstado === tab;
                                return (
                                    <button key={tab} onClick={() => setFiltroEstado(isActive ? '' : tab)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive ? styles.active : styles.inactive}`}>
                                        {tab.toUpperCase()}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>{conteos[tab as keyof typeof conteos]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200" />
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                        <div className="relative">
                            <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="pl-4 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200">
                                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="relative min-w-[110px]">
                            <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200">
                                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative min-w-[140px]">
                            <select value={semanaSeleccionada} onChange={(e) => setSemanaSeleccionada(Number(e.target.value))} className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200">
                                <option value={-1}>Todas las semanas</option>
                                {semanasDisponibles.map(sem => <option key={sem.id} value={sem.id}>{sem.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {expandedId && <button onClick={() => toggleAccordion(expandedId)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2"><ArrowLeft size={16} /> Volver a la lista</button>}

      <div className="pb-20 space-y-4">
        {!expandedId && tareasRenderizadas.length > 0 && (
           <div className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">
               Total en {semanaSeleccionada === -1 ? 'el mes' : 'la semana'}: {tareasRenderizadas.length} actividades
           </div>
        )}

        {pestañas.length === 0 ? (
           <div className="text-center py-16 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800">
                <SearchX size={32} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-slate-900 dark:text-white font-bold">No se encontraron actividades</h3>
           </div>
        ) : (
           tareasAgrupadas.map((grupo: any) => {
               if (tipoVista === 'mis_actividades') {
                   return (
                       <div key={grupo.key} className="animate-in fade-in duration-500">
                           {grupo.titulo && (
                               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 mt-2 flex items-center gap-2">
                                   {grupo.titulo} 
                                   {!expandedId && <span className="bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-[10px]">{grupo.tareas.length}</span>}
                               </h3>
                           )}
                           <div className="grid grid-cols-1 gap-3">
                               {grupo.tareas.map((t: Tarea) => (
                                   <TareaItem key={t.id} tarea={t} isExpanded={expandedId === t.id} onToggle={() => toggleAccordion(t.id)} isJefe={perfilUsuario.esJefe} usuarioActual={perfilUsuario.id} usuarios={usuarios} />
                               ))}
                           </div>
                       </div>
                   );
               } 
               else {
                   const estaAbierta = oficinasAbiertas[grupo.key] || false;
                   return (
                       <div key={grupo.key} className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
                           <div onClick={() => toggleOficina(grupo.key)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                               <div className="flex items-center gap-3">
                                   <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                       <Building2 size={20} />
                                   </div>
                                   <div>
                                       <h3 className="font-bold text-slate-800 dark:text-white text-sm">{grupo.titulo}</h3>
                                       {!expandedId && <p className="text-xs text-slate-500 dark:text-gray-400">{grupo.tareas.length} actividades</p>}
                                   </div>
                               </div>
                               <ChevronDown size={20} className={`text-slate-400 transition-transform ${estaAbierta ? 'rotate-180' : ''}`} />
                           </div>
                           
                           <AnimatePresence>
                               {estaAbierta && (
                                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
                                       <div className="p-3 grid grid-cols-1 gap-3">
                                           {grupo.tareas.map((t: Tarea) => (
                                               <TareaItem key={t.id} tarea={t} isExpanded={expandedId === t.id} onToggle={() => toggleAccordion(t.id)} isJefe={perfilUsuario.esJefe} usuarioActual={perfilUsuario.id} usuarios={usuarios} />
                                           ))}
                                       </div>
                                   </motion.div>
                               )}
                           </AnimatePresence>
                       </div>
                   );
               }
           })
        )}
      </div>

      {isModalOpen && <NewTarea isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} usuarios={usuarios} usuarioActual={perfilUsuario.id} esJefe={perfilUsuario.esJefe} />}
    </div>
  );
}