'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Building2, Package, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilaReporteInventario } from './lib/schemas';
import { cn } from '@/lib/utils';

const SELECT_FILTRO =
  'h-auto w-full sm:w-auto min-w-[10rem] gap-1.5 px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-sm focus:ring-2 focus:ring-blue-500/20';

interface SugerenciaFiltro {
  key: string;
  nombre: string;
  detalle?: string;
}

export type ModoFiltro = 'departamento' | 'nombre' | 'bien';

export interface FiltroBusquedaInventarioProps {
  modoFiltro: ModoFiltro;
  onModoChange: (modo: ModoFiltro) => void;
  filas: FilaReporteInventario[];
  valorAplicado: string;
  onSeleccionar: (valor: string) => void;
  onLimpiar: () => void;
  className?: string;
}

export function FiltroBusquedaInventario({
  modoFiltro,
  onModoChange,
  filas,
  valorAplicado,
  onSeleccionar,
  onLimpiar,
  className,
}: FiltroBusquedaInventarioProps) {
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

    const vistos = new Set<string>();
    const resultado: SugerenciaFiltro[] = [];

    for (const f of filas) {
      if (modoFiltro === 'nombre' && f.tipo === 'empleado') {
        if (f.nombre.toLowerCase().includes(term) && !vistos.has(f.id)) {
          vistos.add(f.id);
          resultado.push({ key: f.id, nombre: f.nombre, detalle: f.rutaDependencia });
        }
      } else if (modoFiltro === 'departamento' && f.tipo === 'dependencia' && !f.esPuesto) {
        if (f.nombre.toLowerCase().includes(term) && !vistos.has(f.id)) {
          vistos.add(f.id);
          resultado.push({ key: f.id, nombre: f.nombre, detalle: f.prefix && f.prefix !== '—' ? f.prefix : undefined });
        }
      } else if (modoFiltro === 'bien' && f.tipo === 'bien') {
        if ((f.nombre.toLowerCase().includes(term) || f.serie?.toLowerCase().includes(term)) && !vistos.has(f.id)) {
          vistos.add(f.id);
          resultado.push({ key: f.id, nombre: f.nombre, detalle: `Serie: ${f.serie || 'N/A'} - ${f.rutaDependencia}` });
        }
      }
      if (resultado.length >= 10) break;
    }
    return resultado;
  }, [texto, modoFiltro, filas]);

  const handleChange = (valor: string) => {
    setTexto(valor);
    setAbierto(!!valor.trim());
    if (!valor.trim()) {
      onLimpiar();
    }
  };

  const handleSelect = (sug: SugerenciaFiltro) => {
    setTexto(sug.nombre);
    setAbierto(false);
    onSeleccionar(sug.nombre);
  };

  const handleModoChange = (valor: string) => {
    onModoChange(valor as ModoFiltro);
    setTexto('');
    setAbierto(false);
    onLimpiar();
  };

  const Icono = modoFiltro === 'nombre' ? User : modoFiltro === 'bien' ? Package : Building2;

  return (
    <div className={cn('flex flex-col md:flex-row gap-2 w-full md:items-center', className)}>
      <Select value={modoFiltro} onValueChange={handleModoChange}>
        <SelectTrigger className={SELECT_FILTRO}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="departamento">Departamento</SelectItem>
          <SelectItem value="nombre">Empleado</SelectItem>
          <SelectItem value="bien">Bien (Serie/Desc)</SelectItem>
        </SelectContent>
      </Select>

      <div ref={contenedorRef} className="relative w-full md:flex-1 min-w-0">
        <Icono size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={`Buscar ${modoFiltro === 'bien' ? 'artículo...' : modoFiltro === 'nombre' ? 'persona...' : 'departamento...'}`}
          value={texto}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => texto.trim() && setAbierto(true)}
          className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-gray-200"
        />
        {texto && (
          <button
            type="button"
            onClick={() => handleChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                      onClick={() => handleSelect(s)}
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
              <div className="px-3 py-4 text-sm text-center text-slate-500">
                No se encontraron resultados
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
