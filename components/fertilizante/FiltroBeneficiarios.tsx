'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { obtenerLugares } from '@/lib/obtenerLugares';

type CampoFiltro = 'codigo' | 'dpi' | 'nombre_completo' ;

interface Props {
  filtros: {
    campo: CampoFiltro;
    valor: string;
    lugar: string;
    anio: string;
    sinImagen: boolean;
  };
  setFiltros: (filtros: {
    campo: CampoFiltro;
    valor: string;
    lugar: string;
    anio: string;
    sinImagen: boolean;
  }) => void;
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
          <option value="nombre_completo">Nombre</option>
          <option value="dpi">DPI</option>
        </select>

        <Input
          name="valor"
          value={filtros.valor}
          onChange={handleChange}
          className="w-full dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200"
        />
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
