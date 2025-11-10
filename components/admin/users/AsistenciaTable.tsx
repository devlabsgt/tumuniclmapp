'use client';

import React, { useState, Fragment, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import Mapa from '@/components/ui/modals/Mapa';
import { format, endOfDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { AsistenciaEnriquecida } from '@/hooks/asistencia/useObtenerAsistencias';
import { List, Search, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';

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

export default function AsistenciaTable({ registros, rolActual, loading, setOficinaId, setFechaInicio, setFechaFinal }: Props) {
  const { dependencias, loading: loadingDependencias } = useDependencias();

  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] }>({ entrada: null, salida: null });

  const [fechaInicialRango, setFechaInicialRango] = useState('');
  const [fechaFinalRango, setFechaFinalRango] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [nivel2Id, setNivel2Id] = useState<string | null>(null);
  const [nivel3Id, setNivel3Id] = useState<string | null>(null);

  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  const [todosAbiertos, setTodosAbiertos] = useState(false);

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

  const registrosAgrupadosPorOficina = useMemo(() => {
    const agrupadosPorOficina: Record<string, RegistrosAgrupados[]> = {};
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

    Object.keys(registrosTemp).forEach(oficina => {
      agrupadosPorOficina[oficina] = Object.values(registrosTemp[oficina])
        .sort((a, b) => b.diaString.localeCompare(a.diaString) || a.nombre.localeCompare(b.nombre));
    });

    return agrupadosPorOficina;
  }, [registrosFiltrados]);

  const oficinasOrdenadas = useMemo(() => {
    return Object.keys(registrosAgrupadosPorOficina).sort((a, b) => {
      const pathA = registrosAgrupadosPorOficina[a][0]?.oficina_path_orden || '';
      const pathB = registrosAgrupadosPorOficina[b][0]?.oficina_path_orden || '';
      return pathA.localeCompare(pathB, undefined, { numeric: true });
    });
  }, [registrosAgrupadosPorOficina]);

  const handleAbrirModalMapa = (registro: RegistrosAgrupados) => {
    setRegistrosSeleccionadosParaMapa({
      entrada: registro.entrada,
      salida: registro.salida,
      multiple: registro.multiple.length > 0 ? registro.multiple : undefined
    });
    setModalMapaAbierto(true);
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

  const handleFiltrar = () => {
    setOficinaId(nivel3Id || nivel2Id || null);

    if (fechaInicialRango) {
      const [y, m, d] = fechaInicialRango.split('-').map(Number);
      const fechaInicioLocal = new Date(y, m - 1, d, 0, 0, 0);
      setFechaInicio(fechaInicioLocal.toISOString());
    } else {
      setFechaInicio(null);
    }

    if (fechaFinalRango) {
      const [y, m, d] = fechaFinalRango.split('-').map(Number);
      const fechaFinLocal = endOfDay(new Date(y, m - 1, d));
      setFechaFinal(fechaFinLocal.toISOString());
    } else {
      setFechaFinal(null);
    }

    setOficinasAbiertas({});
    setTodosAbiertos(false);
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
            <div className="flex flex-col md:flex-row justify-center items-center gap-3">
              <div className='w-full md:w-1/3 flex flex-col gap-2'>
                <Select onValueChange={handleNivel2Change} value={nivel2Id || 'todos'}>
                  <SelectTrigger className="bg-white text-xs rounded-sm">
                    <SelectValue placeholder="Seleccionar Oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las dependencias/políticas</SelectItem>
                    {oficinasNivel2.map(oficina => (
                      <SelectItem key={oficina.id} value={oficina.id}>{oficina.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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

              <div className='w-full md:w-2/3 flex items-center gap-2'>
                <Input
                  type="date"
                  value={fechaInicialRango}
                  onChange={(e) => setFechaInicialRango(e.target.value)}
                  className="w-full text-xs rounded-sm"
                  placeholder="Fecha Inicio"
                  aria-label="Fecha inicial del rango"
                />
                <span className="text-xs text-gray-500">hasta</span>
                <Input
                  type="date"
                  value={fechaFinalRango}
                  onChange={(e) => setFechaFinalRango(e.target.value)}
                  className="w-full text-xs rounded-sm"
                  placeholder="Fecha Fin"
                  aria-label="Fecha final del rango"
                />
              </div>
              <Button onClick={handleFiltrar} className="w-full md:w-auto text-xs rounded-sm">Aplicar Filtro</Button>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="relative w-full">
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
                        <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600">Usuario</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Entrada</th>
                        <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Salida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oficinasOrdenadas.map((nombreOficina) => {
                        const registrosDeOficina = registrosAgrupadosPorOficina[nombreOficina];
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
                      })}
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
            nombreUsuario={(registrosSeleccionadosParaMapa.multiple && registrosSeleccionadosParaMapa.multiple.length > 0 ? registrosSeleccionadosParaMapa.multiple[0].nombre : (registrosSeleccionadosParaMapa.entrada?.nombre || registrosSeleccionadosParaMapa.salida?.nombre)) || 'Usuario'}
          />
        )}
      </AnimatePresence>
    </>
  );
}