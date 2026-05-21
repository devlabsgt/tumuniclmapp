'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { chipClass, inputClass, labelClass } from './formStyles';

export type OpcionBuscador = {
  id: string;
  label: string;
};

type Props = {
  label: string;
  placeholder?: string;
  opciones: OpcionBuscador[];
  seleccionado: OpcionBuscador | null;
  onSeleccionar: (opcion: OpcionBuscador) => void;
  onQuitar: () => void;
  disabled?: boolean;
};

export function BuscadorOpciones({
  label,
  placeholder = 'Buscar...',
  opciones,
  seleccionado,
  onSeleccionar,
  onQuitar,
  disabled,
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [listaAbierta, setListaAbierta] = useState(false);

  const opcionesFiltradas = useMemo(() => {
    if (seleccionado || disabled) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return opciones;
    return opciones.filter((o) => o.label.toLowerCase().includes(q));
  }, [opciones, busqueda, seleccionado, disabled]);

  const abrirLista = () => {
    if (!disabled && !seleccionado) setListaAbierta(true);
  };

  const cerrarLista = () => {
    setTimeout(() => setListaAbierta(false), 150);
  };

  const mostrarLista = listaAbierta && !seleccionado && opcionesFiltradas.length > 0;

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {seleccionado ? (
        <div className={`${chipClass} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 truncate">
            {seleccionado.label}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onQuitar();
                setBusqueda('');
                setListaAbierta(false);
              }}
              className="text-[10px] font-bold text-red-600 hover:text-red-700 shrink-0"
            >
              Quitar
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setListaAbierta(true);
            }}
            onFocus={abrirLista}
            onClick={abrirLista}
            onBlur={cerrarLista}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inputClass} pl-7 pr-2`}
          />
          {mostrarLista && (
            <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
              {opcionesFiltradas.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSeleccionar(o);
                      setBusqueda('');
                      setListaAbierta(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    {o.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
