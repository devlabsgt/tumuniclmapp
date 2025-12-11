'use client';

import React, { useState, Fragment, useMemo } from 'react';
import { es } from 'date-fns/locale';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday, 
  addDays, 
  subDays, 
  getYear, 
  getMonth, 
  isSameDay, 
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  isBefore, 
  isAfter,
  parseISO,
  startOfToday,
  isValid
} from 'date-fns';
import { ChevronsLeft, ChevronsRight, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CalendarioProps {
  todosLosRegistros: any[];
  onAbrirMapa: (registro: any) => void;
  fechaHoraGt: Date;
  esHorarioMultiple?: boolean;
}

const getWeekDays = (date: Date) => eachDayOfInterval({
  start: startOfWeek(date, { locale: es, weekStartsOn: 1 }),
  end: endOfWeek(date, { locale: es, weekStartsOn: 1 }),
});

type AsistenciaRegistro = {
  entrada: any | null,
  salida: any | null,
  representante: any | null,
  cantidad: number,
  tieneMultiple: boolean,
  nombre: string,
  puesto_nombre: string
};

const sortUsuarios = (usuarios: AsistenciaRegistro[]) => {
  return usuarios.sort((a, b) => {
    const regA = a.entrada || a.salida || a.representante;
    const regB = b.entrada || b.salida || b.representante;
    const pathA = regA?.oficina_path_orden || '';
    const pathB = regB?.oficina_path_orden || '';

    if (pathA && pathB) {
      return pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' });
    }
    return (a.nombre || '').localeCompare(b.nombre || '');
  });
};

export default function Calendario({ todosLosRegistros = [], onAbrirMapa, fechaHoraGt, esHorarioMultiple = false }: CalendarioProps) {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>(undefined);
  const [filtroTipo, setFiltroTipo] = useState<'semanal' | 'rango'>('semanal');
  const [fechaInicialRango, setFechaInicialRango] = useState('');
  const [fechaFinalRango, setFechaFinalRango] = useState('');

  const diasDeLaSemana = useMemo(() => getWeekDays(fechaDeReferencia), [fechaDeReferencia]);

  // 1. Agrupar registros por Día y Usuario
  const registrosAgrupados = useMemo(() => {
    const agrupados: Record<string, Record<string, AsistenciaRegistro>> = {};

    todosLosRegistros.forEach(registro => {
      const diaString = format(new Date(registro.created_at), 'yyyy-MM-dd');
      const userId = registro.user_id;

      if (!agrupados[diaString]) {
        agrupados[diaString] = {};
      }
      if (!agrupados[diaString][userId]) {
        agrupados[diaString][userId] = {
          entrada: null,
          salida: null,
          representante: null,
          cantidad: 0,
          tieneMultiple: false,
          nombre: registro.nombre,
          puesto_nombre: registro.puesto_nombre
        };
      }

      const grupo = agrupados[diaString][userId];
      grupo.cantidad++;
      if (!grupo.representante) grupo.representante = registro;

      if (registro.tipo_registro === 'Multiple' || registro.tipo_registro === 'Marca') {
          grupo.tieneMultiple = true;
      }

      if (registro.tipo_registro === 'Entrada') {
        if (!grupo.entrada || new Date(registro.created_at) < new Date(grupo.entrada.created_at)) {
          grupo.entrada = registro;
        }
      } else if (registro.tipo_registro === 'Salida') {
        if (!grupo.salida || new Date(registro.created_at) > new Date(grupo.salida.created_at)) {
          grupo.salida = registro;
        }
      }
    });

    return agrupados;
  }, [todosLosRegistros]);

  // 2. Calcular los días a mostrar (Rango Completo)
  const diasParaTabla = useMemo(() => {
    let start: Date;
    let end: Date;

    if (filtroTipo === 'semanal') {
      if (diaSeleccionado) {
        start = startOfDay(diaSeleccionado);
        end = endOfDay(diaSeleccionado);
      } else {
        start = startOfDay(diasDeLaSemana[0]);
        end = endOfDay(diasDeLaSemana[6]);
      }
    } else {
      if (!fechaInicialRango || !fechaFinalRango) return [];
      start = startOfDay(new Date(fechaInicialRango + 'T00:00:00'));
      end = endOfDay(new Date(fechaFinalRango + 'T00:00:00'));
    }

    if (!isValid(start) || !isValid(end) || isAfter(start, end)) return [];

    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [filtroTipo, diasDeLaSemana, diaSeleccionado, fechaInicialRango, fechaFinalRango]);

  const irSemanaSiguiente = () => setFechaDeReferencia(addDays(fechaDeReferencia, 7));
  const irSemanaAnterior = () => setFechaDeReferencia(subDays(fechaDeReferencia, 7));

  const handleSeleccionFecha = (anio: number, mes: number) => {
    const nuevaFecha = new Date(anio, mes, 1);
    setFechaDeReferencia(startOfWeek(nuevaFecha, { locale: es, weekStartsOn: 1 }));
    setDiaSeleccionado(undefined);
  };

  const handleSeleccionDia = (dia: Date) => {
    const yaEstaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
    setDiaSeleccionado(yaEstaSeleccionado ? undefined : dia);
  };

  const handleFiltroTipoClick = (tipo: 'semanal' | 'rango') => {
    setFiltroTipo(tipo);
    setDiaSeleccionado(undefined);
  };

  const uniqueUserIds = useMemo(() => {
    const ids = new Set();
    todosLosRegistros.forEach(r => ids.add(r.user_id));
    return ids.size;
  }, [todosLosRegistros]);

  const esVistaIndividual = uniqueUserIds <= 1;
  const colSpanCount = esVistaIndividual ? 2 : 4;

  return (
    <div className="p-1 bg-white dark:bg-neutral-950 rounded-lg shadow-md space-y-4 w-full transition-colors duration-200">

      <div className="flex items-center bg-gray-100 dark:bg-neutral-900 rounded-lg p-0 transition-colors">
        <div className="flex w-[40%] h-full rounded-l-lg overflow-hidden flex-shrink-0">
          <Button 
            variant={filtroTipo === 'semanal' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => handleFiltroTipoClick('semanal')} 
            className={`h-7 flex-1 px-1 text-[11px] rounded-r-none ${filtroTipo === 'semanal' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-900 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
          >
            Semanal
          </Button>
          <Button 
            variant={filtroTipo === 'rango' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => handleFiltroTipoClick('rango')} 
            className={`h-7 flex-1 px-1 text-[11px] rounded-l-none ${filtroTipo === 'rango' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-900 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
          >
            Rango
          </Button>
        </div>
        <div className="w-px h-6 bg-gray-300 dark:bg-neutral-700 mx-1"></div>
        <div className="flex w-[70%] items-center justify-end p-1">
          {filtroTipo === 'semanal' ? (
            <div className="flex justify-between items-center w-full xl:justify-center xl:gap-4">
              <button onClick={irSemanaAnterior} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800"><ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400 xl:h-6 xl:w-6" /></button>
              <div className='flex gap-1 text-xs xl:text-base xl:gap-2 w-full justify-between xl:w-auto'>
                <select 
                  value={getMonth(fechaDeReferencia)} 
                  onChange={(e) => handleSeleccionFecha(getYear(fechaDeReferencia), parseInt(e.target.value))} 
                  className="p-1 border border-gray-300 dark:border-neutral-700 rounded-md text-xs bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 h-7 focus:ring-0 appearance-none w-1/2 xl:text-lg xl:h-10 xl:w-32 xl:p-2 text-center"
                >
                  {Array.from({ length: 12 }).map((_, i) => (<option key={i} value={i} className="capitalize">{format(new Date(2000, i, 1), 'LLLL', { locale: es })}</option>))}
                </select>
                <select 
                  value={getYear(fechaDeReferencia)} 
                  onChange={(e) => handleSeleccionFecha(parseInt(e.target.value), getMonth(fechaDeReferencia))} 
                  className="p-1 border border-gray-300 dark:border-neutral-700 rounded-md text-xs bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 h-7 focus:ring-0 appearance-none w-1/2 xl:text-lg xl:h-10 xl:w-28 xl:p-2 text-center"
                >
                  {Array.from({ length: 10 }).map((_, i) => { const anio = getYear(new Date()) - 5 + i; return <option key={anio} value={anio}>{anio}</option>; })}
                </select>
              </div>
              <button onClick={irSemanaSiguiente} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800"><ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400 xl:h-6 xl:w-6" /></button>
            </div>
          ) : (
            <div className="flex text-xs lg:text-lg items-center gap-1 w-full xl:justify-center xl:gap-4">
              <Input 
                type="date" 
                value={fechaInicialRango} 
                onChange={(e) => setFechaInicialRango(e.target.value)} 
                className="w-1/2 text-[10px] h-7 px-1 py-0 border border-gray-300 dark:border-neutral-700 focus-visible:ring-0 bg-gray-100 dark:bg-neutral-800 dark:text-gray-100 xl:text-lg xl:h-10 xl:px-3" 
                placeholder="Fecha Inicial" 
              />
              <span className="text-gray-500 dark:text-gray-400 text-[10px] flex-shrink-0 xl:text-base">a</span>
              <Input 
                type="date" 
                value={fechaFinalRango} 
                onChange={(e) => setFechaFinalRango(e.target.value)} 
                className="w-1/2 text-[10px] h-7 px-1 py-0 border border-gray-300 dark:border-neutral-700 focus-visible:ring-0 bg-gray-100 dark:bg-neutral-800 dark:text-gray-100 xl:text-lg xl:h-10 xl:px-3" 
                placeholder="Fecha Final" 
              />
            </div>
          )}
        </div>
      </div>

      {filtroTipo === 'semanal' && (
        <div className="flex justify-around items-center pt-2">
          {diasDeLaSemana.map((dia) => {
            const esDiaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
            return (
              <div 
                key={dia.toString()} 
                onClick={() => handleSeleccionDia(dia)} 
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-md transition-all cursor-pointer 
                  ${isToday(dia) && !esDiaSeleccionado ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''} 
                  ${isSameDay(dia, new Date(fechaHoraGt)) ? 'border border-blue-400 dark:border-blue-500' : ''} 
                  ${esDiaSeleccionado ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold shadow-lg scale-105' : 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-400'}`}
              >
                <span className="text-[10px] uppercase">{format(dia, 'eee', { locale: es })}</span>
                <span className="text-xs">{format(dia, 'd')}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Tabla de Asistencia --- */}
      <div className="border-t dark:border-neutral-800 pt-1 transition-colors">
        <p className="text-xs text-blue-600 dark:text-blue-400 text-center my-1">Haz click un registro para ver más información 🔍</p>
        
        {diasParaTabla.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-xs">Seleccione un rango de fechas válido.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-neutral-900 text-left text-gray-700 dark:text-gray-300">
              <tr>
                {!esVistaIndividual && <th className="px-4 py-2 text-xs w-1/4">Empleado</th>}
                {!esVistaIndividual && <th className="px-4 py-2 text-xs w-1/4">Puesto</th>}

                {esHorarioMultiple ? (
                  <th className="px-4 py-2 text-xs w-2/4 text-center" colSpan={2}>Marcajes</th>
                ) : (
                  <>
                    <th className="px-4 py-2 text-xs w-1/4">Entrada</th>
                    <th className="px-4 py-2 text-xs w-1/4">Salida</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {diasParaTabla.map((diaString) => {
                const datosDelDia = registrosAgrupados[diaString];
                const usuariosDelDia = datosDelDia ? sortUsuarios(Object.values(datosDelDia)) : [];
                
                // Detectar si el día es FUTURO (Mañana en adelante)
                const fechaDia = parseISO(diaString + 'T00:00:00');
                const esFuturo = isAfter(fechaDia, startOfToday());

                // Si es futuro y no hay datos, NO RENDERIZAR NADA
                if (esFuturo && usuariosDelDia.length === 0) {
                  return null;
                }

                return (
                  <Fragment key={diaString}>
                    <tr>
                      <td colSpan={colSpanCount} className="bg-slate-100 dark:bg-neutral-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 border-t border-b border-slate-200 dark:border-neutral-700 transition-colors">
                        {format(fechaDia, 'eeee, d \'de\' LLLL', { locale: es })}
                      </td>
                    </tr>

                    {usuariosDelDia.length > 0 ? (
                      usuariosDelDia.map((usuario, index) => {
                        const sinRegistros = !usuario.entrada && !usuario.salida && !usuario.tieneMultiple;
                        
                        return (
                          <tr 
                            key={index} 
                            onClick={() => !sinRegistros && onAbrirMapa(usuario.entrada || usuario.salida || usuario.representante)} 
                            className={`border-b dark:border-neutral-800 transition-colors ${sinRegistros ? '' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-900/50'}`}
                          >
                            {!esVistaIndividual && (<td className="px-4 py-2 text-xs text-gray-800 dark:text-gray-200 font-bold">{usuario.nombre}</td>)}
                            {!esVistaIndividual && (<td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{usuario.puesto_nombre}</td>)}

                            {sinRegistros ? (
                                <td colSpan={2} className="px-4 py-2 text-center text-red-500 dark:text-red-400 font-medium text-xs">
                                    Sin registros de asistencia
                                </td>
                            ) : (esHorarioMultiple || usuario.tieneMultiple) ? (
                              <td colSpan={2} className="px-4 py-2">
                                <div className="w-full p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold flex justify-center items-center gap-2 transition-colors">
                                  <List size={14} /> Ver Asistencia ({usuario.cantidad})
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="px-4 py-2 text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                                  {usuario.entrada ? format(new Date(usuario.entrada.created_at), 'hh:mm aa', { locale: es }) : <span className="text-red-500 dark:text-red-400">--:--</span>}
                                </td>
                                <td className="px-4 py-2 text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                                  {usuario.salida ? format(new Date(usuario.salida.created_at), 'hh:mm aa', { locale: es }) : <span className="text-red-500 dark:text-red-400">--:--</span>}
                                </td>
                              </>
                            )}

                          </tr>
                        );
                      })
                    ) : (
                    
                      <tr>
                        <td colSpan={colSpanCount} className="px-4 py-2 text-center text-red-500 dark:text-red-400 text-xs font-medium bg-red-50/50 dark:bg-red-900/10">
                          Sin registros de asistencia
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}