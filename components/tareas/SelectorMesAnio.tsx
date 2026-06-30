'use client';

import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_DISPONIBLES_DEFAULT = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - 1 + i);

interface Props {
  mes: number;
  anio: number;
  onChange: (mes: number, anio: number) => void;
  className?: string;
  aniosDisponibles?: number[];
}

export default function SelectorMesAnio({ mes, anio, onChange, className = '', aniosDisponibles = ANIOS_DISPONIBLES_DEFAULT }: Props) {
  const [open, setOpen] = useState(false);
  const [anioVista, setAnioVista] = useState(anio);

  const anioMin = Math.min(...aniosDisponibles);
  const anioMax = Math.max(...aniosDisponibles);

  const indiceAnioVista = aniosDisponibles.indexOf(anioVista);
  const puedeAnioAnterior = indiceAnioVista > 0;
  const puedeAnioSiguiente = indiceAnioVista < aniosDisponibles.length - 1;

  const puedeMesAnterior = anio > anioMin || (anio === anioMin && mes > 0);
  const puedeMesSiguiente = anio < anioMax || (anio === anioMax && mes < 11);

  const irMesAnterior = () => {
    if (!puedeMesAnterior) return;
    if (mes === 0) onChange(11, anio - 1);
    else onChange(mes - 1, anio);
  };

  const irMesSiguiente = () => {
    if (!puedeMesSiguiente) return;
    if (mes === 11) onChange(0, anio + 1);
    else onChange(mes + 1, anio);
  };

  const seleccionarMes = (indiceMes: number) => {
    onChange(indiceMes, anioVista);
    setOpen(false);
  };

  const flechaClass = 'p-2 text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0';

  return (
    <div className={`flex items-center w-full md:w-fit bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={irMesAnterior}
        disabled={!puedeMesAnterior}
        className={flechaClass}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={18} />
      </button>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setAnioVista(aniosDisponibles.includes(anio) ? anio : aniosDisponibles[0]);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 md:flex-none min-w-0 flex items-center justify-center gap-1 px-1.5 sm:px-2 md:px-4 py-2.5 text-[11px] sm:text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/20 font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors border-x border-slate-200 dark:border-neutral-800 whitespace-nowrap"
          >
            <span className="truncate">{MESES[mes]} {anio}</span>
            <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform sm:w-4 sm:h-4 ${open ? 'rotate-180' : ''}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3 rounded-xl border-slate-200 dark:border-neutral-800" align="center">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              disabled={!puedeAnioAnterior}
              onClick={() => setAnioVista(aniosDisponibles[indiceAnioVista - 1])}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-white">{anioVista}</span>
            <button
              type="button"
              disabled={!puedeAnioSiguiente}
              onClick={() => setAnioVista(aniosDisponibles[indiceAnioVista + 1])}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MESES_CORTOS.map((nombre, i) => {
              const activo = mes === i && anio === anioVista;
              return (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => seleccionarMes(i)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
                    activo
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {nombre}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={irMesSiguiente}
        disabled={!puedeMesSiguiente}
        className={flechaClass}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
