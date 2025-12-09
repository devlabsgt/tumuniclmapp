'use client';

import { useState, useEffect } from 'react';
import {
  format,
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
import { ListPlus, StretchHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

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
      if (isPastDate) {
        // Seleccionado en el pasado (grisaceo)
        classes += 'bg-slate-300 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400';
      } else {
        // Seleccionado futuro/hoy (azul fuerte)
        classes += 'bg-blue-600 dark:bg-blue-700 text-white font-semibold';
      }
    } else if (diaEstaEnRango) {
      if (isPastDate) {
        // En rango pasado
        classes += 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500';
      } else {
        // En rango futuro
        classes += 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      }
    } else if (isTodayDate) {
      // Hoy sin seleccionar
      classes += 'bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800';
    } else if (isPastDate) {
      // Pasado sin seleccionar
      classes += 'text-slate-400 dark:text-neutral-600';
    } else {
      // Futuro sin seleccionar (normal)
      classes += 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300';
    }

    if (isDiaRangeStart && !disabled) {
      classes += ' ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1 dark:ring-offset-neutral-950';
    }
    
    return classes;
  }

  return (
    <div className="p-4 bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 space-y-4 w-full max-w-md mx-auto transition-colors duration-200">
      
      {/* Header Mes/Año */}
      <div className="flex justify-between items-center p-2 rounded-lg">
        <button
          type="button"
          onClick={irMesAnterior}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 disabled:text-slate-300 dark:disabled:text-neutral-700 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2 text-lg lg:text-xl font-semibold text-slate-800 dark:text-neutral-100 capitalize">
          <span>{format(fechaDeReferencia, 'LLLL', { locale: es })}</span>
          <span>{format(fechaDeReferencia, 'yyyy')}</span>
        </div>
        <button
          type="button"
          onClick={irMesSiguiente}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 disabled:text-slate-300 dark:disabled:text-neutral-700 transition-colors"
          aria-label="Siguiente mes"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Switcher de Modo de Selección */}
      {!disabled && (
        <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-neutral-900 rounded-lg transition-colors">
          <button
            type="button"
            onClick={() => {
              setSelectionMode('multiple');
              setRangeStart(null);
            }}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded-md transition-all ${
              selectionMode === 'multiple'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
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
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-800'
            }`}
          >
            <StretchHorizontal size={16} />
            Rango
          </button>
        </div>
      )}

      {/* Grid de Días */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((dia) => (
          <span key={dia} className="text-xs uppercase font-semibold text-gray-500 dark:text-neutral-500 w-10 h-10 flex items-center justify-center">
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