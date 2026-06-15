import React from 'react';

export function CintilloAzul({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-1 shrink-0 overflow-hidden rounded-sm ${className}`}>
      <div className="flex-1 bg-blue-900" />
      <div className="flex-1 bg-blue-600" />
      <div className="flex-1 bg-blue-400" />
      <div className="flex-1 bg-blue-200" />
    </div>
  );
}

interface EncabezadoMunicipalProps {
  className?: string;
}

export function EncabezadoMunicipal({ className = '' }: EncabezadoMunicipalProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 pr-12">
        <img
          src="/images/logo-muni.png"
          alt="Logo municipal"
          className="h-14 sm:h-[4.5rem] w-auto object-contain shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-sm font-black text-neutral-600 dark:text-neutral-300 tracking-widest uppercase leading-tight whitespace-nowrap">
            Municipalidad de Concepción Las Minas
          </p>
          <p className="text-[10px] sm:text-xs font-bold text-neutral-500/80 dark:text-neutral-400 tracking-wide mt-0.5">
            Chiquimula, Guatemala
          </p>
          <div className="w-fit max-w-full mt-1.5">
            <div
              className="invisible h-0 overflow-hidden text-[11px] sm:text-sm font-black tracking-widest uppercase whitespace-nowrap select-none"
              aria-hidden="true"
            >
              Municipalidad de Concepción Las Minas
            </div>
            <CintilloAzul />
          </div>
        </div>
      </div>
    </div>
  );
}
