'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ParamsReporteCombustible } from './lib/actions';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const toMonthValue = (anio: number, mes: number) =>
  `${anio}-${String(mes + 1).padStart(2, '0')}`;

export const fromMonthValue = (val: string) => {
  const [y, m] = val.split('-').map(Number);
  return { anio: y, mes: m - 1 };
};

export const formatRangoLabel = (inicio: string, fin: string) => {
  const { anio: y1, mes: m1 } = fromMonthValue(inicio);
  const { anio: y2, mes: m2 } = fromMonthValue(fin);
  const mesIni = MESES_CORTOS[m1].toLowerCase();
  const mesFin = MESES_CORTOS[m2].toLowerCase();
  if (inicio === fin) return `${mesIni} ${y1}`;
  return `De ${mesIni} ${y1} a ${mesFin} ${y2}`;
};

export const paramsDesdeMeses = (
  inicio: string,
  fin: string
): ParamsReporteCombustible => {
  const ini = fromMonthValue(inicio);
  const end = fromMonthValue(fin);
  if (inicio === fin) {
    return {
      modoRango: false,
      anio: ini.anio,
      mes: ini.mes,
      mesInicio: ini.mes,
      mesFin: ini.mes,
      anioInicio: ini.anio,
      anioFin: ini.anio,
    };
  }
  return {
    modoRango: true,
    anio: ini.anio,
    mes: ini.mes,
    mesInicio: ini.mes,
    mesFin: end.mes,
    anioInicio: ini.anio,
    anioFin: end.anio,
  };
};

export const etiquetaPeriodo = (params: ParamsReporteCombustible) => {
  if (!params.modoRango) {
    return `${MESES[params.mes]} ${params.anio}`;
  }
  const ini = toMonthValue(params.anioInicio, params.mesInicio);
  const fin = toMonthValue(params.anioFin, params.mesFin);
  return formatRangoLabel(ini, fin);
};

export const BTN_TOOLBAR =
  'flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all shadow-sm whitespace-nowrap';

const INPUT_MES =
  'text-sm border border-slate-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 bg-white dark:bg-neutral-900 text-slate-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 w-full';

export default function SelectorPeriodoReporte({
  inicio,
  fin,
  onChange,
  className = '',
}: {
  inicio: string;
  fin: string;
  onChange: (ini: string, fin: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${BTN_TOOLBAR} ${className}`}
          title="Seleccionar periodo"
        >
          <Calendar size={15} className="text-blue-500 shrink-0" />
          <span>{formatRangoLabel(inicio, fin)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <div className="flex flex-col gap-3 min-w-[12rem]">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Desde
            </label>
            <input
              type="month"
              value={inicio}
              onChange={(e) => onChange(e.target.value, fin)}
              className={INPUT_MES}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Hasta
            </label>
            <input
              type="month"
              value={fin}
              onChange={(e) => onChange(inicio, e.target.value)}
              className={INPUT_MES}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
