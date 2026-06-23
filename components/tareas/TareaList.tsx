'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Tarea, Usuario, PerfilUsuario, TipoVistaTareas } from './types'; 
import TareaItem from './TareaItem';
import NewTarea from './modals/NewTarea'; 
import { Plus, SearchX, ArrowLeft, Search, Building2, ChevronDown, User, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGestorData } from './hooks';
import SelectorMesAnio from './SelectorMesAnio';

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

const obtenerIndiceSemanaActual = (mes: number, anio: number) => {
  const semanas = obtenerSemanas(mes, anio);
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  const indice = semanas.findIndex((sem) => {
    const inicio = new Date(sem.inicio);
    const fin = new Date(sem.fin);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
    return hoy >= inicio && hoy <= fin;
  });

  return indice;
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

const formatearConfirmadoAt = (fechaISO: string) => {
  const d = new Date(fechaISO);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diaSemana = dias[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  let hora = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, '0');
  const period = hora >= 12 ? 'PM' : 'AM';
  hora = hora % 12;
  hora = hora ? hora : 12;
  return `${diaSemana} ${day}/${month}/${year}, ${hora}:${minutos} ${period}`;
};

interface TareaCardProps {
  tarea: Tarea;
  isExpanded: boolean;
  onToggle: () => void;
  isJefe: boolean;
  usuarioActual: string;
  usuarios: Usuario[];
}

function TareaCard({ tarea, isExpanded, onToggle, isJefe, usuarioActual, usuarios }: TareaCardProps) {
  return (
    <div className="relative">
      <TareaItem
        tarea={tarea}
        isExpanded={isExpanded}
        onToggle={onToggle}
        isJefe={isJefe}
        usuarioActual={usuarioActual}
        usuarios={usuarios}
      />
      {!isExpanded && tarea.confirmed_at && (
        <p className="absolute bottom-3 right-4 sm:bottom-4 sm:right-5 text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold pointer-events-none z-10">
          Confirmación: {formatearConfirmadoAt(tarea.confirmed_at)}
        </p>
      )}
    </div>
  );
}

const TAB_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'Asignado': { active: 'bg-purple-600 text-white', inactive: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700' },
  'Completado': { active: 'bg-emerald-600 text-white', inactive: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  'Vencido': { active: 'bg-red-600 text-white', inactive: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', badge: 'bg-red-100 text-red-700' }
};

const ALCANCE_JEFE_STYLES: Record<string, { active: string, inactive: string, badge: string }> = {
  'equipo': { active: 'bg-blue-600 text-white', inactive: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700' },
  'externa': { active: 'bg-amber-600 text-white', inactive: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700' },
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
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [alcanceJefe, setAlcanceJefe] = useState<'equipo' | 'externa'>('equipo');
  
  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();
    setMesSeleccionado(mes);
    setAnioSeleccionado(anio);
    const indiceSemana = obtenerIndiceSemanaActual(mes, anio);
    setSemanaSeleccionada(indiceSemana >= 0 ? indiceSemana : -1);
    setIsMounted(true);
  }, []);

  const semanasDisponibles = useMemo(() => {
    return obtenerSemanas(mesSeleccionado, anioSeleccionado);
  }, [mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    if (!isMounted) return;

    const hoy = new Date();
    if (mesSeleccionado === hoy.getMonth() && anioSeleccionado === hoy.getFullYear()) {
      const indiceSemana = obtenerIndiceSemanaActual(mesSeleccionado, anioSeleccionado);
      setSemanaSeleccionada(indiceSemana >= 0 ? indiceSemana : -1);
    } else {
      setSemanaSeleccionada(-1);
    }
  }, [mesSeleccionado, anioSeleccionado, isMounted]);

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

  const tareasPorAlcance = useMemo(() => {
    if (tipoVista !== 'gestion_jefe') return tareas;
    return tareas.filter((t: Tarea) => (t.alcance || 'equipo') === alcanceJefe);
  }, [tareas, tipoVista, alcanceJefe]);

  const conteosAlcanceJefe = useMemo(() => {
    if (tipoVista !== 'gestion_jefe') return { equipo: 0, externa: 0 };
    return {
      equipo: tareas.filter((t: Tarea) => (t.alcance || 'equipo') === 'equipo').length,
      externa: tareas.filter((t: Tarea) => t.alcance === 'externa').length,
    };
  }, [tareas, tipoVista]);

  useEffect(() => {
    if (tipoVista === 'gestion_jefe' && isMounted && alcanceJefe === 'equipo' && conteosAlcanceJefe.equipo === 0 && conteosAlcanceJefe.externa > 0) {
      setAlcanceJefe('externa');
    }
  }, [tipoVista, isMounted, alcanceJefe, conteosAlcanceJefe]);

  useEffect(() => {
    setFiltroEstado('');
  }, [alcanceJefe]);

  const tareasFiltradas = useMemo(() => {
    if (!isMounted) return [];

    return tareasPorAlcance.filter((t: Tarea) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth() + 1;
      const tDay = d.getDate();
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

      const coincideMes = (tMonth - 1) === mesSeleccionado && tYear === anioSeleccionado;
      const esActiva = t.status !== 'Completado';
      const visibleFueraDeSemana = semanaSeleccionada !== -1 && coincideMes && esActiva;
      
      const termino = busqueda.toLowerCase();
      const coincideTitulo = t.title.toLowerCase().includes(termino);
      const coincideUsuario = (t.assignee?.nombre || '').toLowerCase().includes(termino);
      
      return (coincideFecha || visibleFueraDeSemana) && (coincideTitulo || coincideUsuario);
    }).map((t: Tarea) => {
      const esVencida = new Date() > new Date(t.due_date) && t.status !== 'Completado';
      return { ...t, estadoFiltro: esVencida ? 'Vencido' : t.status };
    });
  }, [tareasPorAlcance, mesSeleccionado, anioSeleccionado, semanaSeleccionada, semanasDisponibles, busqueda, isMounted]);

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

  const ordenarPorFecha = (lista: Tarea[]) => {
    return [...lista].sort((a, b) => {
      const cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      return ordenDescendente ? -cmp : cmp;
    });
  };

  const listaVisual = useMemo(() => {
      const filtradas = tareasFiltradas.filter((t: Tarea) => filtroEstado === '' ? true : (filtroEstado === 'Asignado' ? (t.estadoFiltro === 'Asignado' || t.estadoFiltro === 'En Proceso') : t.estadoFiltro === filtroEstado));
      return ordenarPorFecha(filtradas);
  }, [tareasFiltradas, filtroEstado, ordenDescendente]);
  
  const tareasRenderizadas = useMemo(() => {
      return expandedId ? listaVisual.filter((t: Tarea) => t.id === expandedId) : listaVisual;
  }, [expandedId, listaVisual]);

  const tareasAgrupadas = useMemo(() => {
      if (!isMounted) return [];

      if (tipoVista === 'mis_actividades') {
          const grupos: any[] = [];
          tareasRenderizadas.forEach((t: Tarea) => {
              const d = new Date(t.due_date);
              const localYear = d.getFullYear();
              const localMonth = String(d.getMonth() + 1).padStart(2, '0');
              const localDay = String(d.getDate()).padStart(2, '0');
              const fechaKey = `${localYear}-${localMonth}-${localDay}`;
              let g = grupos.find(x => x.key === fechaKey);
              if (!g) { g = { key: fechaKey, titulo: getFechaCabecera(fechaKey), tareas: [] }; grupos.push(g); }
              g.tareas.push(t);
          });
          return grupos
            .sort((a, b) => ordenDescendente ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key))
            .map((g) => ({ ...g, tareas: ordenarPorFecha(g.tareas) }));
      } else {
          const usarSubgruposPersona = tipoVista === 'gestion_jefe' && alcanceJefe === 'equipo';
          const grupos: Record<string, {
            key: string;
            titulo: string;
            tareas: Tarea[];
            subgrupos: Record<string, { key: string; nombre: string; tareas: Tarea[] }>;
          }> = {};

          if (usarSubgruposPersona) {
              perfilUsuario.oficinasACargo.forEach(of => {
                  grupos[of.nombre] = { key: of.nombre, titulo: of.nombre, tareas: [], subgrupos: {} };
              });
          }

          tareasRenderizadas.forEach((t: Tarea) => {
              const ofName = t.assignee?.oficina_nombre || 'Sin Oficina';
              if (!grupos[ofName]) {
                  grupos[ofName] = { key: ofName, titulo: ofName, tareas: [], subgrupos: {} };
              }

              if (usarSubgruposPersona) {
                  const personKey = t.assigned_to || 'sin-asignar';
                  const personName = t.assignee?.nombre || 'Sin asignar';
                  if (!grupos[ofName].subgrupos[personKey]) {
                      grupos[ofName].subgrupos[personKey] = { key: personKey, nombre: personName, tareas: [] };
                  }
                  grupos[ofName].subgrupos[personKey].tareas.push(t);
              } else {
                  grupos[ofName].tareas.push(t);
              }
          });

          return Object.values(grupos)
            .filter(g => usarSubgruposPersona ? Object.keys(g.subgrupos).length > 0 : g.tareas.length > 0)
            .map(g => ({
              key: g.key,
              titulo: g.titulo,
              subgrupos: usarSubgruposPersona
                ? Object.values(g.subgrupos)
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((s) => ({ ...s, tareas: ordenarPorFecha(s.tareas) }))
                : undefined,
              tareas: usarSubgruposPersona
                ? Object.values(g.subgrupos).flatMap(s => ordenarPorFecha(s.tareas))
                : ordenarPorFecha(g.tareas),
            }))
            .sort((a, b) => a.titulo.localeCompare(b.titulo));
      }
  }, [tareasRenderizadas, tipoVista, perfilUsuario, isMounted, alcanceJefe, ordenDescendente]);

  const tituloPagina = useMemo(() => {
      if (tipoVista === 'mis_actividades') return 'Mis Actividades';
      if (tipoVista === 'gestion_jefe') return `Supervisión (${perfilUsuario.nombre})`;
      if (tipoVista === 'gestion_rrhh') return 'Administración de Actividades';
      return 'Actividades';
  }, [tipoVista, perfilUsuario]);

  if (!isMounted) return <div className="w-full h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {!expandedId && (
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 mb-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-3 lg:gap-4 w-full">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{tituloPagina}</h1>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                        {tipoVista === 'mis_actividades'
                          ? 'Gestiona tus prioridades del día'
                          : tipoVista === 'gestion_jefe' && alcanceJefe === 'externa'
                            ? 'Actividades que asignaste a otras oficinas'
                            : 'Supervisa el avance de tu equipo'}
                    </p>
                </div>
                {(tipoVista === 'mis_actividades' || (tipoVista === 'gestion_jefe' && perfilUsuario.esJefe)) && (
                    <button onClick={() => setIsModalOpen(true)} className="w-full lg:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm active:scale-95">
                        <Plus size={20} /> Nueva Actividad
                    </button>
                )}
            </div>

            {tipoVista === 'gestion_jefe' && (conteosAlcanceJefe.equipo > 0 || conteosAlcanceJefe.externa > 0) && (
                <div className="w-full">
                    <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm w-full">
                        {([
                          { key: 'equipo' as const, label: 'Mi equipo' },
                          { key: 'externa' as const, label: 'Otras oficinas' },
                        ]).map(({ key, label }) => {
                            const styles = ALCANCE_JEFE_STYLES[key];
                            const isActive = alcanceJefe === key;
                            const count = conteosAlcanceJefe[key];
                            return (
                                <button
                                  key={key}
                                  onClick={() => setAlcanceJefe(key)}
                                  className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive ? styles.active : styles.inactive}`}
                                >
                                    <span className="truncate">{label}</span>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center shrink-0 ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>
                                      {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 w-full">
                {pestañas.length > 0 && (
                    <div className="w-full">
                        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm w-full">
                            {pestañas.map((tab) => {
                                const styles = TAB_STYLES[tab];
                                const isActive = filtroEstado === tab;
                                return (
                                    <button key={tab} onClick={() => setFiltroEstado(isActive ? '' : tab)} className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${isActive ? styles.active : styles.inactive}`}>
                                        <span className="truncate">{tab.toUpperCase()}</span>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center shrink-0 ${isActive ? 'bg-white/20 text-white' : styles.badge}`}>{conteos[tab as keyof typeof conteos]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-2 w-full lg:items-stretch">
                    <div className="relative w-full lg:flex-1 lg:min-w-[160px] group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200" />
                    </div>
                    <div className="flex flex-row gap-2 w-full lg:w-auto lg:shrink-0 items-stretch">
                        <SelectorMesAnio
                          className="flex-1 lg:flex-none lg:w-auto min-w-0"
                          mes={mesSeleccionado}
                          anio={anioSeleccionado}
                          onChange={(mes, anio) => {
                            setMesSeleccionado(mes);
                            setAnioSeleccionado(anio);
                          }}
                        />
                        <div className="relative flex-1 lg:flex-none lg:w-44 xl:w-48 min-w-0">
                            <select value={semanaSeleccionada} onChange={(e) => setSemanaSeleccionada(Number(e.target.value))} className="w-full appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium text-slate-700 dark:text-gray-200 truncate">
                                <option value={-1}>Todas las semanas</option>
                                {semanasDisponibles.map(sem => <option key={sem.id} value={sem.id}>{sem.label}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setOrdenDescendente((prev) => !prev)}
                          title={ordenDescendente ? 'Más recientes primero' : 'Más antiguas primero'}
                          className="shrink-0 flex items-center justify-center w-11 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {ordenDescendente ? <ArrowDownWideNarrow size={18} /> : <ArrowUpWideNarrow size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {expandedId && (
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={() => toggleAccordion(expandedId)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2"
        >
          <ArrowLeft size={16} /> Volver a la lista
        </motion.button>
      )}

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
        ) : expandedId ? (
           <AnimatePresence mode="wait">
             <motion.div
               key={expandedId}
               initial={{ opacity: 0, y: 16 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
               className="w-full grid grid-cols-1 gap-3"
             >
               {tareasRenderizadas.map((t: Tarea) => (
                   <TareaCard
                     key={t.id}
                     tarea={t}
                     isExpanded
                     onToggle={() => toggleAccordion(t.id)}
                     isJefe={perfilUsuario.esJefe}
                     usuarioActual={perfilUsuario.id}
                     usuarios={usuarios}
                   />
               ))}
             </motion.div>
           </AnimatePresence>
        ) : (
           tareasAgrupadas.map((grupo: any) => {
               if (tipoVista === 'mis_actividades') {
                   return (
                       <div key={grupo.key} className="animate-in fade-in duration-500">
                           {grupo.titulo && (
                               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1 mt-2 flex items-center gap-2">
                                   {grupo.titulo} 
                                   <span className="bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-[10px]">{grupo.tareas.length}</span>
                               </h3>
                           )}
                           <div className="grid grid-cols-1 gap-3">
                               {grupo.tareas.map((t: Tarea) => (
                                   <TareaCard key={t.id} tarea={t} isExpanded={false} onToggle={() => toggleAccordion(t.id)} isJefe={perfilUsuario.esJefe} usuarioActual={perfilUsuario.id} usuarios={usuarios} />
                               ))}
                           </div>
                       </div>
                   );
               } 
               else {
                   const estaAbierta = oficinasAbiertas[grupo.key] || false;
                   const tieneSubgrupos = grupo.subgrupos && grupo.subgrupos.length > 0;
                   return (
                       <div key={grupo.key} className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
                           <div onClick={() => toggleOficina(grupo.key)} className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                               <div className="flex items-center gap-3 min-w-0">
                                   <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                                       <Building2 size={20} />
                                   </div>
                                   <div className="min-w-0">
                                       <h3 className="font-bold text-slate-800 dark:text-white text-sm">{grupo.titulo}</h3>
                                       <p className="text-xs text-slate-500 dark:text-gray-400">{grupo.tareas.length} actividades</p>
                                   </div>
                               </div>
                               <ChevronDown size={20} className={`text-slate-400 transition-transform shrink-0 ${estaAbierta ? 'rotate-180' : ''}`} />
                           </div>
                           
                           <AnimatePresence>
                               {estaAbierta && (
                                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
                                       {tieneSubgrupos ? (
                                         <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                           {grupo.subgrupos.map((persona: { key: string; nombre: string; tareas: Tarea[] }) => (
                                             <div key={persona.key}>
                                               <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 dark:bg-neutral-800/40">
                                                 <User size={14} className="text-slate-400 shrink-0" />
                                                 <span className="text-xs font-bold text-slate-600 dark:text-gray-300 truncate">{persona.nombre}</span>
                                                 <span className="text-[10px] font-semibold bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-gray-300 px-2 py-0.5 rounded-full shrink-0">{persona.tareas.length}</span>
                                               </div>
                                               <div className="grid grid-cols-1 gap-2 py-2">
                                                 {persona.tareas.map((t: Tarea) => (
                                                   <TareaCard key={t.id} tarea={t} isExpanded={false} onToggle={() => toggleAccordion(t.id)} isJefe={perfilUsuario.esJefe} usuarioActual={perfilUsuario.id} usuarios={usuarios} />
                                                 ))}
                                               </div>
                                             </div>
                                           ))}
                                         </div>
                                       ) : (
                                         <div className="grid grid-cols-1 gap-2 py-2">
                                           {grupo.tareas.map((t: Tarea) => (
                                             <TareaCard key={t.id} tarea={t} isExpanded={false} onToggle={() => toggleAccordion(t.id)} isJefe={perfilUsuario.esJefe} usuarioActual={perfilUsuario.id} usuarios={usuarios} />
                                           ))}
                                         </div>
                                       )}
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