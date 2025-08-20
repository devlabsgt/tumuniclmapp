'use client';

import React, { useState, Fragment, useRef, useEffect, useMemo } from 'react';
import { es } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addDays, subDays, getYear, getMonth, isSameDay, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { MapPin, FileText, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
}

interface CalendarioProps {
  todosLosRegistros: Registro[];
  onAbrirMapa: (registro: Registro) => void;
  onVerNotas: (nota: string | null) => void;
}

const getWeekDays = (date: Date) => eachDayOfInterval({
  start: startOfWeek(date, { locale: es, weekStartsOn: 1 }),
  end: endOfWeek(date, { locale: es, weekStartsOn: 1 }),
});

export default function Calendario({ todosLosRegistros, onAbrirMapa, onVerNotas }: CalendarioProps) {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>(undefined);
  const [modalOpcionesAbierto, setModalOpcionesAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Registro | null>(null);

  const diasDeLaSemana = useMemo(() => getWeekDays(fechaDeReferencia), [fechaDeReferencia]);

  const registrosDeLaSemana = useMemo(() => 
    todosLosRegistros.filter(r => 
      isWithinInterval(new Date(r.created_at), { start: diasDeLaSemana[0], end: diasDeLaSemana[6] })
    ), [todosLosRegistros, diasDeLaSemana]
  );

  const registrosParaTabla = useMemo(() => 
    diaSeleccionado 
      ? todosLosRegistros.filter(r => isSameDay(new Date(r.created_at), diaSeleccionado))
      : registrosDeLaSemana, 
    [diaSeleccionado, todosLosRegistros, registrosDeLaSemana]
  );
  
  const diasParaTabla = diaSeleccionado ? [diaSeleccionado] : diasDeLaSemana;

  const irSemanaSiguiente = () => setFechaDeReferencia(addDays(fechaDeReferencia, 7));
  const irSemanaAnterior = () => setFechaDeReferencia(subDays(fechaDeReferencia, 7));
  
  const handleSeleccionFecha = (anio: number, mes: number) => {
    const nuevaFecha = new Date(anio, mes, 1);
    setFechaDeReferencia(startOfWeek(nuevaFecha, { locale: es, weekStartsOn: 1 }));
  };
  
  const handleSeleccionDia = (dia: Date) => {
    const yaEstaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
    setDiaSeleccionado(yaEstaSeleccionado ? undefined : dia);
  };

  const handleAbrirModalOpciones = (registro: Registro) => {
    setRegistroSeleccionado(registro);
    setModalOpcionesAbierto(true);
  };

  const handleVerUbicacion = () => {
    setModalOpcionesAbierto(false);
    if (registroSeleccionado) {
      onAbrirMapa(registroSeleccionado);
    }
  };

  const handleVerNotas = () => {
    setModalOpcionesAbierto(false);
    if (registroSeleccionado) {
      onVerNotas(registroSeleccionado.notas || null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4 w-full">
      <h3 className="text-xl lg:text-3xl font-bold text-center">Registro Semanal</h3>
      
      <div className="flex justify-between items-center gap-2 p-2 bg-slate-50 rounded-lg">
        <button onClick={irSemanaAnterior} className="p-2 rounded-full hover:bg-slate-200" aria-label="Semana anterior"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
        <div className='flex gap-2 text-xl lg:text-3xl'>
          <select value={getMonth(fechaDeReferencia)} onChange={(e) => handleSeleccionFecha(getYear(fechaDeReferencia), parseInt(e.target.value))} className="p-1 border rounded-md text-xl lg:text-3xl bg-white" aria-label="Seleccionar mes">
            {Array.from({ length: 12 }).map((_, i) => (<option key={i} value={i} className="capitalize">{format(new Date(2000, i, 1), 'LLLL', { locale: es })}</option>))}
          </select>
          <select value={getYear(fechaDeReferencia)} onChange={(e) => handleSeleccionFecha(parseInt(e.target.value), getMonth(fechaDeReferencia))} className="p-1 border rounded-md text-xl lg:text-3xl bg-white" aria-label="Seleccionar año">
            {Array.from({ length: 10 }).map((_, i) => { const anio = getYear(new Date()) - 5 + i; return <option key={anio} value={anio}>{anio}</option>; })}
          </select>
        </div>
        <button onClick={irSemanaSiguiente} className="p-2 rounded-full hover:bg-slate-200" aria-label="Siguiente semana"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
      </div>

      <div className="flex justify-around items-center">
        {diasDeLaSemana.map((dia) => {
          const esDiaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
          return (
            <div key={dia.toString()} onClick={() => handleSeleccionDia(dia)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-md transition-all cursor-pointer ${isToday(dia) && !esDiaSeleccionado ? 'bg-blue-100 text-blue-800' : ''} ${esDiaSeleccionado ? 'bg-blue-600 text-white font-bold shadow-lg scale-110' : 'hover:bg-slate-100 text-slate-600'}`}>
              <span className="text-xs uppercase ">{format(dia, 'eee', { locale: es })}</span>
              <span className="text-xs ">{format(dia, 'd')}</span>
            </div>
          );
        })}
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h4 className='text-xl lg:text-3xl font-semibold text-center mb-2'>{diaSeleccionado ? `Registros para el ${format(diaSeleccionado, 'eeee d', { locale: es })}` : 'Todos los registros de la semana'}</h4>
                   <p className="text-xs text-blue-600 text-center mt-4">Seleccione un registro para ver más información.</p>

       
        {todosLosRegistros.length === 0 ? (<p className="text-center text-gray-500 text-xl lg:text-3xl">No hay registros disponibles.</p>) : (
          <>
            <table className="w-full text-sm lg:text-3xl">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2 lg:p-5">Hora</th>
                  <th className="px-4 py-2 lg:p-5">Registro</th>
                </tr>
              </thead>
              <tbody>
                {diasParaTabla.map((dia) => {
                  const fecha = format(dia, 'yyyy-MM-dd');
                  const registrosDelDia = registrosParaTabla.filter(r => isSameDay(new Date(r.created_at), dia));
                  
                  return (
                    <React.Fragment key={fecha}>
                      <tr>
                        <td colSpan={2} className="bg-slate-100 px-4 py-2 font-bold text-slate-700 border-t border-b border-slate-200">{format(dia, 'eeee, d \'de\' LLLL', { locale: es })}</td>
                      </tr>
                      {registrosDelDia.length > 0 ? (
                        registrosDelDia.map((registro, index) => (
                          <tr 
                            key={index} 
                            onClick={() => handleAbrirModalOpciones(registro)}
                            className="border-b cursor-pointer transition-colors hover:bg-gray-100"
                          >
                            <td className="px-4 py-2 font-mono lg:p-5">{new Date(registro.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-2 lg:p-5">{registro.tipo_registro}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="px-4 py-2 text-center text-gray-500 italic">No hay registros para este día.</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
      <AnimatePresence>
        {modalOpcionesAbierto && (
          <Transition show={modalOpcionesAbierto} as={Fragment}>
            <Dialog onClose={() => setModalOpcionesAbierto(false)} className="relative z-50">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
              </TransitionChild>
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                    <DialogTitle className="text-xl font-bold mb-4 flex justify-between items-center">
                      Opciones
                      <button onClick={() => setModalOpcionesAbierto(false)} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                      </button>
                    </DialogTitle>
                    <div className="flex flex-col gap-4">
                      {registroSeleccionado?.ubicacion && (
                        <Button
                          onClick={handleVerUbicacion}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <MapPin size={20} /> Ver Ubicación
                        </Button>
                      )}
                      <Button
                        onClick={handleVerNotas}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <FileText size={20} /> Ver Notas
                      </Button>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </Dialog>
          </Transition>
        )}
      </AnimatePresence>
    </div>
  );
}