'use client';

import React, { useState } from 'react';
import { setMonth, parseISO, differenceInCalendarDays, format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CalendarClock, CheckSquare, Square, CalendarCheck, ClipboardCheck, Trash2, ArrowUp } from 'lucide-react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import useUserData from '@/hooks/sesion/useUserData';

import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';

interface Props {
  vista: 'hoy' | 'proximas' | 'terminadas' | 'pendientes';
  setVista: (vista: 'hoy' | 'proximas' | 'terminadas' | 'pendientes') => void;
  terminoBusqueda: string;
  setTerminoBusqueda: (termino: string) => void;
  mesSeleccionado: number;
  setMesSeleccionado: (mes: number) => void;
  anioSeleccionado: number;
  setAnioSeleccionado: (anio: number) => void;
  comisionesFiltradas: ComisionConFechaYHoraSeparada[];
  comisionesAgrupadasPorFecha: { [key: string]: ComisionConFechaYHoraSeparada[] };
  onVerComision: (comision: ComisionConFechaYHoraSeparada) => void;
  onCrearComision: () => void;
  comisionesSeleccionadas: ComisionConFechaYHoraSeparada[];
  onSeleccionarComision: (comision: ComisionConFechaYHoraSeparada) => void;
  onSeleccionarTodas: () => void;
  onVerMultiplesComisiones: () => void;
  onAprobarComision: (comisionId: string) => void;
  onEliminarComisiones: () => void;
  countPendientes: number;
  countHoy: number;
  countProximas: number;
  countTerminadas: number;
}

const TIMEZONE_GUATE = 'America/Guatemala';

export default function ListaComisiones({
  vista,
  setVista,
  terminoBusqueda,
  setTerminoBusqueda,
  mesSeleccionado,
  setMesSeleccionado,
  anioSeleccionado,
  setAnioSeleccionado,
  comisionesFiltradas = [],
  comisionesAgrupadasPorFecha = {},
  onVerComision,
  onCrearComision,
  comisionesSeleccionadas = [],
  onSeleccionarComision,
  onSeleccionarTodas,
  onVerMultiplesComisiones,
  onAprobarComision,
  onEliminarComisiones,
  countPendientes = 0,
  countHoy = 0,
  countProximas = 0,
  countTerminadas = 0,
}: Props) {
  
  const { rol: rolActual, esjefe } = useUserData();
  
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  
  const hasAdminPermissions = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO' || esjefe;
  const canApprove = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO';

  const showDeleteButton = 
    (canApprove && (vista === 'hoy' || vista === 'proximas')) ||
    (rolActual === 'SUPER' && vista === 'terminadas');

  const fechasOrdenadas = Object.keys(comisionesAgrupadasPorFecha).sort((a, b) => {
    const grupoA = comisionesAgrupadasPorFecha[a];
    const grupoB = comisionesAgrupadasPorFecha[b];

    const itemA = grupoA && grupoA.length > 0 ? grupoA[0] : null;
    const itemB = grupoB && grupoB.length > 0 ? grupoB[0] : null;

    if (!itemA || !itemB) return 0;

    const fechaStrA = itemA.fecha_hora.includes('T') ? itemA.fecha_hora : itemA.fecha_hora.replace(' ', 'T');
    const fechaStrB = itemB.fecha_hora.includes('T') ? itemB.fecha_hora : itemB.fecha_hora.replace(' ', 'T');

    const dateA = parseISO(fechaStrA);
    const dateB = parseISO(fechaStrB);
    
    const timeA = isValid(dateA) ? dateA.getTime() : 0;
    const timeB = isValid(dateB) ? dateB.getTime() : 0;

    return ordenDescendente ? timeA - timeB: timeB - timeA ;
  });

  return (
    <>
      <div className="border-b dark:border-neutral-800 flex mb-4 flex-wrap justify-center transition-colors duration-200">
        
        <button
          onClick={() => setVista('hoy')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'hoy' ? 'border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <CalendarClock className="h-4 w-4" /> Para hoy ({countHoy})
        </button>

        {countProximas > 0 && (
          <button
            onClick={() => setVista('proximas')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'proximas' ? 'border-b-2 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <CalendarCheck className="h-4 w-4" /> Próximas ({countProximas})
          </button>
        )}
        
        {countTerminadas > 0 && (
          <button
            onClick={() => setVista('terminadas')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'terminadas' ? 'border-b-2 border-red-600 dark:border-red-400 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <CalendarCheck className="h-4 w-4" /> Terminadas ({countTerminadas})
          </button>
        )}

        {hasAdminPermissions && countPendientes > 0 && (
          <button
            onClick={() => setVista('pendientes')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'pendientes' ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <ClipboardCheck className="h-4 w-4" /> Pendientes de Aprobación ({countPendientes})
          </button>
        )}

      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input 
          placeholder="Buscar por título o integrante..." 
          value={terminoBusqueda} 
          onChange={(e) => setTerminoBusqueda(e.target.value)} 
          className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        <div className='flex gap-2 items-center'>
          <select 
            value={mesSeleccionado} 
            onChange={(e) => { setMesSeleccionado(Number(e.target.value)); }} 
            className="text-sm capitalize focus:ring-0 border-gray-300 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
          >
            {Array.from({ length: 12 }).map((_, index) => <option key={index} value={index}>{format(setMonth(new Date(), index), 'MMMM', { locale: es })}</option>)}
          </select>
          <select 
            value={anioSeleccionado} 
            onChange={(e) => { setAnioSeleccionado(Number(e.target.value)); }} 
            className="text-sm focus:ring-0 border-gray-300 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(anio => <option key={anio} value={anio}>{anio}</option>)}
          </select>
        </div>
        <div className='flex flex-row gap-2'>
          {hasAdminPermissions && (
            <Button onClick={onCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white border-0">
              Crear Comisión
            </Button>
          )}
        </div>
      </div>

      <div className="border-t dark:border-neutral-800 pt-4 mt-4 transition-colors">
        <div className="border-t dark:border-neutral-800 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {vista !== 'pendientes' && (
                <Button
                  onClick={onSeleccionarTodas}
                  variant="outline"
                  className="flex items-center gap-2 text-xs md:text-sm dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  {(comisionesSeleccionadas?.length || 0) === (comisionesFiltradas?.length || 0) ? <CheckSquare size={16} /> : <Square size={16} />}
                  <span>{(comisionesSeleccionadas?.length || 0) === (comisionesFiltradas?.length || 0) ? 'Deseleccionar todos' : 'Seleccionar todos'}</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOrdenDescendente(!ordenDescendente)}
                title={ordenDescendente ? "Orden: Más nuevas primero" : "Orden: Más antiguas primero"}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <span className="font-medium text-sm">Ordenar</span>
                <ArrowUp 
                  size={18} 
                  className={`transition-transform duration-300 ${ordenDescendente ? 'rotate-180' : 'rotate-0'}`} 
                />
              </Button>
            </div>
            
            <div className={`text-xs ml-5 font-semibold ${vista === 'pendientes' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
              <p>
                {vista === 'pendientes' ? 
                  (canApprove ? 'Seleccione una comisión para ver detalles' : 'Pendientes de aprobación por RRHH') 
                  : 'Seleccione una comisión para ver sus detalles'}
              </p>
            </div>
          </div>
        </div>

        {comisionesFiltradas && comisionesFiltradas.length > 0 ? (
          <div className="space-y-4">
            {fechasOrdenadas.map(fecha => {
              
              return (
              <div key={fecha}>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 capitalize sticky top-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm py-2 transition-colors z-10">{fecha}</h3>
                <div className="space-y-2">
                  {comisionesAgrupadasPorFecha[fecha].map(comision => {
                    const integrantesCount = comision.asistentes?.length || 0;
                    const isSelected = comisionesSeleccionadas?.some(c => c.id === comision.id);
                    
                    const rawDate = comision.fecha_hora.includes('T') ? comision.fecha_hora : comision.fecha_hora.replace(' ', 'T');
                    
                    const dateComision = parseISO(rawDate);
                    const nowInGuate = toZonedTime(new Date(), TIMEZONE_GUATE);

                    const strDateComision = format(dateComision, 'yyyy-MM-dd');
                    const strDateNow = format(nowInGuate, 'yyyy-MM-dd');
                    
                    const fechaComisionObj = parseISO(strDateComision);
                    const fechaNowObj = parseISO(strDateNow);

                    const diasRestantes = differenceInCalendarDays(fechaComisionObj, fechaNowObj);
                    
                    const fechaVisual = isValid(dateComision) 
                        ? format(dateComision, 'h:mm a', { locale: es })
                        : 'Hora inválida';

                    let textoDias = '';
                    let colorDias = 'text-gray-500 dark:text-gray-400';
                    
                    if (diasRestantes === 0) {
                      textoDias = 'Hoy';
                      colorDias = 'text-indigo-600 dark:text-indigo-400 font-semibold';
                    } else if (diasRestantes === 1) {
                      textoDias = 'Mañana';
                      colorDias = 'text-green-600 dark:text-green-400';
                    } else if (diasRestantes > 1) {
                      textoDias = `En ${diasRestantes} días`;
                      colorDias = 'text-green-600 dark:text-green-400';
                    } else if (diasRestantes === -1) {
                      textoDias = 'Ayer';
                      colorDias = 'text-red-500 dark:text-red-400';
                    } else if (diasRestantes < -1) {
                      textoDias = `Hace ${Math.abs(diasRestantes)} días`;
                      colorDias = 'text-red-500 dark:text-red-400';
                    }
                    
                    const formatNombreCorto = (nombreCompleto?: string | null): string => {
                        if (!nombreCompleto) return 'N/A';
                        const partes = nombreCompleto.split(' ').filter(Boolean);
                        if (partes.length === 0) return 'N/A';
                        if (partes.length === 1) return partes[0];
                        if (partes.length === 2) return partes.join(' ');
                        if (partes.length >= 3) return `${partes[0]} ${partes[2]}`;
                        return nombreCompleto;
                    };

                    let textoEstado = null;
                    const creador = formatNombreCorto(comision.creador_nombre);

                    if (vista === 'pendientes') {
                      if (canApprove) {
                        textoEstado = (
                          <>
                            <p className="text-blue-600 dark:text-blue-400 font-semibold text-left md:text-right w-full break-words pt-1">
                              Selecciona para ver detalles y aprobar
                            </p>
                            {comision.creador_nombre && (
                              <p className="text-gray-600 dark:text-gray-400 text-left md:text-right w-full break-words pt-1">
                                Creado por: <span className='font-bold'>{creador}</span>
                              </p>
                            )}
                          </>
                        );
                      } else {
                        textoEstado = (
                          <>
                            <p className="text-orange-600 dark:text-orange-400 font-semibold text-left md:text-right w-full break-words pt-1">
                              Aprobación pendiente de RRHH
                            </p>
                            {comision.creador_nombre && (
                              <p className="text-gray-600 dark:text-gray-400 text-left md:text-right w-full break-words pt-1">
                                Creado por: <span className='font-bold'>{creador}</span>
                              </p>
                            )}
                          </>
                        );
                      }
                    } else if (comision.aprobado) {
                      const aprobador = formatNombreCorto(comision.aprobador_nombre);

                      if (comision.creado_por && comision.aprobado_por && comision.creado_por === comision.aprobado_por) {
                        textoEstado = (
                          <p className="text-gray-600 dark:text-gray-400 text-left md:text-right w-full break-words pt-1">
                            Creado y Aprobado por: <span className='font-bold'>{creador}</span>
                          </p>
                        );
                      } else {
                        textoEstado = (
                          <>
                            {comision.creador_nombre && (
                              <p className="text-gray-600 dark:text-gray-400 text-left md:text-right w-full break-words pt-1">
                                Creado por: <span className='font-bold'>{creador}</span>
                              </p>
                            )}
                            {comision.aprobador_nombre && (
                              <p className="text-gray-600 dark:text-gray-400 text-left md:text-right w-full break-words pt-1">
                                Aprobado por: <span className='font-bold'>{aprobador}</span>
                              </p>
                            )}
                          </>
                        );
                      }
                    }
                    
                    const isJefeViewingPending = vista === 'pendientes' && !canApprove;

                    const onClickAction = isJefeViewingPending
                      ? undefined
                      : () => onVerComision(comision);
                    
                    const cursorStyle = isJefeViewingPending
                      ? 'cursor-default'
                      : 'cursor-pointer';

                    return (
                      <motion.div
                        key={comision.id}
                        layout
                        onClick={onClickAction}
                        className={`w-full p-4 border rounded-lg transition-all duration-300 ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500 shadow-md' 
                            : vista === 'pendientes' && canApprove 
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 shadow-sm' 
                            : vista === 'pendientes' && !canApprove
                            ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10'
                            : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800'
                        } flex items-start gap-4 ${cursorStyle}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {vista !== 'pendientes' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSeleccionarComision(comision);
                            }}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                            aria-label={isSelected ? "Deseleccionar comisión" : "Seleccionar comisión"}
                          >
                            {isSelected ? <CheckSquare className="text-blue-600 dark:text-blue-500" /> : <Square className="text-gray-400 dark:text-gray-500" />}
                          </button>
                        )}

                        <div className="flex-grow flex flex-col md:flex-row w-full overflow-hidden">
                          <div 
                            className={`w-full md:w-2/3 pr-4`}
                          >
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-lg break-words">{comision.titulo}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                {fechaVisual}
                            </span>
                          </div>
                          
                          <div className="w-full md:w-1/3 flex flex-col items-start md:items-end text-xs mt-2 md:mt-0 h-full">
                            
                            <div 
                              className={`w-full flex flex-col items-start md:items-end h-full justify-between`}
                            >
                              <div className="flex items-center justify-start md:justify-end gap-4 w-full">
                                <div className={`flex items-center gap-1 ${colorDias}`}>
                                  <CalendarClock size={16} />
                                  <span>{textoDias}</span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <Users size={16} />
                                  <span>{integrantesCount}</span>
                                </div>
                              </div>
                              
                              <div className="w-full mt-2">
                                {textoEstado}
                              </div>

                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-800 transition-colors">
            {vista === 'hoy' ? (
              <p className="text-gray-500 dark:text-gray-400">Ninguna comisión para hoy.</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No se encontraron comisiones para este período.</p>
            )}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {vista !== 'pendientes' && comisionesSeleccionadas && comisionesSeleccionadas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 items-end"
          >
            <Button onClick={onVerMultiplesComisiones} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-lg border-0">
              Ver {comisionesSeleccionadas.length} comision{comisionesSeleccionadas.length > 1 ? 'es' : ''}
            </Button>
            
            {showDeleteButton && (
              <Button onClick={onEliminarComisiones} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white shadow-lg flex items-center gap-2 border-0">
                <Trash2 size={16} />
                Eliminar {comisionesSeleccionadas.length}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}