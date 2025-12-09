'use client';

import React, { useMemo, useState } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CalendarCheck, Users, CalendarClock, ArrowUp } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

import VerComision from '../VerComision';
import AsistenciaComision from './AsistenciaComision';
import { Button } from '@/components/ui/button';

import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';

interface Props {
  vista: 'hoy' | 'proximas' | 'terminadas';
  setVista: (vista: 'hoy' | 'proximas' | 'terminadas') => void;
  mesSeleccionado: number;
  setMesSeleccionado: (mes: number) => void;
  anioSeleccionado: number;
  setAnioSeleccionado: (anio: number) => void;
  comisionesParaMostrar: ComisionConFechaYHoraSeparada[];
  openComisionId: string | null;
  onToggleComision: (comisionId: string) => void;
  onAbrirMapa: (registros: any, nombreUsuario: string) => void;
  onAsistenciaMarcada: () => void;
  userId: string;
  nombreUsuario: string;
  countHoy: number;
  countProximas: number;
  countTerminadas: number;
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);
const timeZone = 'America/Guatemala';

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

const getHoyGuateStr = () => formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

const getFechaComisionStr = (fechaHora: string) => {
    return fechaHora.substring(0, 10);
};

export default function ListaMisComisiones({
  vista,
  setVista,
  mesSeleccionado,
  setMesSeleccionado,
  anioSeleccionado,
  setAnioSeleccionado,
  comisionesParaMostrar,
  openComisionId,
  onToggleComision,
  onAbrirMapa,
  onAsistenciaMarcada,
  userId,
  nombreUsuario,
  countHoy = 0,
  countProximas = 0,
  countTerminadas = 0,
}: Props) {
  
  const [ordenDescendente, setOrdenDescendente] = useState(true);

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    if (!comisionesParaMostrar) return grupos;

    let comisionesAprobadas = comisionesParaMostrar.filter(comision => comision.aprobado === true);
    
    const hoyStr = getHoyGuateStr();

    if (vista === 'hoy') {
      comisionesAprobadas = comisionesAprobadas.filter(c => {
         const fechaComisionStr = getFechaComisionStr(c.fecha_hora);
         return fechaComisionStr === hoyStr;
      });
    }

    comisionesAprobadas.forEach(comision => {
      const fechaObj = parseISO(comision.fecha_hora.replace(' ', 'T'));
      const fechaClave = format(fechaObj, 'EEEE d', { locale: es });
      
      if (!grupos[fechaClave]) {
        grupos[fechaClave] = [];
      }
      grupos[fechaClave].push(comision);
    });

    const fechasOrdenadas = Object.keys(grupos).sort((a, b) => {
       const fechaA = parseISO(grupos[a][0].fecha_hora.replace(' ', 'T'));
       const fechaB = parseISO(grupos[b][0].fecha_hora.replace(' ', 'T'));
       
       const timeA = fechaA.getTime();
       const timeB = fechaB.getTime();
       
       return ordenDescendente ? timeB - timeA : timeA - timeB;
    });

    const gruposOrdenados: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    fechasOrdenadas.forEach(fecha => {
      grupos[fecha].sort((a, b) => {
        const fechaA = parseISO(a.fecha_hora.replace(' ', 'T'));
        const fechaB = parseISO(b.fecha_hora.replace(' ', 'T'));
        return fechaA.getTime() - fechaB.getTime();
      });
      gruposOrdenados[fecha] = grupos[fecha];
    });
    
    return gruposOrdenados;
  }, [comisionesParaMostrar, vista, ordenDescendente]);

  return (
    <>
      <div className="flex flex-col gap-4 border-b dark:border-neutral-800 pb-5 mb-5">
        
        <div className="border-b dark:border-neutral-800 flex mb-4 flex-wrap justify-center transition-colors duration-200 p">
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
        </div>
        
        <div className='flex gap-2 items-center justify-center md:justify-start flex-wrap'>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOrdenDescendente(!ordenDescendente)}
            title={ordenDescendente ? "Orden: Más nuevas primero" : "Orden: Más antiguas primero"}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 transition-colors order-last md:order-none w-full md:w-auto justify-center"
          >
            <span className="font-medium text-sm">Ordenar</span>
            <ArrowUp 
              size={18} 
              className={`transition-transform duration-300 ${ordenDescendente ? 'rotate-0' : 'rotate-180'}`} 
            />
          </Button>
          
          <select 
            value={mesSeleccionado} 
            onChange={(e) => setMesSeleccionado(Number(e.target.value))} 
            className="p-2 border border-gray-300 dark:border-neutral-700 rounded-md focus:ring-blue-500 focus:border-blue-500 capitalize bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-colors"
          >
            {meses.map((mes, index) => <option key={index} value={index}>{mes}</option>)}
          </select>
          <select 
            value={anioSeleccionado} 
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))} 
            className="p-2 border border-gray-300 dark:border-neutral-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-colors"
          >
            {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-8 p-2">
        {Object.keys(comisionesAgrupadasPorFecha).length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-800 transition-colors">
            <p className="text-gray-500 dark:text-gray-400">
              {vista === 'hoy' ? 'No tiene comisiones para hoy.' : 'No tiene comisiones asignadas para este período.'}
            </p>
          </div>
        ) : (
          Object.entries(comisionesAgrupadasPorFecha).map(([fecha, comisionesDelDia]) => (
            <div key={fecha}>
              <h3 className="text-xs md:text-lg font-bold text-blue-500 dark:text-blue-400 mb-3 capitalize sticky top-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm py-2 transition-colors z-10">{fecha}</h3>
              <div className="space-y-4">
                {comisionesDelDia.map(comision => {
                  const usuariosDeLaComision = (comision.asistentes?.map(a => ({ id: a.id, nombre: a.nombre })) || []) as Usuario[];
                  const isOpen = openComisionId === comision.id;
                  
                  const hoyStr = getHoyGuateStr();
                  const comisionStr = getFechaComisionStr(comision.fecha_hora);
                  
                  const esHoy = hoyStr === comisionStr;
                  
                  const dateHoy = parseISO(hoyStr);
                  const dateComision = parseISO(comisionStr);
                  const diasRestantes = differenceInCalendarDays(dateComision, dateHoy);

                  const fechaHoraVisual = parseISO(comision.fecha_hora.replace(' ', 'T'));
                  
                  const integrantesCount = comision.asistentes?.length || 0;

                  let textoDias = '';
                  let colorDias = 'text-gray-500 dark:text-gray-400';

                  if (esHoy) {
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

                  let textoEstado = null;
                  const creador = formatNombreCorto(comision.creador_nombre);
                  const aprobador = formatNombreCorto(comision.aprobador_nombre);

                  if (comision.creado_por && comision.aprobado_por && comision.creado_por === comision.aprobado_por) {
                    textoEstado = (<>Creado y Aprobado por: <span className="font-bold">{creador}</span></>);
                  } else if (comision.aprobador_nombre) {
                    textoEstado = (<>Aprobado por: <span className="font-bold">{aprobador}</span></>);
                  } else if (comision.creador_nombre) {
                    textoEstado = (<>Creado por: <span className="font-bold">{creador}</span></>);
                  }

                  return (
                    <div 
                      key={comision.id} 
                      className={`rounded-xl border overflow-hidden relative transition-colors duration-300 ${
                          isOpen 
                            ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' 
                            : 'border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800'
                        }`}
                    >
                      
                      <div className="cursor-pointer p-4" onClick={() => onToggleComision(comision.id)}>
                        <div className="flex justify-between items-center">
                          {isOpen ? (
                            <div className='flex-grow'>
                              {esHoy ? (
                                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Recuerda marcar tu asistencia</p>
                              ) : (
                                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">Detalles de la comisión</p>
                              )}
                            </div>
                          ) : (
                            <div className='flex-grow flex flex-col'>
                              <div className="flex items-center justify-between gap-2 pr-2">
                                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-100">{comision.titulo}</h4>
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <Users size={12} />
                                  <span>{integrantesCount}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 pr-2 mt-2">
                                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap capitalize">{format(fechaHoraVisual, 'h:mm a', { locale: es })}</p>
                                <div className={`flex items-center gap-1 ${colorDias}`}>
                                  <CalendarClock size={12} />
                                  <span>{textoDias}</span>
                                </div>
                              </div>
                              {textoEstado && (
                                <p className="text-gray-500 dark:text-gray-400 text-xs text-right w-full break-words pr-2 mt-2">
                                  {textoEstado}
                                </p>
                              )}
                            </div>
                          )}
                          <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden bg-white dark:bg-neutral-900"
                          >
                            <div>
                              <div className="[&_.exclude-from-capture]:hidden [&>div]:shadow-none [&>div]:border-none">
                                <VerComision
                                  comision={comision}
                                  usuarios={usuariosDeLaComision}
                                  onClose={() => {}}
                                  onAbrirMapa={onAbrirMapa}
                                  onAprobar={() => {}}
                                  onEdit={() => {}}
                                  onDelete={() => {}}
                                />
                              </div>
                              {esHoy && (
                                <AsistenciaComision
                                  comision={comision}
                                  userId={userId}
                                  nombreUsuario={nombreUsuario}
                                  onAsistenciaMarcada={onAsistenciaMarcada}
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}