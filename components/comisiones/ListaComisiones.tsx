'use client';

import React, { useState } from 'react';
import { setMonth, parseISO, differenceInCalendarDays, format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CalendarClock, CheckSquare, Square, CalendarCheck, ClipboardCheck, Trash2, ArrowUp } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';

interface Props {
  modo: string;
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

// Función auxiliar de nombres
const formatNombreCorto = (nombre?: string | null) => {
  if (!nombre) return 'N/A';
  const partes = nombre.split(' ').filter(Boolean);
  if (partes.length <= 2) return nombre;
  return `${partes[0]} ${partes[2] || partes[1]}`;
};

export default function ListaComisiones({
  modo, vista, setVista, terminoBusqueda, setTerminoBusqueda,
  mesSeleccionado, setMesSeleccionado, anioSeleccionado, setAnioSeleccionado,
  comisionesFiltradas = [], comisionesAgrupadasPorFecha = {},
  onVerComision, onCrearComision, comisionesSeleccionadas = [],
  onSeleccionarComision, onSeleccionarTodas, onVerMultiplesComisiones,
  onAprobarComision, onEliminarComisiones,
  countPendientes = 0, countHoy = 0, countProximas = 0, countTerminadas = 0,
}: Props) {
  
  const esRRHH = modo === 'RRHH';
  const [ordenDescendente, setOrdenDescendente] = useState(true);

  // Ordenar fechas
  const fechasOrdenadas = Object.keys(comisionesAgrupadasPorFecha).sort((a, b) => {
    const itemA = comisionesAgrupadasPorFecha[a]?.[0];
    const itemB = comisionesAgrupadasPorFecha[b]?.[0];
    if (!itemA || !itemB) return 0;
    
    const timeA = parseISO(itemA.fecha_hora.replace(' ', 'T')).getTime();
    const timeB = parseISO(itemB.fecha_hora.replace(' ', 'T')).getTime();
    
    return ordenDescendente ? timeA - timeB : timeB - timeA;
  });

  return (
    <>
      <div className="border-b dark:border-neutral-800 flex mb-4 flex-wrap justify-center transition-colors duration-200">
        <button onClick={() => setVista('hoy')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'hoy' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
          <CalendarClock className="h-4 w-4" /> Para hoy ({countHoy})
        </button>
        {countProximas > 0 && (
          <button onClick={() => setVista('proximas')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'proximas' ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            <CalendarCheck className="h-4 w-4" /> Próximas ({countProximas})
          </button>
        )}
        {countTerminadas > 0 && (
          <button onClick={() => setVista('terminadas')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'terminadas' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            <CalendarCheck className="h-4 w-4" /> Terminadas ({countTerminadas})
          </button>
        )}
        {countPendientes > 0 && (
          <button onClick={() => setVista('pendientes')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${vista === 'pendientes' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            <ClipboardCheck className="h-4 w-4" /> Pendientes ({countPendientes})
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input 
          placeholder="Buscar..." 
          value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} 
          className="w-full bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
        />
        <div className='flex gap-2 items-center'>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="text-sm capitalize border-gray-300 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-2 border">
            {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{format(setMonth(new Date(), i), 'MMMM', { locale: es })}</option>)}
          </select>
          <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="text-sm border-gray-300 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-2 border">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className='flex gap-2'>
          <Button onClick={onCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">Crear Comisión</Button>
        </div>
      </div>

      <div className="border-t dark:border-neutral-800 pt-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {vista !== 'pendientes' && (
              <Button onClick={onSeleccionarTodas} variant="outline" className="flex items-center gap-2 text-xs md:text-sm dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800">
                {(comisionesSeleccionadas.length === comisionesFiltradas.length && comisionesFiltradas.length > 0) ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{comisionesSeleccionadas.length === comisionesFiltradas.length ? 'Deseleccionar' : 'Seleccionar todos'}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setOrdenDescendente(!ordenDescendente)} className="flex items-center gap-2 dark:text-gray-300 dark:hover:bg-neutral-800">
              <span className="font-medium text-sm">Ordenar</span>
              <ArrowUp size={18} className={`transition-transform duration-300 ${ordenDescendente ? 'rotate-180' : 'rotate-0'}`} />
            </Button>
          </div>
          <div className={`text-xs ml-5 font-semibold ${vista === 'pendientes' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
             {vista === 'pendientes' && !esRRHH ? 'Pendientes de aprobación' : 'Seleccione para ver detalles'}
          </div>
        </div>

        {comisionesFiltradas.length > 0 ? (
          <div className="space-y-4">
            {fechasOrdenadas.map(fecha => (
              <div key={fecha}>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 capitalize sticky top-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm py-2 z-10">{fecha}</h3>
                <div className="space-y-2">
                  {comisionesAgrupadasPorFecha[fecha].map(comision => {
                    const integrantesCount = comision.asistentes?.length || 0;
                    const isSelected = comisionesSeleccionadas.some(c => c.id === comision.id);
                    
                    const dateComision = parseISO(comision.fecha_hora.replace(' ', 'T'));
                    const diasRestantes = differenceInCalendarDays(dateComision, toZonedTime(new Date(), TIMEZONE_GUATE));
                    
                    let textoDias = 'Hoy', colorDias = 'text-indigo-600 dark:text-indigo-400';
                    if (diasRestantes === 1) { textoDias = 'Mañana'; colorDias = 'text-green-600 dark:text-green-400'; }
                    else if (diasRestantes > 1) { textoDias = `En ${diasRestantes} días`; colorDias = 'text-green-600 dark:text-green-400'; }
                    else if (diasRestantes === -1) { textoDias = 'Ayer'; colorDias = 'text-red-500 dark:text-red-400'; }
                    else if (diasRestantes < -1) { textoDias = `Hace ${Math.abs(diasRestantes)} días`; colorDias = 'text-red-500 dark:text-red-400'; }

                    const creador = formatNombreCorto(comision.creador_nombre);
                    const aprobador = formatNombreCorto(comision.aprobador_nombre);
                    
                    const isInteractable = !(vista === 'pendientes' && !esRRHH);

                    return (
                      <motion.div
                        key={comision.id} layout
                        onClick={() => isInteractable && onVerComision(comision)}
                        className={`w-full p-4 border rounded-lg transition-all ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-700' 
                            : (vista === 'pendientes' && esRRHH) 
                              ? 'bg-blue-50/50 border-blue-300 dark:bg-blue-900/10 dark:border-blue-800' 
                              : (vista === 'pendientes') 
                                ? 'bg-orange-50/50 border-orange-300 dark:bg-orange-900/10 dark:border-orange-800' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800'
                        } flex items-start gap-4 ${isInteractable ? 'cursor-pointer' : 'cursor-default'}`}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      >
                        {vista !== 'pendientes' && (
                          <button onClick={(e) => { e.stopPropagation(); onSeleccionarComision(comision); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700">
                            {isSelected ? <CheckSquare className="text-blue-600 dark:text-blue-400" /> : <Square className="text-gray-400 dark:text-gray-500" />}
                          </button>
                        )}

                        <div className="flex-grow flex flex-col md:flex-row w-full overflow-hidden">
                          <div className="w-full md:w-2/3 pr-4">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-lg break-words">{comision.titulo}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">{isValid(dateComision) ? format(dateComision, 'h:mm a', { locale: es }) : 'Hora inválida'}</span>
                          </div>
                          <div className="w-full md:w-1/3 flex flex-col md:items-end justify-between text-xs mt-2 md:mt-0 h-full">
                            <div className="flex gap-4">
                                <div className={`flex items-center gap-1 ${colorDias}`}><CalendarClock size={16} /> {textoDias}</div>
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Users size={16} /> {integrantesCount}</div>
                                    </div>
                                <div className="mt-2 text-right">
                                  {vista === 'pendientes' ? (
                                    esRRHH ? <span className="text-blue-600 dark:text-blue-400 font-semibold">Seleccionar para aprobar<br/><span className="text-gray-500 dark:text-gray-400 font-normal">Por: {creador}</span></span> 
                                    : <span className="text-orange-600 dark:text-orange-400 font-semibold">Pendiente RRHH<br/><span className="text-gray-500 dark:text-gray-400 font-normal">Por: {creador}</span></span>
                                    ) : (
                                    <span className="text-gray-600 dark:text-gray-300">
                                    {comision.creador_nombre && <span>Creado: <b className="text-gray-800 dark:text-gray-100">{creador}</b></span>}
                                    {comision.aprobador_nombre && comision.creado_por !== comision.aprobado_por && <><br/>Aprobado: <b className="text-gray-800 dark:text-gray-100">{aprobador}</b></>}
                                    </span>
                                    )}
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
          <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-neutral-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-800">
            <p className="text-gray-500 dark:text-gray-400">{vista === 'hoy' ? 'Ninguna comisión para hoy.' : 'No se encontraron comisiones.'}</p>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {comisionesSeleccionadas.length > 0 && vista !== 'pendientes' && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 items-end">
            <Button onClick={onVerMultiplesComisiones} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">Ver {comisionesSeleccionadas.length} comisiones</Button>
            {esRRHH && <Button onClick={onEliminarComisiones} className="bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center gap-2"><Trash2 size={16} /> Eliminar {comisionesSeleccionadas.length}</Button>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}