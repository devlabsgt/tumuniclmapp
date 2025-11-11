'use client';

import React from 'react';
import { getMonth, setMonth, parseISO, isToday, differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CalendarClock, CheckSquare, Square, CalendarCheck, ClipboardCheck } from 'lucide-react';
import useUserData from '@/hooks/sesion/useUserData';

import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';

interface Props {
  vista: 'proximas' | 'terminadas' | 'pendientes';
  setVista: (vista: 'proximas' | 'terminadas' | 'pendientes') => void;
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
  countPendientes: number;
  countProximas: number;
  countTerminadas: number;
}

const formatNombreCorto = (nombreCompleto?: string | null): string => {
  if (!nombreCompleto) return 'N/A';
  
  const partes = nombreCompleto.split(' ').filter(Boolean);
  
  if (partes.length === 0) return 'N/A';
  if (partes.length === 1) return partes[0];
  if (partes.length === 2) return partes.join(' ');
  if (partes.length >= 3) {
    return `${partes[0]} ${partes[2]}`;
  }
  
  return nombreCompleto;
};

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
  countPendientes = 0,
  countProximas = 0,
  countTerminadas = 0,
}: Props) {
  
  const { rol: rolActual, esjefe } = useUserData();
  
  const hasAdminPermissions = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO' || esjefe;
  const canApprove = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO';

  return (
    <>
      <div className="border-b flex mb-4 flex-wrap justify-center">
        
        {countProximas > 0 && (
          <button
            onClick={() => setVista('proximas')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'proximas' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
          >
            <CalendarCheck className="h-4 w-4" /> Próximas ({countProximas})
          </button>
        )}
        
        {countTerminadas > 0 && (
          <button
            onClick={() => setVista('terminadas')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'terminadas' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}
          >
            <CalendarCheck className="h-4 w-4" /> Terminadas ({countTerminadas})
          </button>
        )}

        {hasAdminPermissions && countPendientes > 0 && (
          <button
            onClick={() => setVista('pendientes')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'pendientes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            <ClipboardCheck className="h-4 w-4" /> Pendientes de Aprobación ({countPendientes})
          </button>
        )}

      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input placeholder="Buscar por título o integrante..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} className="w-full" />
        <div className='flex gap-2 items-center'>
          <select value={mesSeleccionado} onChange={(e) => { setMesSeleccionado(Number(e.target.value)); }} className="text-sm capitalize focus:ring-0 border-gray-300 rounded-md">
            {Array.from({ length: 12 }).map((_, index) => <option key={index} value={index}>{format(setMonth(new Date(), index), 'MMMM', { locale: es })}</option>)}
          </select>
          <select value={anioSeleccionado} onChange={(e) => { setAnioSeleccionado(Number(e.target.value)); }} className="text-sm focus:ring-0 border-gray-300 rounded-md">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(anio => <option key={anio} value={anio}>{anio}</option>)}
          </select>
        </div>
        <div className='flex flex-row gap-2'>
          {hasAdminPermissions && (
            <Button onClick={onCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
              Crear Comisión
            </Button>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            {vista !== 'pendientes' && (
              <Button
                onClick={onSeleccionarTodas}
                variant="outline"
                className="flex items-center gap-2 text-xs md:text-sm"
              >
                {(comisionesSeleccionadas?.length || 0) === (comisionesFiltradas?.length || 0) ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{(comisionesSeleccionadas?.length || 0) === (comisionesFiltradas?.length || 0) ? 'Deseleccionar todos' : 'Seleccionar todos'}</span>
              </Button>
            )}
            
            <div className={`text-xs ml-5 font-semibold ${vista === 'pendientes' ? 'text-blue-600' : 'text-purple-600'}`}>
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
            {Object.keys(comisionesAgrupadasPorFecha).map(fecha => (
              <div key={fecha}>
                <h3 className="text-sm font-bold text-gray-800 mb-2 capitalize sticky top-0 bg-white/80 backdrop-blur-sm py-2">{fecha}</h3>
                <div className="space-y-2">
                  {comisionesAgrupadasPorFecha[fecha].map(comision => {
                    const ahora = new Date();
                    const fechaUtc = parseISO(comision.fecha_hora.replace(' ', 'T') + 'Z');
                    const fechaComision = fechaUtc; 
                    const diasRestantes = differenceInCalendarDays(fechaComision, ahora);
                    const integrantesCount = comision.asistentes?.length || 0;
                    const isSelected = comisionesSeleccionadas?.some(c => c.id === comision.id);
                    let textoDias = '';
                    let colorDias = 'text-gray-500';
                    if (isToday(fechaComision)) {
                      textoDias = 'Hoy';
                      colorDias = 'text-blue-600 font-semibold';
                    } else if (diasRestantes === 1) {
                      textoDias = 'Mañana';
                      colorDias = 'text-green-600';
                    } else if (diasRestantes > 1) {
                      textoDias = `En ${diasRestantes} días`;
                      colorDias = 'text-green-600';
                    } else if (diasRestantes === -1) {
                      textoDias = 'Ayer';
                      colorDias = 'text-red-500';
                    } else if (diasRestantes < -1) {
                      textoDias = `Hace ${Math.abs(diasRestantes)} días`;
                      colorDias = 'text-red-500';
                    }
                    
                    let textoEstado = null;
                    const creador = formatNombreCorto(comision.creador_nombre);

                    if (vista === 'pendientes') {
                      if (canApprove) {
                        textoEstado = (
                          <>
                            <p className="text-blue-600 font-semibold text-left md:text-right w-full break-words pt-1">
                              Selecciona para ver detalles y aprobar
                            </p>
                            {comision.creador_nombre && (
                              <p className="text-gray-600 text-left md:text-right w-full break-words pt-1">
                                Creado por: <span className='font-bold'>{creador}</span>
                              </p>
                            )}
                          </>
                        );
                      } else {
                        textoEstado = (
                          <>
                            <p className="text-orange-600 font-semibold text-left md:text-right w-full break-words pt-1">
                              Aprobación pendiente de RRHH
                            </p>
                            {comision.creador_nombre && (
                              <p className="text-gray-600 text-left md:text-right w-full break-words pt-1">
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
                          <p className="text-gray-600 text-left md:text-right w-full break-words pt-1">
                            Creado y Aprobado por: <span className='font-bold'>{creador}</span>
                          </p>
                        );
                      } else {
                        textoEstado = (
                          <>
                            {comision.creador_nombre && (
                              <p className="text-gray-600 text-left md:text-right w-full break-words pt-1">
                                Creado por: <span className='font-bold'>{creador}</span>
                              </p>
                            )}
                            {comision.aprobador_nombre && (
                              <p className="text-gray-600 text-left md:text-right w-full break-words pt-1">
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
                            ? 'bg-blue-50 border-blue-400 shadow-md' 
                            : vista === 'pendientes' && canApprove 
                            ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-100 shadow-sm' 
                            : vista === 'pendientes' && !canApprove
                            ? 'border-orange-300 bg-orange-50/50'
                            : 'hover:bg-gray-50'
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
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                            aria-label={isSelected ? "Deseleccionar comisión" : "Seleccionar comisión"}
                          >
                            {isSelected ? <CheckSquare className="text-blue-600" /> : <Square className="text-gray-400" />}
                          </button>
                        )}

                        <div className="flex-grow flex flex-col md:flex-row w-full overflow-hidden">
                          <div 
                            className={`w-full md:w-2/3 pr-4`}
                          >
                            <span className="font-semibold text-gray-900 text-xs md:text-lg break-words">{comision.titulo}</span>
                            <span className="text-xs text-gray-500 block">{format(fechaComision, "h:mm a", { locale: es })}</span>
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
                                <div className="flex items-center gap-1 text-blue-600">
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
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-500">No se encontraron comisiones para este período.</p>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {vista !== 'pendientes' && comisionesSeleccionadas && comisionesSeleccionadas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button onClick={onVerMultiplesComisiones} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
              Ver {comisionesSeleccionadas.length} comision{comisionesSeleccionadas.length > 1 ? 'es' : ''}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}