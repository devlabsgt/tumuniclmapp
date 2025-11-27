'use client';

import React, { useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CalendarCheck, Users, CalendarClock } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

import VerComision from '../VerComision';
import AsistenciaComision from './AsistenciaComision';

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

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    if (!comisionesParaMostrar) return grupos;

    const comisionesAprobadas = comisionesParaMostrar.filter(comision => comision.aprobado === true);

    comisionesAprobadas.forEach(comision => {
      const fecha = parseISO(comision.fecha_hora.replace(' ', 'T'));
      const fechaClave = format(fecha, 'EEEE d', { locale: es });
      if (!grupos[fechaClave]) {
        grupos[fechaClave] = [];
      }
      grupos[fechaClave].push(comision);
    });

    const fechasOrdenadas = Object.keys(grupos).sort((a, b) => {
      const fechaA = parseISO(grupos[a][0].fecha_hora.replace(' ', 'T'));
      const fechaB = parseISO(grupos[b][0].fecha_hora.replace(' ', 'T'));
      return fechaA.getTime() - fechaB.getTime();
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
  }, [comisionesParaMostrar]);

  return (
    <>
      <div className="flex flex-col gap-4 border-b pb-5 mb-5">
        
        <div className="border-b flex mb-4 flex-wrap justify-center">
          <button
            onClick={() => setVista('hoy')}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'hoy' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            <CalendarClock className="h-4 w-4" /> Para hoy ({countHoy})
          </button>
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
        </div>
        
        <div className='flex gap-2 items-center justify-center md:justify-start'>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 capitalize">
            {meses.map((mes, index) => <option key={index} value={index}>{mes}</option>)}
          </select>
          <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
            {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(comisionesAgrupadasPorFecha).length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            {vista === 'hoy' ? 'No tiene comisiones para hoy.' : 'No tiene comisiones asignadas para este mes.'}
          </p>
        ) : (
          Object.entries(comisionesAgrupadasPorFecha).map(([fecha, comisionesDelDia]) => (
            <div key={fecha}>
              <h3 className="text-xs md:text-lg font-bold text-blue-500 mb-3 capitalize">{fecha}</h3>
              <div className="space-y-4">
                {comisionesDelDia.map(comision => {
                  const usuariosDeLaComision = (comision.asistentes?.map(a => ({ id: a.id, nombre: a.nombre })) || []) as Usuario[];
                  const isOpen = openComisionId === comision.id;
                  
                  // --- SOLUCIÓN: COMPARACIÓN ESTRICTA DE STRINGS ---
                  
                  // 1. Obtener la fecha HOY en Guate como string "YYYY-MM-DD"
                  const hoyGuateStr = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
                  
                  // 2. Obtener fecha de la comisión (ignorando la hora por completo)
                  // Asume formato DB "YYYY-MM-DD HH:mm:ss"
                  const fechaComisionStr = comision.fecha_hora.split(' ')[0];

                  // 3. Comparación de strings (Infalible)
                  const esHoy = fechaComisionStr === hoyGuateStr;

                  // 4. Calculo de dias restantes usando fechas parseadas SIN hora (medianoche)
                  // Esto evita que 11pm ayer se confunda con hoy
                  const dateHoyClean = parseISO(hoyGuateStr);
                  const dateComisionClean = parseISO(fechaComisionStr);
                  const diasRestantes = differenceInCalendarDays(dateComisionClean, dateHoyClean);

                  const fechaHoraVisual = parseISO(comision.fecha_hora.replace(' ', 'T'));
                  const integrantesCount = comision.asistentes?.length || 0;

                  let textoDias = '';
                  let colorDias = 'text-gray-500';

                  if (esHoy) {
                    textoDias = 'Hoy';
                    colorDias = 'text-indigo-600 font-semibold';
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
                  const aprobador = formatNombreCorto(comision.aprobador_nombre);

                  if (comision.creado_por && comision.aprobado_por && comision.creado_por === comision.aprobado_por) {
                    textoEstado = (<>Creado y Aprobado por: <span className="font-bold">{creador}</span></>);
                  } else if (comision.aprobador_nombre) {
                    textoEstado = (<>Aprobado por: <span className="font-bold">{aprobador}</span></>);
                  } else if (comision.creador_nombre) {
                    textoEstado = (<>Creado por: <span className="font-bold">{creador}</span></>);
                  }

                  return (
                    <div key={comision.id} className="rounded-xl border border-gray-200 overflow-hidden relative">
                      
                      <div className="cursor-pointer p-4" onClick={() => onToggleComision(comision.id)}>
                        <div className="flex justify-between items-center">
                          {isOpen ? (
                            <div className='flex-grow'>
                              {esHoy ? (
                                <p className="text-lg font-semibold text-gray-600">Recuerda marcar tu asistencia</p>
                              ) : (
                                <p className="text-lg font-semibold text-gray-600">Detalles de la comisión</p>
                              )}
                            </div>
                          ) : (
                            <div className='flex-grow flex flex-col'>
                              <div className="flex items-center justify-between gap-2 pr-2">
                                <h4 className="text-xs font-bold text-gray-800">{comision.titulo}</h4>
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Users size={12} />
                                  <span>{integrantesCount}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 pr-2 mt-2">
                                <p className="text-xs  text-gray-700 whitespace-nowrap capitalize">{format(fechaHoraVisual, 'h:mm a', { locale: es })}</p>
                                <div className={`flex items-center gap-1 ${colorDias}`}>
                                  <CalendarClock size={12} />
                                  <span>{textoDias}</span>
                                </div>
                              </div>
                              {textoEstado && (
                                <p className="text-gray-500 text-xs text-right w-full break-words pr-2 mt-2">
                                  {textoEstado}
                                </p>
                              )}
                            </div>
                          )}
                          <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
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