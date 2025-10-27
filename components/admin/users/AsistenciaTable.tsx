import React, { useState, Fragment, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import Mapa from '@/components/ui/modals/Mapa';
import { format, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import Cargando from '@/components/ui/animations/Cargando';
import { AsistenciaEnriquecida } from '@/hooks/asistencia/useObtenerAsistencias';

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
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null }>({ entrada: null, salida: null });
  
  const [fechaInicialRango, setFechaInicialRango] = useState('');
  const [fechaFinalRango, setFechaFinalRango] = useState('');
  
  const [nivel2Id, setNivel2Id] = useState<string | null>(null);
  const [nivel3Id, setNivel3Id] = useState<string | null>(null);

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

  const registrosAgrupadosPorOficina = useMemo(() => {
    const agrupadosPorOficina: Record<string, RegistrosAgrupados[]> = {};
    const registrosTemp: Record<string, Record<string, RegistrosAgrupados>> = {};

    registros.forEach(registro => {
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
          nombre: registro.nombre || 'N/A',
          puesto_nombre: registro.puesto_nombre || 'N/A',
          oficina_nombre: oficinaNombre,
          oficina_path_orden: oficinaPath,
          userId: userId,
          diaString: diaString,
        };
      }

      if (registro.tipo_registro === 'Entrada') {
        registrosTemp[oficinaNombre][claveUnica].entrada = registro;
      } else if (registro.tipo_registro === 'Salida') {
        registrosTemp[oficinaNombre][claveUnica].salida = registro;
      }
    });

    Object.keys(registrosTemp).forEach(oficina => {
      agrupadosPorOficina[oficina] = Object.values(registrosTemp[oficina])
        .sort((a, b) => new Date(b.diaString).getTime() - new Date(a.diaString).getTime() || a.nombre.localeCompare(b.nombre));
    });

    return agrupadosPorOficina;
  }, [registros]);

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
      salida: registro.salida
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
    setFechaInicio(fechaInicialRango || null);
    
    if (fechaFinalRango) {
      try {
        const fechaFin = endOfDay(new Date(fechaFinalRango));
        setFechaFinal(fechaFin.toISOString());
      } catch (e) {
        setFechaFinal(null);
      }
    } else {
      setFechaFinal(null);
    }
  };

  return (
    <>
    <div className="w-full xl:w-4/5 mx-auto md:px-4">
        <div className="p-2 bg-white rounded-lg shadow-md space-y-4 w-full">
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 p-2 bg-slate-50 rounded-lg">
            <div className='w-full md:w-1/3 flex flex-col gap-2'>
              <Select onValueChange={handleNivel2Change} value={nivel2Id || 'todos'}>
                <SelectTrigger className="bg-white text-xs">
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
                <SelectTrigger className="bg-white text-xs">
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
                  className="w-full text-xs" 
                  placeholder="Fecha Inicio"
                  aria-label="Fecha inicial del rango"
              />
              <span className="text-xs text-gray-500">hasta</span>
              <Input 
                  type="date" 
                  value={fechaFinalRango} 
                  onChange={(e) => setFechaFinalRango(e.target.value)} 
                  className="w-full text-xs" 
                  placeholder="Fecha Fin"
                  aria-label="Fecha final del rango"
              />
            </div>
            <Button onClick={handleFiltrar} className="w-full md:w-auto text-xs">Aplicar Filtro</Button>
          </div>
          
          <div className="border-t pt-4 mt-4">
            {loading || loadingDependencias ? (
              <Cargando texto="Cargando asistencias..." />
            ) : oficinasOrdenadas.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">No hay registros disponibles para el rango seleccionado.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed text-xs">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="py-2 text-[10px] xl:text-xs w-[20%] xl:w-[30%]">Usuario</th>
                      <th className="py-2 text-[10px] xl:text-xs w-[50%] xl:w-[30%]">Puesto</th>
                      <th className="py-2 text-[10px] xl:text-xs w-[15%] xl:w-[20%]">Entrada</th>
                      <th className="py-2 text-[10px] xl:text-xs w-[15%] xl:w-[20%]">Salida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oficinasOrdenadas.map((nombreOficina) => {
                      const registrosDeOficina = registrosAgrupadosPorOficina[nombreOficina];
                      let diaActual = "";

                      return (
                        <Fragment key={nombreOficina}>
                          <tr>
                            <td colSpan={5} className="bg-gray-200 text-center py-1 text-sm font-semibold text-blue-500">
                              {nombreOficina}
                            </td>
                          </tr>
                          {registrosDeOficina.map((usuario) => {
                            const mostrarEncabezadoDia = usuario.diaString !== diaActual;
                            if (mostrarEncabezadoDia) {
                                diaActual = usuario.diaString;
                            }
                            
                            return (
                              <Fragment key={usuario.userId + usuario.diaString}>
                                {mostrarEncabezadoDia && (
                                  <tr>
                                    <td colSpan={5} className="text-center bg-slate-100 py-2 font-bold text-slate-700 border-t border-b border-slate-200">{format(parseISO(usuario.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}</td>
                                  </tr>
                                )}
                                <tr 
                                  className="border-b transition-colors hover:bg-gray-100 group cursor-pointer"
                                  onClick={() => handleAbrirModalMapa(usuario)}
                                >
                                  <td className="py-2 text-[10px] xl:text-xs text-gray-800">
                                    {usuario.nombre}
                                  </td>
                                  <td className="py-2 text-[10px] xl:text-xs text-gray-600">{usuario.puesto_nombre}</td>

                                  <td className="py-2 text-[10px] xl:text-xs font-mono text-center">
                                    {usuario.entrada ? format(parseISO(usuario.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400">----</span>}
                                  </td>

                                  <td className="py-2 text-[10px] xl:text-xs font-mono text-center">
                                    {usuario.salida ? format(parseISO(usuario.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400">----</span>}
                                  </td>
                                </tr>
                              </Fragment>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
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
            nombreUsuario={registrosSeleccionadosParaMapa.entrada?.nombre || registrosSeleccionadosParaMapa.salida?.nombre || 'Usuario'}
          />
        )}
      </AnimatePresence>
    </>
  );
}