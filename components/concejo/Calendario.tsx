// components/concejo/Calendario.tsx
'use client';

import React from 'react';
import { es } from 'date-fns/locale';
import { format, setMonth, getYear } from 'date-fns';

interface CalendarioProps {
  onFiltroCambio: (anio: string, mes: string) => void;
  filtroMes: number | null;
  filtroAnio: string;
}

export default function Calendario({ onFiltroCambio, filtroMes, filtroAnio }: CalendarioProps) {
  const anios = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i);
  const meses = Array.from({ length: 12 }, (_, i) => ({
    numero: i,
    nombre: format(setMonth(new Date(), i), 'MMM', { locale: es }),
  }));

  const handleSeleccionMes = (mes: number) => {
    onFiltroCambio(filtroAnio, mes === filtroMes ? '' : mes.toString());
  };

  const handleSeleccionAnio = (anio: string) => {
    onFiltroCambio(anio, filtroMes !== null ? filtroMes.toString() : '');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4 w-full">
      <div className="flex flex-col items-start gap-2">
        <p className="w-full text-sm font-normal text-gray-500">
            Seleccione un año:
        </p>
        <select
            value={filtroAnio}
            onChange={(e) => handleSeleccionAnio(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
            {anios.map(anio => (
                <option key={anio} value={anio}>{anio}</option>
            ))}
        </select>
      </div>
      <div className="flex flex-col items-start gap-2">
        <p className="w-full text-sm font-normal text-gray-500">
            Seleccione un mes:
        </p>
        <div className="grid grid-cols-2 gap-2">
            {meses.map(mes => (
                <button
                    key={mes.numero}
                    onClick={() => handleSeleccionMes(mes.numero)}
                    className={`
                        px-4 py-2 rounded-lg transition-all text-sm
                        ${filtroMes === mes.numero
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                    `}
                >
                    {mes.nombre.charAt(0).toUpperCase() + mes.nombre.slice(1)}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
}
