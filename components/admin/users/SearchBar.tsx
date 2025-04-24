'use client';

import { Input } from '@/components/ui/input';

type Props = {
  valor: string;
  campo: 'nombre' | 'email';
  onBuscar: (valor: string) => void;
  onCambiarCampo: (campo: 'nombre' | 'email') => void;
};

export default function SearchBar({ valor, campo, onBuscar, onCambiarCampo }: Props) {
  return (
    <div className="mb-4 flex flex-col md:flex-row items-center gap-4 justify-center">
      <div className="flex gap-2 items-center">
        <label htmlFor="campo" className="text-sm font-medium">Buscar por:</label>
        <select
          id="campo"
          value={campo}
          onChange={(e) => onCambiarCampo(e.target.value as 'nombre' | 'email')}
          className="border rounded px-2 py-1"
        >
          <option value="email">Correo</option>
          <option value="nombre">Nombre</option>
        </select>
      </div>
      <Input
        type="text"
        placeholder={`Buscar por ${campo === 'email' ? 'correo' : 'nombre'}...`}
        value={valor}
        onChange={(e) => onBuscar(e.target.value)}
        className="w-full md:w-64"
      />
    </div>
  );
}
