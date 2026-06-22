'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Building2, Package, X, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ItemInventario } from './lib/schemas';

const SELECT_FILTRO =
  'h-auto w-full sm:w-auto min-w-[10rem] gap-1.5 px-3 py-2.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-sm focus:ring-2 focus:ring-blue-500/20';

export type ModoFiltroLista = 'todos' | 'departamento' | 'nombre' | 'bien';

export interface FiltroBusquedaListaProps {
  modoFiltro: ModoFiltroLista;
  onModoChange: (modo: ModoFiltroLista) => void;
  valorAplicado: string;
  onCambioTexto: (valor: string) => void;
  items: ItemInventario[];
  dependencias?: any[];
  usuarios?: any[];
  className?: string;
}

interface SugerenciaFiltro {
  key: string;
  nombre: string;
  detalle?: string;
}

export function FiltroBusquedaLista({
  modoFiltro,
  onModoChange,
  valorAplicado,
  onCambioTexto,
  items,
  dependencias = [],
  usuarios = [],
  className,
}: FiltroBusquedaListaProps) {
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

    // Buscar en empleados (usuarios basicos)
    if (modoFiltro === 'nombre' || modoFiltro === 'todos') {
      for (const u of usuarios) {
        if (u.nombre && u.nombre.toLowerCase().includes(term) && !vistos.has(u.nombre)) {
          vistos.add(u.nombre);
          resultado.push({ key: `emp-${u.nombre}`, nombre: u.nombre, detalle: 'Empleado' });
        }
        if (resultado.length >= 10) break;
      }
    }

    // Buscar en departamentos
    if (modoFiltro === 'departamento' || modoFiltro === 'todos') {
      for (const d of dependencias) {
        // Ignorar si es puesto
        if (!d.es_puesto && d.nombre && d.nombre.toLowerCase().includes(term) && !vistos.has(d.nombre)) {
          vistos.add(d.nombre);
          resultado.push({ key: `dep-${d.nombre}`, nombre: d.nombre, detalle: 'Departamento' });
        }
        if (resultado.length >= 10) break;
      }
    }

    // Buscar en bienes (usar la lista de items activos/inactivos actual)
    if (modoFiltro === 'bien' || modoFiltro === 'todos') {
      for (const item of items) {
        if ((item.descripcion.toLowerCase().includes(term) || item.serie?.toLowerCase().includes(term)) && !vistos.has(item.id)) {
          vistos.add(item.id);
          resultado.push({ key: `bien-${item.id}`, nombre: item.descripcion, detalle: `Serie: ${item.serie || 'N/A'}` });
        }
        if (resultado.length >= 10) break;
      }
    }

    return resultado;
  }, [texto, modoFiltro, items, dependencias, usuarios]);

  const handleChange = (valor: string) => {
    setTexto(valor);
    setAbierto(!!valor.trim());
    onCambioTexto(valor);
  };

  const handleSelect = (sug: SugerenciaFiltro) => {
    setTexto(sug.nombre);
    setAbierto(false);
    onCambioTexto(sug.nombre);
  };

  const handleModoChange = (valor: string) => {
    onModoChange(valor as ModoFiltroLista);
    setTexto('');
    setAbierto(false);
    onCambioTexto('');
  };

  const Icono = modoFiltro === 'nombre' ? User : modoFiltro === 'bien' ? Package : modoFiltro === 'departamento' ? Building2 : Search;

  return (
    <div className={cn('flex flex-col md:flex-row gap-2 w-full md:items-center', className)}>
      <Select value={modoFiltro} onValueChange={handleModoChange}>
        <SelectTrigger className={SELECT_FILTRO}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="departamento">Departamento</SelectItem>
          <SelectItem value="nombre">Empleado</SelectItem>
          <SelectItem value="bien">Bien (Serie/Desc)</SelectItem>
        </SelectContent>
      </Select>

      <div ref={contenedorRef} className="relative w-full md:flex-1 min-w-0">
        <Icono size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={`Buscar ${modoFiltro === 'bien' ? 'artículo...' : modoFiltro === 'nombre' ? 'persona...' : modoFiltro === 'departamento' ? 'departamento...' : 'en todo...'}`}
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
