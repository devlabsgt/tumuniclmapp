'use client';

import React, { useState, Fragment, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import Mapa from '@/components/ui/modals/Mapa';
import { format, endOfDay, parseISO, startOfWeek, endOfWeek, addWeeks, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { AsistenciaEnriquecida } from '@/hooks/asistencia/useObtenerAsistencias';
import { List, Search, ChevronDown, ChevronsDown, ChevronsUp, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  registros: AsistenciaEnriquecida[];
  rolActual: string | null;
  loading: boolean;
  setOficinaId: (id: string | null) => void;
  setFechaInicio: (fecha: string | null) => void;
  setFechaFinal: (fecha: string | null) => void;
};

type RegistrosAgrupados = {
  entrada: AsistenciaEnriquecida | null;
  salida: AsistenciaEnriquecida | null;
  multiple: AsistenciaEnriquecida[];
  nombre: string;
  puesto_nombre: string;
  oficina_nombre: string;
  oficina_path_orden: string;
  userId: string;
  diaString: string;
};

type UsuarioAgrupado = {
  nombre: string;
  puesto_nombre: string;
  oficina_path_orden: string;
  asistencias: RegistrosAgrupados[];
};

const getWeekLabel = (startDate: Date) => {
    const end = endOfWeek(startDate, { weekStartsOn: 1 });
    return `Del ${format(startDate, 'd')} al ${format(end, 'd \'de\' MMM')}`;
};

export default function AsistenciaTable({ registros, rolActual, loading, setOficinaId, setFechaInicio, setFechaFinal }: Props) {
  const { dependencias, loading: loadingDependencias } = useDependencias();

  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] }>({ entrada: null, salida: null });
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

  useEffect(() => {
    if (modalMapaAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalMapaAbierto]);

  const oficinasNivel2 = useMemo(() => {
    const rootIds = new Set(dependencias.filter(d => d.parent_id === null).map(d => d.id));
    return dependencias
      .filter(d => !d.es_puesto && d.parent_id !== null && rootIds.has(d.parent_id))
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [dependencias]);

  const oficinasNivel3 = useMemo(() => {
    if (!nivel2Id) {
      return [];
    }
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

  const registrosDiariosBase = useMemo(() => {
    const registrosTemp: Record<string, Record<string, RegistrosAgrupados>> = {};
    
    registrosFiltrados.forEach(registro => {
      const diaString = format(parseISO(registro.created_at), 'yyyy-MM-dd');
      const userId = registro.user_id;
      const oficinaNombre = registro.oficina_nombre || 'Sin Oficina';
      const oficinaPath = registro.oficina_path_orden || '0';
      const claveUnica = `${diaString}-${userId}`;

      if (!registrosTemp[oficinaNombre]) {
        registrosTemp[oficinaNombre] = {};
      }

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

      const tipoStr = registro.tipo_registro as string;
      if (tipoStr === 'Multiple' || tipoStr === 'Marca') {
        registrosTemp[oficinaNombre][claveUnica].multiple.push(registro);
      } else if (registro.tipo_registro === 'Entrada') {
        registrosTemp[oficinaNombre][claveUnica].entrada = registro;
      } else if (registro.tipo_registro === 'Salida') {
        registrosTemp[oficinaNombre][claveUnica].salida = registro;
      }
    });
    return registrosTemp;
  }, [registrosFiltrados]);

  const registrosAgrupadosPorOficinaYFecha = useMemo(() => {
    const agrupadosPorOficina: Record<string, RegistrosAgrupados[]> = {};
    Object.keys(registrosDiariosBase).forEach(oficina => {
      agrupadosPorOficina[oficina] = Object.values(registrosDiariosBase[oficina])
        .sort((a, b) => b.diaString.localeCompare(a.diaString) || a.nombre.localeCompare(b.nombre));
    });
    return agrupadosPorOficina;
  }, [registrosDiariosBase]);

  const registrosAgrupadosPorOficinaYUsuario = useMemo(() => {
    const agrupadosPorOficina: Record<string, Record<string, UsuarioAgrupado>> = {};

    Object.entries(registrosDiariosBase).forEach(([oficinaNombre, dias]) => {
      if (!agrupadosPorOficina[oficinaNombre]) {
        agrupadosPorOficina[oficinaNombre] = {};
      }
      
      Object.values(dias).forEach((registroDiario) => {
        const userId = registroDiario.userId;
        if (!agrupadosPorOficina[oficinaNombre][userId]) {
          agrupadosPorOficina[oficinaNombre][userId] = {
            nombre: registroDiario.nombre,
            puesto_nombre: registroDiario.puesto_nombre,
            oficina_path_orden: registroDiario.oficina_path_orden,
            asistencias: []
          };
        }
        agrupadosPorOficina[oficinaNombre][userId].asistencias.push(registroDiario);
      });
    });

    const final: Record<string, UsuarioAgrupado[]> = {};
    Object.entries(agrupadosPorOficina).forEach(([oficinaNombre, usuarios]) => {
      final[oficinaNombre] = Object.values(usuarios)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(u => {
            u.asistencias.sort((a, b) => b.diaString.localeCompare(a.diaString));
            return u;
        });
    });

    return final;
  }, [registrosDiariosBase]);

  const oficinasOrdenadas = useMemo(() => {
    return Object.keys(registrosAgrupadosPorOficinaYFecha).sort((a, b) => {
      const pathA = registrosAgrupadosPorOficinaYFecha[a][0]?.oficina_path_orden || '';
      const pathB = registrosAgrupadosPorOficinaYFecha[b][0]?.oficina_path_orden || '';
      return pathA.localeCompare(pathB, undefined, { numeric: true });
    });
  }, [registrosAgrupadosPorOficinaYFecha]);

  const handleAbrirModalMapa = (registro: RegistrosAgrupados, nombre?: string) => {
    setRegistrosSeleccionadosParaMapa({
      entrada: registro.entrada,
      salida: registro.salida,
      multiple: registro.multiple.length > 0 ? registro.multiple : undefined
    });
    setNombreUsuarioModal(nombre || registro.nombre);
    setModalMapaAbierto(true); // <-- ESTA LÍNEA FALTABA
  };

  const handleNivel2Change = (value: string) => {
    const newId = value === 'todos' ? null : value;
    setNivel2Id(newId);
    setNivel3Id(null);
  };

  const handleNivel3Change = (value: string) => {
    const newId = value === 'todos' ? null : value;
    setNivel3Id(newId);
  };

  const checkNextWeekDisabled = (startDate: Date) => {
    const nextWeekStart = addWeeks(startDate, 1);
    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    setIsNextWeekFuture(nextWeekStart > startOfThisWeek);
  };

  const updateWeekLabel = (startDate: Date) => {
    setWeekLabel(getWeekLabel(startDate));
    checkNextWeekDisabled(startDate);
  };

  const aplicarFiltros = (
      startDate: string | null = fechaInicialRango,
      endDate: string | null = fechaFinalRango
  ) => {
    setOficinaId(nivel3Id || nivel2Id || null);

    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      const fechaInicioLocal = new Date(y, m - 1, d, 0, 0, 0);
      setFechaInicio(fechaInicioLocal.toISOString());
    } else {
      setFechaInicio(null);
    }

    if (endDate) {
      const [y, m, d] = endDate.split('-').map(Number);
      const fechaFinLocal = endOfDay(new Date(y, m - 1, d));
      setFechaFinal(fechaFinLocal.toISOString());
    } else {
      setFechaFinal(null);
    }

    setOficinasAbiertas({});
    setTodosAbiertos(false);
  };
  
  const jumpToCurrentWeek = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    
    const startString = format(start, 'yyyy-MM-dd');
    const endString = format(end, 'yyyy-MM-dd');
    
    setFechaInicialRango(startString);
    setFechaFinalRango(endString);
    setWeekLabel(getWeekLabel(start));
    aplicarFiltros(startString, endString);
    checkNextWeekDisabled(start);
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    let currentStart = parseISO(fechaInicialRango);

    if (isNaN(currentStart.getTime())) {
        jumpToCurrentWeek();
        return;
    }

    if (direction === 'next') {
        const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
        const nextWeekStartCheck = addWeeks(currentStart, 1);
        if (nextWeekStartCheck > startOfThisWeek) {
            return;
        }
    }
    
    const newStart = addWeeks(currentStart, direction === 'prev' ? -1 : 1);
    const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
    
    const newStartDateString = format(newStart, 'yyyy-MM-dd');
    const newEndDateString = format(newEnd, 'yyyy-MM-dd');

    setFechaInicialRango(newStartDateString);
    setFechaFinalRango(newEndDateString);
    updateWeekLabel(newStart);
    aplicarFiltros(newStartDateString, newEndDateString);
  };

  const handleAplicarFechaManual = () => {
    const today = new Date();
    let start = parseISO(fechaInicialRango);
    if (start > today) {
        start = startOfWeek(today, { weekStartsOn: 1 });
        setFechaInicialRango(format(start, 'yyyy-MM-dd'));
    }
    
    updateWeekLabel(start);
    aplicarFiltros(format(start, 'yyyy-MM-dd'), fechaFinalRango);
  };
  
  const handleMostrarOficina = () => {
    aplicarFiltros();
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
  };

  const toggleOficina = (nombreOficina: string) => {
    setOficinasAbiertas(prev => ({
      ...prev,
      [nombreOficina]: !prev[nombreOficina]
    }));
  };

  const toggleTodos = () => {
    const nuevoEstado = !todosAbiertos;
    setTodosAbiertos(nuevoEstado);
    const nuevasOficinasAbiertas: Record<string, boolean> = {};
    oficinasOrdenadas.forEach(oficina => {
      nuevasOficinasAbiertas[oficina] = nuevoEstado;
    });
    setOficinasAbiertas(nuevasOficinasAbiertas);
  };

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4">
        <div className="p-2 bg-white rounded-lg shadow-md w-full">
          <div className="bg-gray-100 rounded-md p-3 space-y-3 pb-3">
            
            <div className="flex w-full flex-col sm:flex-row gap-3">
              <div className="w-full sm:flex-1">
                <Select onValueChange={handleNivel2Change} value={nivel2Id || 'todos'}>
                  <SelectTrigger className="bg-white text-xs rounded-sm">
                    <SelectValue placeholder="Seleccionar Dependencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las dependencias/políticas</SelectItem>
                    {oficinasNivel2.map(oficina => (
                      <SelectItem key={oficina.id} value={oficina.id}>{oficina.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:flex-1">
                <Select onValueChange={handleNivel3Change} value={nivel3Id || 'todos'} disabled={!nivel2Id}>
                  <SelectTrigger className="bg-white text-xs rounded-sm">
                    <SelectValue placeholder="Seleccionar Oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las oficinas</SelectItem>
                    {oficinasNivel3.map(oficina => (
                      <SelectItem key={oficina.id} value={oficina.id}>{oficina.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-auto">
                <Button 
                  onClick={handleMostrarOficina} 
                  className="w-full text-xs rounded-sm bg-purple-500 hover:bg-purple-600 text-white"
                >
                    Mostrar Oficina
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full gap-2">
                <div className="flex w-full sm:flex-1">
                    <Button onClick={() => handleWeekChange('prev')} variant="outline" className="rounded-r-none px-3 bg-white">
                        <ChevronLeft size={16} />
                    </Button>
                    <Button onClick={jumpToCurrentWeek} variant="outline" className="rounded-none flex-1 text-xs px-2 bg-white">
                        {weekLabel}
                    </Button>
                    <Button onClick={() => handleWeekChange('next')} variant="outline" className="rounded-l-none px-3 bg-white" disabled={isNextWeekFuture}>
                        <ChevronRight size={16} />
                    </Button>
                </div>

                <Input
                    type="date"
                    value={fechaInicialRango}
                    onChange={(e) => setFechaInicialRango(e.target.value)}
                    className="w-full sm:flex-1 sm:min-w-[120px] text-xs rounded-sm"
                    aria-label="Fecha inicial del rango"
                />
                <Input
                    type="date"
                    value={fechaFinalRango}
                    onChange={(e) => setFechaFinalRango(e.target.value)}
                    className="w-full sm:flex-1 sm:min-w-[120px] text-xs rounded-sm"
                    aria-label="Fecha final del rango"
                />
                
                <Button onClick={handleAplicarFechaManual} className="w-full sm:flex-1 text-xs rounded-sm">
                    Aplicar Fecha
                </Button>

                <Button 
                    onClick={handleBorrarFiltro} 
                    className="w-full sm:flex-1 text-xs rounded-sm bg-green-500 hover:bg-green-600 text-white" 
                >
                    Mostrar Todos
                </Button>
            </div>

            <div className="border-t border-gray-200 pt-3 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex rounded-md border p-1 bg-gray-200 w-full md:w-auto">
                  <Button 
                      size="sm" 
                      onClick={() => setVistaAgrupada('nombre')}
                      className={`flex-1 rounded-md text-xs gap-2 ${vistaAgrupada === 'nombre' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                  >
                      <User size={14} /> Agrupar por Nombre
                  </Button>
                  <Button 
                      size="sm" 
                      onClick={() => setVistaAgrupada('fecha')}
                      className={`flex-1 rounded-md text-xs gap-2 ${vistaAgrupada === 'fecha' ? 'bg-white text-blue-600 shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}
                  >
                      <Calendar size={14} /> Agrupar por Fecha
                  </Button>
              </div>

              <div className="relative w-full md:flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 bg-white text-xs w-full rounded-sm"
                      placeholder="Buscar por nombre o dependencia..."
                  />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            {loading || loadingDependencias ? (
              <Cargando texto="Cargando asistencias..." />
            ) : oficinasOrdenadas.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">No hay registros disponibles para el rango seleccionado.</p>
            ) : (
              <div className="w-full">
                <div className="flex flex-col md:flex-row md:justify-center mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTodos}
                    className="w-full md:w-auto text-xs flex items-center justify-center gap-2 h-9 px-4 rounded-sm"
                  >
                    {todosAbiertos ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
                    {todosAbiertos ? 'Cerrar todas las oficinas' : 'Abrir todas las oficinas'}
                  </Button>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600">
                          {vistaAgrupada === 'fecha' ? 'Usuario' : 'Fecha'}
                        </th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Entrada</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vistaAgrupada === 'fecha' ? (
                        oficinasOrdenadas.map((nombreOficina) => {
                          const registrosDeOficina = registrosAgrupadosPorOficinaYFecha[nombreOficina];
                          const estaAbierta = oficinasAbiertas[nombreOficina] || false;
                          let diaActual = "";

                          return (
                            <Fragment key={nombreOficina}>
                              <tr className="border-b border-slate-100">
                                <td colSpan={3} className="p-1">
                                  <div
                                    onClick={() => toggleOficina(nombreOficina)}
                                    className="bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 flex items-center justify-between rounded-sm"
                                  >
                                    <span>{nombreOficina} ({registrosDeOficina.length})</span>
                                    <motion.div
                                      initial={false}
                                      animate={{ rotate: estaAbierta ? 180 : 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <ChevronDown className="h-4 w-4 text-gray-600" />
                                    </motion.div>
                                  </div>
                                </td>
                              </tr>

                              <AnimatePresence initial={false}>
                                {estaAbierta && (
                                  <motion.tr
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <td colSpan={3} className="p-0">
                                      <table className="w-full">
                                        <tbody>
                                          {registrosDeOficina.map((usuario) => {
                                            const mostrarEncabezadoDia = usuario.diaString !== diaActual;
                                            if (mostrarEncabezadoDia) {
                                              diaActual = usuario.diaString;
                                            }

                                            const esMultiple = usuario.multiple.length > 0;

                                            return (
                                              <Fragment key={usuario.userId + usuario.diaString}>
                                                {mostrarEncabezadoDia && (
                                                  <tr>
                                                    <td colSpan={3} className="bg-slate-50 py-1.5 px-4 font-medium text-slate-500 text-[11px] border-y border-slate-100">
                                                      {format(parseISO(usuario.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                    </td>
                                                  </tr>
                                                )}
                                                <tr
                                                  className="border-b border-slate-100 transition-colors hover:bg-blue-50 group cursor-pointer"
                                                  onClick={() => handleAbrirModalMapa(usuario)}
                                                >
                                                  <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 w-[40%]">
                                                    {usuario.nombre}
                                                  </td>

                                                  {esMultiple ? (
                                                    <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                      <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-sm font-medium text-[10px]">
                                                        <List size={12} /> Ver Asistencia ({usuario.multiple.length})
                                                      </div>
                                                    </td>
                                                  ) : (
                                                    <>
                                                      <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                        {usuario.entrada ? format(parseISO(usuario.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                      </td>
                                                      <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                        {usuario.salida ? format(parseISO(usuario.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                      </td>
                                                    </>
                                                  )}
                                                </tr>
                                              </Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </td>
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            </Fragment>
                          );
                        })
                      ) : (
                        oficinasOrdenadas.map((nombreOficina) => {
                          const usuariosDeOficina = registrosAgrupadosPorOficinaYUsuario[nombreOficina];
                          const estaAbierta = oficinasAbiertas[nombreOficina] || false;
                          
                          return (
                            <Fragment key={nombreOficina}>
                              <tr className="border-b border-slate-100">
                                <td colSpan={3} className="p-1">
                                  <div
                                    onClick={() => toggleOficina(nombreOficina)}
                                    className="bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 flex items-center justify-between rounded-sm"
                                  >
                                    <span>{nombreOficina} ({usuariosDeOficina.length})</span>
                                    <motion.div
                                      initial={false}
                                      animate={{ rotate: estaAbierta ? 180 : 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <ChevronDown className="h-4 w-4 text-gray-600" />
                                    </motion.div>
                                  </div>
                                </td>
                              </tr>
                              <AnimatePresence initial={false}>
                                {estaAbierta && (
                                  <motion.tr
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <td colSpan={3} className="p-0">
                                      <table className="w-full">
                                        <tbody>
                                          {usuariosDeOficina.map((usuario) => (
                                            <Fragment key={usuario.nombre}>
                                              <tr>
                                                <td colSpan={3} className="bg-slate-50 py-1.5 px-4 font-medium text-slate-500 text-[11px] border-y border-slate-100">
                                                  {usuario.nombre}
                                                </td>
                                              </tr>
                                              {usuario.asistencias.map((asistencia) => {
                                                const esMultiple = asistencia.multiple.length > 0;
                                                return (
                                                  <tr
                                                    key={asistencia.diaString}
                                                    className="border-b border-slate-100 transition-colors hover:bg-blue-50 group cursor-pointer"
                                                    onClick={() => handleAbrirModalMapa(asistencia, usuario.nombre)}
                                                  >
                                                    <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 w-[40%] pl-8">
                                                      {format(parseISO(asistencia.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                    </td>
                                                    {esMultiple ? (
                                                      <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                        <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-sm font-medium text-[10px]">
                                                          <List size={12} /> Ver Asistencia ({asistencia.multiple.length})
                                                        </div>
                                                      </td>
                                                    ) : (
                                                      <>
                                                        <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                          {asistencia.entrada ? format(parseISO(asistencia.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                        </td>
                                                        <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                          {asistencia.salida ? format(parseISO(asistencia.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                        </td>
                                                      </>
                                                    )}
                                                  </tr>
                                                );
                                              })}
                                            </Fragment>
                                          ))}
                                        </tbody>
                                      </table>
                                    </td>
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            </Fragment>
                          );
                        })
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