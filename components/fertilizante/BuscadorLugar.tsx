'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { chipClass, inputClass, inputErrorClass, labelClass } from './formStyles';

type Props = {
  value: string;
  onChange: (lugar: string) => void;
  lugares: string[];
  error?: string;
  disabled?: boolean;
};

export function BuscadorLugar({ value, onChange, lugares, error, disabled }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [listaAbierta, setListaAbierta] = useState(false);

  const lugaresFiltrados = useMemo(() => {
    if (value || disabled) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter((l) => l.toLowerCase().includes(q));
  }, [lugares, busqueda, value, disabled]);

  const abrirLista = () => {
    if (!disabled && !value) setListaAbierta(true);
  };

  const cerrarLista = () => {
    setTimeout(() => setListaAbierta(false), 150);
  };

  const mostrarLista = listaAbierta && !value && lugaresFiltrados.length > 0;

  return (
    <div>
      <label className={labelClass}>
        Lugar
        {error && <span className="text-red-500 normal-case tracking-normal ml-1">{error}</span>}
      </label>
      {value ? (
        <div className={`${chipClass} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 truncate">{value}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
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
            placeholder="Buscar lugar..."
            disabled={disabled}
            className={`${inputClass} pl-7 pr-2 ${error ? inputErrorClass : ''}`}
          />
          {mostrarLista && (
            <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
              {lugaresFiltrados.map((l) => (
                <li key={l}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(l);
                      setBusqueda('');
                      setListaAbierta(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    {l}
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
