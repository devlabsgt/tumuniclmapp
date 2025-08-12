'use client';

import React, { useState } from 'react';
import { es } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addDays, subDays, getYear, getMonth, isSameDay, isWithinInterval } from 'date-fns';
import { esRegistroAnomalo } from './Asistencia';

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
}

interface CalendarioProps {
  todosLosRegistros: Registro[];
  onAbrirMapa: (registro: Registro) => void;
}

export default function Calendario({ todosLosRegistros, onAbrirMapa }: CalendarioProps) {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>(undefined);
  
  const inicioDeSemana = startOfWeek(fechaDeReferencia, { locale: es, weekStartsOn: 1 });
  const finDeSemana = endOfWeek(fechaDeReferencia, { locale: es, weekStartsOn: 1 });
  const diasDeLaSemana = eachDayOfInterval({ start: inicioDeSemana, end: finDeSemana });

  const registrosDeLaSemana = todosLosRegistros.filter(r => 
    isWithinInterval(new Date(r.created_at), { start: inicioDeSemana, end: finDeSemana })
  );

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
  
  const registrosParaTabla = diaSeleccionado 
    ? todosLosRegistros.filter(r => isSameDay(new Date(r.created_at), diaSeleccionado))
    : registrosDeLaSemana;

  const diasParaTabla = diaSeleccionado ? [diaSeleccionado] : diasDeLaSemana;
  
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
        {todosLosRegistros.length === 0 ? (<p className="text-center text-gray-500 text-xl lg:text-3xl">No hay registros disponibles.</p>) : (
          <table className="w-full text-sm lg:text-3xl">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 lg:p-5">Hora</th>
                <th className="px-4 py-2 lg:p-5">Registro</th>
                <th className="px-4 py-2 lg:p-5">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {diasParaTabla.map((dia) => {
                const fecha = format(dia, 'yyyy-MM-dd');
                const registrosDelDia = registrosParaTabla.filter(r => isSameDay(new Date(r.created_at), dia));
                
                return (
                  <React.Fragment key={fecha}>
                    <tr>
                      <td colSpan={3} className="bg-slate-100 px-4 py-2 font-bold text-slate-700 border-t border-b border-slate-200">{format(dia, 'eeee, d \'de\' LLLL', { locale: es })}</td>
                    </tr>
                    {registrosDelDia.length > 0 ? (
                      registrosDelDia.map((registro, index) => (
                        <tr key={index} className={`border-b ${esRegistroAnomalo(registro) ? 'bg-rose-50 text-rose-800' : ''}`}>
                          <td className="px-4 py-2 font-mono lg:p-5">{new Date(registro.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-2 lg:p-5">{registro.tipo_registro}</td>
                          <td className="px-4 py-2 lg:p-5">{registro.ubicacion && (<button onClick={() => onAbrirMapa(registro)} className="text-blue-600 hover:underline font-medium">Ver mapa</button>)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-center text-gray-500 italic">No hay registros para este día.</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}