'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { obtenerLugares } from '@/lib/obtenerLugares';

type CampoFiltro = 'codigo' | 'dpi' | 'nombre_completo' | 'rango_folio';

interface Props {
  filtros: {
    campo: CampoFiltro;
    valor: string;
    valorFin?: string;
    lugar: string;
    anio: string;
    sinImagen: boolean;
  };
  setFiltros: (filtros: any) => void;
  anios: string[];
}

export function FiltroBeneficiarios({ filtros, setFiltros, anios }: Props) {
  const [lugares, setLugares] = useState<string[]>([]);
  const supabase = createClient();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  const handleBlurRango = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value && /^\d+$/.test(value) && value.length < 4) {
      setFiltros({ ...filtros, [name]: value.padStart(4, '0') });
    }
  };

  useEffect(() => {
    const cargarLugares = async () => {
    obtenerLugares().then(setLugares);
    };

    cargarLugares();
  }, []);

  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
      <div className="flex gap-2 items-center flex-1">
        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap font-semibold">Buscar por:</span>
        <select
          name="campo"
          value={filtros.campo}
          onChange={handleChange}
          className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 rounded px-3 py-2"
        >
          <option value="codigo">Folio</option>
          <option value="rango_folio">Rango de folios</option>
          <option value="nombre_completo">Nombre</option>
          <option value="dpi">DPI</option>
        </select>

        {filtros.campo === 'rango_folio' ? (
          <div className="flex w-full gap-2 items-center">
            <Input
              name="valor"
              placeholder="Inicio"
              value={filtros.valor}
              onChange={handleChange}
              onBlur={handleBlurRango}
              className="w-full dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200"
            />
            <span className="text-gray-500">-</span>
            <Input
              name="valorFin"
              placeholder="Fin"
              value={filtros.valorFin || ''}
              onChange={handleChange}
              onBlur={handleBlurRango}
              className="w-full dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200"
            />
          </div>
        ) : (
          <Input
            name="valor"
            value={filtros.valor}
            onChange={handleChange}
            className="w-full dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200"
          />
        )}
      </div>

      <select
        name="lugar"
        value={filtros.lugar}
        onChange={handleChange}
        className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 rounded px-3 py-2"
      >
        <option value="">Todos los lugares</option>
        {lugares.map((lugar) => (
          <option key={lugar} value={lugar}>{lugar}</option>
        ))}
      </select>

      <select
        name="anio"
        value={filtros.anio}
        onChange={handleChange}
        className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 rounded px-3 py-2"
      >
        {anios.map((anio) => (
          <option key={anio} value={anio}>{anio}</option>
        ))}
      </select>
    </div>
  );
}
