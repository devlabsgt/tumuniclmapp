'use client';

import { LUGARES } from '@/components/utils/lugares';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function CampoLugar({ value, onChange }: Props) {
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
        {LUGARES.map((lugar) => (
          <option key={lugar} value={lugar}>
            {lugar}
          </option>
        ))}
      </select>
    </div>
  );
}
