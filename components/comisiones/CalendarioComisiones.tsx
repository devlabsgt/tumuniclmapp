'use client';

import { useState, useEffect } from 'react';
import {
  format,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ListPlus, StretchHorizontal } from 'lucide-react';

interface CalendarioComisionesProps {
  fechasSeleccionadas: Date[];
  onSelectFechas: (fechas: Date[]) => void;
  disabled?: boolean;
}

export default function CalendarioComisiones({
  fechasSeleccionadas,
  onSelectFechas,
  disabled = false,
}: CalendarioComisionesProps) {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(
    fechasSeleccionadas[0] || new Date()
  );
  const [selectionMode, setSelectionMode] = useState<'multiple' | 'range'>(
    'multiple'
  );
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  useEffect(() => {
    if (disabled) {
      setSelectionMode('multiple');
      setRangeStart(null);
    }
  }, [disabled]);

  useEffect(() => {
    if (fechasSeleccionadas.length > 0 && !disabled) {
      const primeraFecha = [...fechasSeleccionadas].sort((a,b) => a.getTime() - b.getTime())[0];
      setFechaDeReferencia(primeraFecha);
    } else if (disabled && fechasSeleccionadas.length > 0) {
      setFechaDeReferencia(fechasSeleccionadas[0]);
    } else {
      setFechaDeReferencia(new Date());
    }
  }, [disabled, fechasSeleccionadas.length, fechasSeleccionadas]);


  const inicioDeMes = startOfMonth(fechaDeReferencia);
  const finDeMes = endOfMonth(fechaDeReferencia);
  const diasDelMes = eachDayOfInterval({ start: inicioDeMes, end: finDeMes });

  const irMesSiguiente = () => setFechaDeReferencia(addMonths(fechaDeReferencia, 1));
  const irMesAnterior = () => setFechaDeReferencia(subMonths(fechaDeReferencia, 1));

  const handleSeleccionFecha = (dia: Date) => {
    if (disabled) {
      onSelectFechas([dia]);
    } else {
      if (selectionMode === 'multiple') {
        const isAlreadySelected = fechasSeleccionadas.some((fecha) =>
          isSameDay(fecha, dia)
        );
        let newFechas: Date[];

        if (isAlreadySelected) {
          newFechas = fechasSeleccionadas.filter(
            (fecha) => !isSameDay(fecha, dia)
          );
        } else {
          newFechas = [...fechasSeleccionadas, dia];
        }
        onSelectFechas(newFechas.sort((a, b) => a.getTime() - b.getTime()));

      } else if (selectionMode === 'range') {
        if (!rangeStart) {
          setRangeStart(dia);
          onSelectFechas([dia]);
        } else {
          const start = isBefore(dia, rangeStart) ? dia : rangeStart;
          const end = isAfter(dia, rangeStart) ? dia : rangeStart;
          
          const newRange = eachDayOfInterval({ start, end });
          onSelectFechas(newRange);
          setRangeStart(null);
        }
      }
    }
  };

  const isSelected = (dia: Date): boolean => {
    return fechasSeleccionadas.some((fecha) => isSameDay(fecha, dia));
  };

  const isDayInRange = (dia: Date): boolean => {
    if (selectionMode !== 'range' || fechasSeleccionadas.length <= 1)
      return false;
      
    const sorted = fechasSeleccionadas;
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return isAfter(dia, first) && isBefore(dia, last);
  };
  
  const getButtonClass = (dia: Date): string => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const diaStart = new Date(dia).setHours(0, 0, 0, 0);
    const isTodayDate = diaStart === todayStart;
    const isPastDate = diaStart < todayStart;

    const diaEstaSeleccionado = isSelected(dia);
    const diaEstaEnRango = isDayInRange(dia);
    const isDiaRangeStart = rangeStart && isSameDay(dia, rangeStart);

    let classes = 'w-10 h-10 flex items-center justify-center rounded-md transition-all text-sm cursor-pointer ';

    if (diaEstaSeleccionado) {
      classes += isPastDate ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 text-white font-semibold';
    } else if (diaEstaEnRango) {
      classes += isPastDate ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-700';
    } else if (isTodayDate) {
      classes += 'bg-blue-100 text-blue-800 font-bold';
    } else if (isPastDate) {
      classes += 'text-slate-400';
    } else {
      classes += 'hover:bg-slate-100 text-slate-600';
    }

    if (isDiaRangeStart && !disabled) {
      classes += ' ring-2 ring-blue-500 ring-offset-1';
    }
    
    return classes;
  }

  return (
    <div className="p-4 bg-white rounded-lg border space-y-4 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center p-2 rounded-lg">
        <button
          type="button"
          onClick={irMesAnterior}
          className="p-2 rounded-full hover:bg-slate-200 disabled:text-slate-300"
          aria-label="Mes anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex gap-2 text-lg lg:text-xl font-semibold text-slate-800 capitalize">
          <span>{format(fechaDeReferencia, 'LLLL', { locale: es })}</span>
          <span>{format(fechaDeReferencia, 'yyyy')}</span>
        </div>
        <button
          type="button"
          onClick={irMesSiguiente}
          className="p-2 rounded-full hover:bg-slate-200 disabled:text-slate-300"
          aria-label="Siguiente mes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {!disabled && (
        <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setSelectionMode('multiple');
              setRangeStart(null);
            }}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all ${
              selectionMode === 'multiple'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ListPlus size={16} />
            Uno por uno
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectionMode('range');
              setRangeStart(null);
            }}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all ${
              selectionMode === 'range'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <StretchHorizontal size={16} />
            Rango
          </button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 text-center">
        {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((dia) => (
          <span key={dia} className="text-xs uppercase font-semibold text-gray-500 w-10 h-10 flex items-center justify-center">
            {dia}
          </span>
        ))}
        {Array.from(
          { length: inicioDeMes.getDay() === 0 ? 6 : inicioDeMes.getDay() - 1 },
          (_, i) => (
            <div key={`empty-${i}`} className="w-10 h-10"></div>
          )
        )}
        {diasDelMes.map((dia) => {
          return (
            <button
              type="button"
              key={dia.toString()}
              onClick={() => handleSeleccionFecha(dia)}
              className={getButtonClass(dia)}
            >
              {format(dia, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}