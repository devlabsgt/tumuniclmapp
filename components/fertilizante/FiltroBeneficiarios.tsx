'use client';

import { Input } from '@/components/ui/input';
import { LUGARES } from '@/components/utils/lugares'; // ✅ Importa la constante centralizada

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';

interface Props {
  filtros: {
    campo: CampoFiltro;
    valor: string;
    lugar: string;
    anio: string;
  };
  setFiltros: (filtros: {
    campo: CampoFiltro;
    valor: string;
    lugar: string;
    anio: string;
  }) => void;
  anios: string[];
}

export function FiltroBeneficiarios({ filtros, setFiltros, anios }: Props) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
      <div className="flex gap-2 items-center flex-1">
        <span className="text-sm text-gray-700 whitespace-nowrap font-semibold">Buscar por:</span>
        <select
          name="campo"
          value={filtros.campo}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="nombre_completo">Nombre</option>
          <option value="dpi">DPI</option>
          <option value="codigo">Folio</option>
        </select>

        <Input
          name="valor"
          value={filtros.valor}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <select
        name="lugar"
        value={filtros.lugar}
        onChange={handleChange}
        className="border border-gray-300 rounded px-3 py-2"
      >
        <option value="">Todos los lugares</option>
        {LUGARES.map((lugar) => (
          <option key={lugar} value={lugar}>{lugar}</option>
        ))}
      </select>

      <select
        name="anio"
        value={filtros.anio}
        onChange={handleChange}
        className="border border-gray-300 rounded px-3 py-2"
      >
        {anios.map((anio) => (
          <option key={anio} value={anio}>{anio}</option>
        ))}
      </select>
    </div>
  );
}
