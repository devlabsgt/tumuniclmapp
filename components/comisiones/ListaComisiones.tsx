// src/app/ListaComisiones.tsx
import React from 'react';
import { getMonth, setMonth, parseISO, isToday, differenceInCalendarDays } from 'date-fns';
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CalendarClock, CheckSquare, Square, CalendarCheck } from 'lucide-react';
import { Typewriter } from 'react-simple-typewriter';

import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { getUsuarioNombre } from './Ver';

interface Props {
  vista: 'proximas' | 'terminadas';
  setVista: (vista: 'proximas' | 'terminadas') => void;
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
  rolActual: string | null; // <-- 1. AÑADIR ROL A LAS PROPS
}

export default function ListaComisiones({
  vista,
  setVista,
  terminoBusqueda,
  setTerminoBusqueda,
  mesSeleccionado,
  setMesSeleccionado,
  anioSeleccionado,
  setAnioSeleccionado,
  comisionesFiltradas,
  comisionesAgrupadasPorFecha,
  onVerComision,
  onCrearComision,
  comisionesSeleccionadas,
  onSeleccionarComision,
  onSeleccionarTodas,
  onVerMultiplesComisiones,
  rolActual, // <-- 2. OBTENER ROL
}: Props) {
  const timeZone = 'America/Guatemala';
  
  // 3. CREAR FLAG DE PERMISO
  const hasCreatePermission = rolActual === 'SUPER' || rolActual === 'RRHH' || rolActual === 'SECRETARIO';

  return (
    <>
      <div className="border-b flex mb-4 flex-wrap justify-center">
        <button
          onClick={() => setVista('proximas')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'proximas' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
        >
          <CalendarCheck className="h-4 w-4" /> Por hacer
        </button>
        <button
          onClick={() => setVista('terminadas')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'terminadas' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}
        >
          <CalendarCheck className="h-4 w-4" /> Terminadas
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Input placeholder="Buscar por título o integrante..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} className="w-full" />
        <div className='flex gap-2 items-center'>
          <select value={mesSeleccionado} onChange={(e) => { setMesSeleccionado(Number(e.target.value)); }} className="text-sm capitalize focus:ring-0 border-gray-300 rounded-md">
            {Array.from({ length: 12 }).map((_, index) => <option key={index} value={index}>{formatInTimeZone(setMonth(new Date(), index), 'MMMM', { locale: es })}</option>)}
          </select>
          <select value={anioSeleccionado} onChange={(e) => { setAnioSeleccionado(Number(e.target.value)); }} className="text-sm focus:ring-0 border-gray-300 rounded-md">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(anio => <option key={anio} value={anio}>{anio}</option>)}
          </select>
        </div>
        <div className='flex flex-row gap-2'>
          {/* 4. APLICAR CONDICIÓN AL BOTÓN */}
          {hasCreatePermission && (
            <Button onClick={onCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
              Crear Comisión
            </Button>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onSeleccionarTodas}
              variant="outline"
              className="flex items-center gap-2 text-xs md:text-sm"
            >
              {comisionesSeleccionadas.length === comisionesFiltradas.length ? <CheckSquare size={16} /> : <Square size={16} />}
              <span>{comisionesSeleccionadas.length === comisionesFiltradas.length ? 'Deseleccionar todos' : 'Seleccionar todos'}</span>
            </Button>
            <div className="text-xs ml-5 font-semibold text-purple-600">
              <Typewriter
                words={[
                  'Seleccione una comisión para ver sus detalles',
                ]}
                loop={1}
                cursor
                cursorStyle="_"
                typeSpeed={40}
              />

            </div>
          </div>
        </div>
        {comisionesFiltradas.length > 0 ? (
          <div className="space-y-4">
            {Object.keys(comisionesAgrupadasPorFecha).map(fecha => (
              <div key={fecha}>
                <h3 className="text-sm font-bold text-gray-800 mb-2 capitalize sticky top-0 bg-white/80 backdrop-blur-sm py-2">{fecha}</h3>
                <div className="space-y-2">
                  {comisionesAgrupadasPorFecha[fecha].map(comision => {
                    const ahora = new Date();
                    const fechaUtc = parseISO(comision.fecha_hora.replace(' ', 'T') + 'Z');
                    const fechaComision = toZonedTime(fechaUtc, timeZone);
                    const diasRestantes = differenceInCalendarDays(fechaComision, ahora);
                    const integrantesCount = comision.asistentes?.length || 0;
                    const isSelected = comisionesSeleccionadas.some(c => c.id === comision.id);
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
                    return (
                      <motion.div
                        key={comision.id}
                        layout
                        className={`w-full p-4 border rounded-lg cursor-pointer flex justify-between items-center transition-all duration-300 ${isSelected ? 'bg-blue-50 border-blue-400 shadow-md' : 'hover:bg-gray-50'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSeleccionarComision(comision);
                          }}
                          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                          aria-label={isSelected ? "Deseleccionar comisión" : "Seleccionar comisión"}
                        >
                          {isSelected ? <CheckSquare className="text-blue-600" /> : <Square className="text-gray-400" />}
                        </button>
                        <div onClick={() => onVerComision(comision)} className="flex-grow flex flex-col">
                          <span className="font-semibold text-gray-900 text-xs md:text-lg">{comision.titulo}</span>
                          <span className="text-xs text-gray-500">{formatInTimeZone(fechaComision, "h:mm a", { locale: es, timeZone })}</span>
                        </div>
                        <div onClick={() => onVerComision(comision)} className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-6 text-xs text-right">
                          <div className={`flex items-center gap-2 ${colorDias}`}>
                            <CalendarClock size={16} />
                            <span>{textoDias}</span>
                          </div>
                          <div className="flex items-center gap-2 text-blue-600">
                            <Users size={16} />
                            <span>{integrantesCount}</span>
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
        {comisionesSeleccionadas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
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