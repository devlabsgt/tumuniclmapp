'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import Mapa from '@/components/ui/modals/Mapa';
import { format, endOfDay, parseISO, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronsDown, ChevronsUp, AlertCircle, AlertTriangle, XCircle, Calendar } from 'lucide-react';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { AsistenciaEnriquecida } from '@/hooks/asistencia/useObtenerAsistencias';
import AsistenciaControls from './AsistenciaControls';
import OficinaAccordion from './OficinaAccordion';

type Props = {
  registros: AsistenciaEnriquecida[];
  rolActual: string | null; 
  loading: boolean;
  setOficinaId: (id: string | null) => void;
  setFechaInicio: (fecha: string | null) => void;
  setFechaFinal: (fecha: string | null) => void;
};

export type RegistrosAgrupados = {
  entrada: AsistenciaEnriquecida | null;
  salida: AsistenciaEnriquecida | null;
  multiple: AsistenciaEnriquecida[];
  nombre: string;
  puesto_nombre: string;
  oficina_nombre: string;
  oficina_path_orden: string;
  userId: string;
  diaString: string;
  esAusencia?: boolean;
  esDiaVacio?: boolean;
};

export type UsuarioAgrupado = {
  nombre: string;
  puesto_nombre: string;
  oficina_path_orden: string;
  userId: string;
  asistencias: RegistrosAgrupados[];
};

const getWeekLabel = (startDate: Date) => {
  const end = endOfWeek(startDate, { weekStartsOn: 1 });
  return `Del ${format(startDate, 'd', { locale: es })} al ${format(end, 'd \'de\' MMM', { locale: es })}`;
};

export default function AsistenciaTable({ registros, loading, setOficinaId, setFechaInicio, setFechaFinal }: Props) {
  const { dependencias, loading: loadingDependencias } = useDependencias();

  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: any | null, salida: any | null, multiple?: any[] }>({ entrada: null, salida: null });
  const [nombreUsuarioModal, setNombreUsuarioModal] = useState<string>('');
  
  const [fechaInicialRango, setFechaInicialRango] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [fechaFinalRango, setFechaFinalRango] = useState(() => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  const [nivel2Id, setNivel2Id] = useState<string | null>(null);
  const [nivel3Id, setNivel3Id] = useState<string | null>(null);

  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  const [todosAbiertos, setTodosAbiertos] = useState(false);
  
  const [vistaAgrupada, setVistaAgrupada] = useState<'nombre' | 'fecha'>('fecha');
  const [weekLabel, setWeekLabel] = useState(() => getWeekLabel(startOfWeek(new Date(), { weekStartsOn: 1 })));
  const [isNextWeekFuture, setIsNextWeekFuture] = useState(true);

  const [incluirFinesSemana, setIncluirFinesSemana] = useState(false);
  const [ordenDescendente, setOrdenDescendente] = useState(true); 
  const [filtroRapido, setFiltroRapido] = useState<'todos' | 'inasistencia' | 'sin_entrada' | 'sin_salida'>('todos');

  useEffect(() => {
    aplicarFiltros(fechaInicialRango, fechaFinalRango);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalMapaAbierto ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [modalMapaAbierto]);

  const oficinasNivel2 = useMemo(() => {
    const rootIds = new Set(dependencias.filter(d => d.parent_id === null).map(d => d.id));
    return dependencias
      .filter(d => !d.es_puesto && d.parent_id !== null && rootIds.has(d.parent_id))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [dependencias]);

  const oficinasNivel3 = useMemo(() => {
    if (!nivel2Id) return [];
    return dependencias
      .filter(d => !d.es_puesto && d.parent_id === nivel2Id)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [dependencias, nivel2Id]);

  const registrosFiltrados = useMemo(() => {
    if (!searchTerm) return registros;
    const lowerTerm = searchTerm.toLowerCase();
    return registros.filter(registro =>
      (registro.nombre && registro.nombre.toLowerCase().includes(lowerTerm)) ||
      (registro.oficina_nombre && registro.oficina_nombre.toLowerCase().includes(lowerTerm))
    );
  }, [registros, searchTerm]);

  const diasIntervalo = useMemo(() => {
    if (!fechaInicialRango || !fechaFinalRango) return [];
    try {
        const dias = eachDayOfInterval({
            start: parseISO(fechaInicialRango),
            end: parseISO(fechaFinalRango)
        });

        if (incluirFinesSemana) {
          return dias;
        }

        return dias.filter(d => {
          const day = d.getDay();
          return day !== 0 && day !== 6; 
        });

    } catch (e) {
        return [];
    }
  }, [fechaInicialRango, fechaFinalRango, incluirFinesSemana]);

  const registrosDiariosBase = useMemo(() => {
    const registrosTemp: Record<string, Record<string, RegistrosAgrupados>> = {};
    
    registrosFiltrados.forEach(registro => {
      const diaString = format(parseISO(registro.created_at), 'yyyy-MM-dd');
      const userId = registro.user_id;
      const oficinaNombre = registro.oficina_nombre || 'Sin Oficina';
      const oficinaPath = registro.oficina_path_orden || '0';
      const claveUnica = `${diaString}-${userId}`;

      if (!registrosTemp[oficinaNombre]) registrosTemp[oficinaNombre] = {};

      if (!registrosTemp[oficinaNombre][claveUnica]) {
        registrosTemp[oficinaNombre][claveUnica] = {
          entrada: null,
          salida: null,
          multiple: [],
          nombre: registro.nombre || 'N/A',
          puesto_nombre: registro.puesto_nombre || 'N/A',
          oficina_nombre: oficinaNombre,
          oficina_path_orden: oficinaPath,
          userId: userId,
          diaString: diaString,
        };
      }

      const tipoRegistroStr = registro.tipo_registro as string;

      if (tipoRegistroStr === 'Multiple' || tipoRegistroStr === 'Marca') {
        registrosTemp[oficinaNombre][claveUnica].multiple.push(registro);
      } else if (tipoRegistroStr === 'Entrada') {
        registrosTemp[oficinaNombre][claveUnica].entrada = registro;
      } else if (tipoRegistroStr === 'Salida') {
        registrosTemp[oficinaNombre][claveUnica].salida = registro;
      }
    });
    return registrosTemp;
  }, [registrosFiltrados]);

  const datosCompletosFecha = useMemo(() => {
    const agrupadosPorOficina: Record<string, RegistrosAgrupados[]> = {};
    
    Object.keys(registrosDiariosBase).forEach(oficina => {
      agrupadosPorOficina[oficina] = [];
      diasIntervalo.forEach(dia => {
        const diaString = format(dia, 'yyyy-MM-dd');
        const registrosDelDia = Object.values(registrosDiariosBase[oficina])
          .filter(r => r.diaString === diaString)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        if (registrosDelDia.length > 0) {
            agrupadosPorOficina[oficina].push(...registrosDelDia);
        } else {
            agrupadosPorOficina[oficina].push({
                diaString: diaString,
                esDiaVacio: true,
                nombre: '',
                puesto_nombre: '',
                oficina_nombre: oficina,
                oficina_path_orden: '',
                userId: `vacio-${diaString}`,
                entrada: null,
                salida: null,
                multiple: []
            });
        }
      });
      agrupadosPorOficina[oficina].sort((a, b) => {
        const compare = a.diaString.localeCompare(b.diaString);
        return ordenDescendente ? -compare : compare;
      });
    });
    return agrupadosPorOficina;
  }, [registrosDiariosBase, diasIntervalo, ordenDescendente]);

  const datosCompletosUsuario = useMemo(() => {
    const agrupadosPorOficina: Record<string, UsuarioAgrupado[]> = {};
    
    Object.entries(registrosDiariosBase).forEach(([oficinaNombre, registrosMap]) => {
      const usuariosUnicos = new Map<string, { nombre: string, puesto: string, path: string }>();
      Object.values(registrosMap).forEach(r => {
        if (!usuariosUnicos.has(r.userId)) {
            usuariosUnicos.set(r.userId, { nombre: r.nombre, puesto: r.puesto_nombre, path: r.oficina_path_orden });
        }
      });

      const usuariosDelGrupo: UsuarioAgrupado[] = [];
      usuariosUnicos.forEach((datosUsuario, userId) => {
        const asistenciasUsuario: RegistrosAgrupados[] = [];
        diasIntervalo.forEach(dia => {
            const diaString = format(dia, 'yyyy-MM-dd');
            const clave = `${diaString}-${userId}`;
            if (registrosMap[clave]) {
                asistenciasUsuario.push(registrosMap[clave]);
            } else {
                asistenciasUsuario.push({
                    diaString: diaString,
                    esAusencia: true,
                    nombre: datosUsuario.nombre,
                    puesto_nombre: datosUsuario.puesto,
                    oficina_nombre: oficinaNombre,
                    oficina_path_orden: datosUsuario.path,
                    userId: userId,
                    entrada: null,
                    salida: null,
                    multiple: []
                });
            }
        });
        asistenciasUsuario.sort((a, b) => {
            const compare = a.diaString.localeCompare(b.diaString);
            return ordenDescendente ? -compare : compare;
        });
        usuariosDelGrupo.push({
            nombre: datosUsuario.nombre,
            puesto_nombre: datosUsuario.puesto,
            oficina_path_orden: datosUsuario.path,
            userId: userId,
            asistencias: asistenciasUsuario
        });
      });
      usuariosDelGrupo.sort((a, b) => a.nombre.localeCompare(b.nombre));
      agrupadosPorOficina[oficinaNombre] = usuariosDelGrupo;
    });
    return agrupadosPorOficina;
  }, [registrosDiariosBase, diasIntervalo, ordenDescendente]);

  const estadisticas = useMemo(() => {
    let inasistencias = 0;
    let salidasSinMarcaje = 0;
    let entradasSinMarcaje = 0;

    const contarEnArray = (arr: RegistrosAgrupados[]) => {
        arr.forEach(r => {
            if (r.esDiaVacio || r.esAusencia) {
                inasistencias++;
            } else {
                if (r.entrada && !r.salida) salidasSinMarcaje++; 
                if (!r.entrada && r.salida) entradasSinMarcaje++; 
            }
        });
    };

    if (vistaAgrupada === 'fecha') {
        Object.values(datosCompletosFecha).forEach(grupo => contarEnArray(grupo));
    } else {
        Object.values(datosCompletosUsuario).forEach(usuarios => {
            usuarios.forEach(u => contarEnArray(u.asistencias));
        });
    }

    return { inasistencias, salidasSinMarcaje, entradasSinMarcaje };
  }, [datosCompletosFecha, datosCompletosUsuario, vistaAgrupada]);

  const registrosFiltradosFinales = useMemo(() => {
     const filterFn = (r: RegistrosAgrupados) => {
        if (filtroRapido === 'todos') return true;
        if (filtroRapido === 'inasistencia') return r.esDiaVacio || r.esAusencia;
        if (filtroRapido === 'sin_salida') return r.entrada && !r.salida; 
        if (filtroRapido === 'sin_entrada') return !r.entrada && r.salida; 
        return true;
     };

     if (vistaAgrupada === 'fecha') {
        const resultado: Record<string, RegistrosAgrupados[]> = {};
        Object.entries(datosCompletosFecha).forEach(([oficina, regs]) => {
           const filtrados = regs.filter(filterFn);
           if (filtrados.length > 0) resultado[oficina] = filtrados;
        });
        return resultado;
     } else {
        const resultado: Record<string, UsuarioAgrupado[]> = {};
        Object.entries(datosCompletosUsuario).forEach(([oficina, usuarios]) => {
           const usuariosFiltrados = usuarios.map(u => ({
              ...u,
              asistencias: u.asistencias.filter(filterFn)
           })).filter(u => u.asistencias.length > 0);
           
           if (usuariosFiltrados.length > 0) resultado[oficina] = usuariosFiltrados;
        });
        return resultado;
     }
  }, [datosCompletosFecha, datosCompletosUsuario, vistaAgrupada, filtroRapido]);

  const oficinasOrdenadas = useMemo(() => {
    return Object.keys(registrosFiltradosFinales).sort((a, b) => {
        let pathA = '';
        let pathB = '';
        
        if (vistaAgrupada === 'fecha') {
             pathA = (registrosFiltradosFinales as Record<string, RegistrosAgrupados[]>)[a].find(r => !r.esDiaVacio)?.oficina_path_orden || '';
             pathB = (registrosFiltradosFinales as Record<string, RegistrosAgrupados[]>)[b].find(r => !r.esDiaVacio)?.oficina_path_orden || '';
        } else {
             pathA = (registrosFiltradosFinales as Record<string, UsuarioAgrupado[]>)[a][0]?.oficina_path_orden || '';
             pathB = (registrosFiltradosFinales as Record<string, UsuarioAgrupado[]>)[b][0]?.oficina_path_orden || '';
        }
        return pathA.localeCompare(pathB, undefined, { numeric: true });
    });
  }, [registrosFiltradosFinales, vistaAgrupada]);

  const handleAbrirModalMapa = (registro: any, nombre?: string) => {
    setRegistrosSeleccionadosParaMapa({
      entrada: registro.entrada,
      salida: registro.salida,
      multiple: registro.multiple?.length > 0 ? registro.multiple : undefined
    });
    setNombreUsuarioModal(nombre || registro.nombre);
    setModalMapaAbierto(true);
  };

  const aplicarFiltros = (
    start: string | null = fechaInicialRango, 
    end: string | null = fechaFinalRango
  ) => {
    setOficinaId(nivel3Id || nivel2Id || null);
    if (start) {
      const [y, m, d] = start.split('-').map(Number);
      setFechaInicio(new Date(y, m - 1, d, 0, 0, 0).toISOString());
    } else setFechaInicio(null);

    if (end) {
      const [y, m, d] = end.split('-').map(Number);
      setFechaFinal(endOfDay(new Date(y, m - 1, d)).toISOString());
    } else setFechaFinal(null);

    setOficinasAbiertas({});
    setTodosAbiertos(false);
  };

  const checkNextWeekDisabled = (startDate: Date) => {
    setIsNextWeekFuture(addWeeks(startDate, 1) > startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const updateWeekLabel = (startDate: Date) => {
    setWeekLabel(getWeekLabel(startDate));
    checkNextWeekDisabled(startDate);
  };

  const jumpToCurrentWeek = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const sStr = format(start, 'yyyy-MM-dd');
    const eStr = format(end, 'yyyy-MM-dd');
    setFechaInicialRango(sStr);
    setFechaFinalRango(eStr);
    setWeekLabel(getWeekLabel(start));
    aplicarFiltros(sStr, eStr);
    checkNextWeekDisabled(start);
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const currentStart = parseISO(fechaInicialRango);
    if (isNaN(currentStart.getTime())) return jumpToCurrentWeek();

    if (direction === 'next' && addWeeks(currentStart, 1) > startOfWeek(new Date(), { weekStartsOn: 1 })) return;
    
    const newStart = addWeeks(currentStart, direction === 'prev' ? -1 : 1);
    const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
    const sStr = format(newStart, 'yyyy-MM-dd');
    const eStr = format(newEnd, 'yyyy-MM-dd');

    setFechaInicialRango(sStr);
    setFechaFinalRango(eStr);
    updateWeekLabel(newStart);
    aplicarFiltros(sStr, eStr);
  };

  const handleAplicarFechaManual = () => {
    updateWeekLabel(parseISO(fechaInicialRango));
    aplicarFiltros(fechaInicialRango, fechaFinalRango);
  };

  const handleBorrarFiltro = () => {
    setFechaInicialRango('');
    setFechaFinalRango('');
    setSearchTerm(''); 
    setNivel2Id(null);
    setNivel3Id(null);
    aplicarFiltros(null, null); 
    setWeekLabel("Mostrando Todos");
    setIsNextWeekFuture(false);
    setIncluirFinesSemana(false);
    setFiltroRapido('todos');
  };

  const toggleOficina = (nombreOficina: string) => {
    setOficinasAbiertas(prev => ({ ...prev, [nombreOficina]: !prev[nombreOficina] }));
  };

  const toggleTodos = () => {
    const nuevoEstado = !todosAbiertos;
    setTodosAbiertos(nuevoEstado);
    const nuevasOficinas: Record<string, boolean> = {};
    oficinasOrdenadas.forEach(of => nuevasOficinas[of] = nuevoEstado);
    setOficinasAbiertas(nuevasOficinas);
  };

  useEffect(() => {
    if (oficinasOrdenadas.length === 1) {
      setOficinasAbiertas({ [oficinasOrdenadas[0]]: true });
    }
  }, [oficinasOrdenadas]);

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4">
        <div className="p-2 bg-white dark:bg-neutral-950 rounded-lg shadow-md w-full border border-gray-100 dark:border-neutral-800 transition-colors duration-200">
          
          <AsistenciaControls 
            nivel2Id={nivel2Id} setNivel2Id={setNivel2Id}
            nivel3Id={nivel3Id} setNivel3Id={setNivel3Id}
            oficinasNivel2={oficinasNivel2} oficinasNivel3={oficinasNivel3}
            handleMostrarOficina={() => aplicarFiltros()}
            weekLabel={weekLabel} handleWeekChange={handleWeekChange} jumpToCurrentWeek={jumpToCurrentWeek} isNextWeekFuture={isNextWeekFuture}
            fechaInicialRango={fechaInicialRango} setFechaInicialRango={setFechaInicialRango}
            fechaFinalRango={fechaFinalRango} setFechaFinalRango={setFechaFinalRango}
            handleAplicarFechaManual={handleAplicarFechaManual} handleBorrarFiltro={handleBorrarFiltro}
            vistaAgrupada={vistaAgrupada} setVistaAgrupada={setVistaAgrupada}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            ordenDescendente={ordenDescendente} setOrdenDescendente={setOrdenDescendente}
          />

          <div className="border-t border-gray-200 dark:border-neutral-800 pt-4 mt-4">
            {loading || loadingDependencias ? (
              <Cargando texto="Cargando asistencias..." />
            ) : oficinasOrdenadas.length === 0 && filtroRapido === 'todos' ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs">No hay registros disponibles para el rango seleccionado.</p>
            ) : (
              <div className="w-full">
                
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                        size="sm"
                        onClick={() => setIncluirFinesSemana(!incluirFinesSemana)}
                        className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                            incluirFinesSemana
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                            : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                        }`}
                    >
                        <Calendar className="w-3 h-3 mr-1.5" />
                        Incluir fines de semana
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                           size="sm"
                           onClick={() => setFiltroRapido(prev => prev === 'inasistencia' ? 'todos' : 'inasistencia')}
                           className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                               filtroRapido === 'inasistencia' 
                                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                           }`}
                        >
                           <XCircle className="w-3 h-3 mr-1.5" />
                           Inasistencias: {estadisticas.inasistencias}
                        </Button>

                        <Button
                           size="sm"
                           onClick={() => setFiltroRapido(prev => prev === 'sin_entrada' ? 'todos' : 'sin_entrada')}
                           className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                               filtroRapido === 'sin_entrada' 
                                ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' 
                                : 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30'
                           }`}
                        >
                           <AlertCircle className="w-3 h-3 mr-1.5" />
                           Entradas sin marcaje: {estadisticas.entradasSinMarcaje}
                        </Button>

                        <Button
                           size="sm"
                           onClick={() => setFiltroRapido(prev => prev === 'sin_salida' ? 'todos' : 'sin_salida')}
                           className={`h-7 px-3 text-[10px] rounded-sm border transition-all ${
                               filtroRapido === 'sin_salida' 
                                ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600' 
                                : 'bg-yellow-50 text-yellow-700 border-yellow-100 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30'
                           }`}
                        >
                           <AlertTriangle className="w-3 h-3 mr-1.5" />
                           Salidas sin marcaje: {estadisticas.salidasSinMarcaje}
                        </Button>
                    </div>
                  </div>

                  {oficinasOrdenadas.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTodos}
                      className="w-full md:w-auto text-xs flex items-center justify-center gap-2 h-8 px-4 rounded-sm bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-700"
                    >
                      {todosAbiertos ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
                      {todosAbiertos ? 'Cerrar oficinas' : 'Abrir oficinas'}
                    </Button>
                  )}
                </div>

                <div className="w-full overflow-x-auto rounded-lg border border-gray-100 dark:border-neutral-800">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-slate-50 dark:bg-neutral-900 text-left">
                      <tr>
                        <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            {vistaAgrupada === 'fecha' ? 'Usuario' : 'Fecha'}
                          </div>
                        </th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Entrada</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oficinasOrdenadas.map((nombreOficina) => (
                        <OficinaAccordion 
                          key={nombreOficina}
                          nombreOficina={nombreOficina}
                          registros={vistaAgrupada === 'fecha' 
                             ? (registrosFiltradosFinales as Record<string, RegistrosAgrupados[]>)[nombreOficina] 
                             : (registrosFiltradosFinales as Record<string, UsuarioAgrupado[]>)[nombreOficina]
                          }
                          vistaAgrupada={vistaAgrupada}
                          estaAbierta={oficinasAbiertas[nombreOficina] || false}
                          onToggle={() => toggleOficina(nombreOficina)}
                          onAbrirModal={handleAbrirModalMapa}
                        />
                      ))}
                      {oficinasOrdenadas.length === 0 && (
                          <tr>
                              <td colSpan={3} className="py-8 text-center text-gray-400 text-xs italic">
                                  No hay registros que coincidan con el filtro seleccionado.
                              </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {modalMapaAbierto && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registros={registrosSeleccionadosParaMapa}
            nombreUsuario={nombreUsuarioModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}