'use client';

import { useEffect, useState } from 'react';
import {
  format,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarioProps {
  fechaSeleccionada: string;
  onSelectDate: (date: string) => void;
}

export default function Calendario({ fechaSeleccionada, onSelectDate }: CalendarioProps) {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date(fechaSeleccionada + 'T00:00:00'));

  const inicioDeMes = startOfMonth(fechaDeReferencia);
  const finDeMes = endOfMonth(fechaDeReferencia);
  const diasDelMes = eachDayOfInterval({ start: inicioDeMes, end: finDeMes });

  const irMesSiguiente = () => setFechaDeReferencia(addMonths(fechaDeReferencia, 1));
  const irMesAnterior = () => setFechaDeReferencia(subMonths(fechaDeReferencia, 1));

  const handleSeleccionFecha = (dia: Date) => {
    onSelectDate(format(dia, 'yyyy-MM-dd'));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-center p-2 rounded-lg">
        <button type="button" onClick={irMesAnterior} className="p-2 rounded-full hover:bg-slate-200" aria-label="Mes anterior">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className='flex gap-2 text-lg lg:text-xl'>
          <span>{format(fechaDeReferencia, 'LLLL', { locale: es })}</span>
          <span>{format(fechaDeReferencia, 'yyyy')}</span>
        </div>
        <button type="button" onClick={irMesSiguiente} className="p-2 rounded-full hover:bg-slate-200" aria-label="Siguiente mes">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((dia) => (
          <span key={dia} className="text-xs uppercase font-semibold text-gray-500">{dia}</span>
        ))}
        {Array.from({ length: inicioDeMes.getDay() === 0 ? 6 : inicioDeMes.getDay() - 1 }, (_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8"></div>
        ))}
        {diasDelMes.map((dia) => {
          const isSelected = isSameDay(dia, new Date(fechaSeleccionada + 'T00:00:00'));
          const isTodayDate = isToday(dia);
          const isPastDate = dia.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
          return (
            <button
              type="button"
              key={dia.toString()}
              onClick={() => handleSeleccionFecha(dia)}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer text-sm
                ${isPastDate && isSelected ? 'bg-slate-200 text-slate-600' : ''}
                ${isPastDate && !isSelected ? 'text-slate-600' : ''}
                ${!isPastDate && isSelected ? 'bg-blue-600 text-white' : ''}
                ${isTodayDate && !isSelected ? 'bg-blue-100 text-blue-800' : ''}
                ${!isPastDate && !isSelected && !isTodayDate ? 'hover:bg-slate-100 text-slate-600' : ''}
              `}
            >
              {format(dia, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};