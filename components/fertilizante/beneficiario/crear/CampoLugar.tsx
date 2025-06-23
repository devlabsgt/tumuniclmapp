'use client';

import { useEffect, useState } from 'react';
import { obtenerLugares } from '@/lib/obtenerLugares';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function CampoLugar({ value, onChange }: Props) {
  const [lugares, setLugares] = useState<string[]>([]);

  useEffect(() => {
    const cargarLugares = async () => {
      const lista = await obtenerLugares();
      setLugares(lista);
    };
    cargarLugares();
  }, []);

  return (
    <div>
      <label className="font-semibold block mb-1">Lugar</label>
      <select
        name="lugar"
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded px-3 py-2"
        required
      >
        <option value="">Seleccione un lugar...</option>
        {lugares.map((lugar) => (
          <option key={lugar} value={lugar}>
            {lugar}
          </option>
        ))}
      </select>
    </div>
  );
}
