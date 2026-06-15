'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Building2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilaReporteDependencia } from './lib/actions';
import { cn } from '@/lib/utils';

const SELECT_FILTRO =
  'h-auto w-full sm:w-auto min-w-[9.5rem] gap-1.5 px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-sm focus:ring-2 focus:ring-blue-500/20';

interface SugerenciaFiltro {
  key: string;
  nombre: string;
  detalle?: string;
}

export interface FiltroConSugerenciasProps {
  modoNombre: boolean;
  onModoChange: (modoNombre: boolean) => void;
  filas: FilaReporteDependencia[];
  valorAplicado: string;
  onSeleccionarDep: (nombre: string) => void;
  onSeleccionarNombre: (nombre: string) => void;
  onLimpiar: () => void;
  autoAplicar?: boolean;
  onSeleccionChange?: (nombre: string | null) => void;
  className?: string;
}

export function FiltroConSugerencias({
  modoNombre,
  onModoChange,
  filas,
  valorAplicado,
  onSeleccionarDep,
  onSeleccionarNombre,
  onLimpiar,
  autoAplicar = true,
  onSeleccionChange,
  className,
}: FiltroConSugerenciasProps) {
  const [texto, setTexto] = useState(valorAplicado);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTexto(valorAplicado);
  }, [valorAplicado]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const sugerencias = useMemo((): SugerenciaFiltro[] => {
    const term = texto.trim().toLowerCase();
    if (!term) return [];

    if (modoNombre) {
      const vistos = new Set<string>();
      const resultado: SugerenciaFiltro[] = [];
      for (const f of filas) {
        if (f.tipo !== 'empleado' || !f.nombre.toLowerCase().includes(term)) continue;
        if (vistos.has(f.id)) continue;
        vistos.add(f.id);
        resultado.push({ key: f.id, nombre: f.nombre, detalle: f.rutaDependencia });
        if (resultado.length >= 8) break;
      }
      return resultado;
    }

    const vistos = new Set<string>();
    const resultado: SugerenciaFiltro[] = [];
    for (const f of filas) {
      if (f.tipo !== 'dependencia' || !f.nombre.toLowerCase().includes(term)) continue;
      if (vistos.has(f.id)) continue;
      vistos.add(f.id);
      resultado.push({
        key: f.id,
        nombre: f.nombre,
        detalle: f.prefix && f.prefix !== '—' ? f.prefix : undefined,
      });
      if (resultado.length >= 8) break;
    }
    return resultado;
  }, [texto, modoNombre, filas]);

  const handleChange = (valor: string) => {
    setTexto(valor);
    setAbierto(!!valor.trim());
    if (!valor.trim()) {
      onSeleccionChange?.(null);
      onLimpiar();
    }
  };

  const handleSelect = (nombre: string) => {
    setTexto(nombre);
    setAbierto(false);
    if (autoAplicar) {
      if (modoNombre) onSeleccionarNombre(nombre);
      else onSeleccionarDep(nombre);
    } else {
      onSeleccionChange?.(nombre);
    }
  };

  const handleModoChange = (valor: string) => {
    onModoChange(valor === 'nombre');
    setTexto('');
    setAbierto(false);
    onSeleccionChange?.(null);
    onLimpiar();
  };

  const Icono = modoNombre ? User : Building2;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 w-full md:flex-row md:flex-1 md:min-w-0 md:max-w-xl md:items-center',
        className
      )}
    >
      <Select
        value={modoNombre ? 'nombre' : 'departamento'}
        onValueChange={handleModoChange}
      >
        <SelectTrigger className={SELECT_FILTRO}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="departamento">Departamento</SelectItem>
          <SelectItem value="nombre">Nombre</SelectItem>
        </SelectContent>
      </Select>

      <div ref={contenedorRef} className="relative w-full md:flex-1 min-w-0">
        <Icono size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={modoNombre ? 'Buscar persona...' : 'Buscar departamento...'}
          value={texto}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => texto.trim() && setAbierto(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && sugerencias.length > 0) {
              e.preventDefault();
              handleSelect(sugerencias[0].nombre);
            }
          }}
          className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200"
        />
        {texto && (
          <button
            type="button"
            onClick={() => handleChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Limpiar filtro"
          >
            <X size={14} />
          </button>
        )}

        {abierto && texto.trim() && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden">
            {sugerencias.length > 0 ? (
              <ul className="max-h-56 overflow-y-auto py-1">
                {sugerencias.map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => handleSelect(s.nombre)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span className="block text-sm font-medium text-slate-800 dark:text-gray-100 truncate">
                        {s.nombre}
                      </span>
                      {s.detalle && (
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {s.detalle}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                Sin coincidencias
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
