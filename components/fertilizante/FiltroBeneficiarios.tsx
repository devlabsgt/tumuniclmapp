'use client';

import { Input } from '@/components/ui/input';

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';

interface Props {
  filtros: {
    campo: CampoFiltro;
    valor: string;
    lugar: string;
  };
  setFiltros: (filtros: { campo: CampoFiltro; valor: string; lugar: string }) => void;
}

export function FiltroBeneficiarios({ filtros, setFiltros }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  const lugares = [
    'Agua Caliente', 'Aguajal', 'Alambrados', 'Anonas', 'Anguiatú', 'Apantes',
    'Cabildo', 'Cañada', 'Casco Urbano', 'Caserío Los Planes', 'Conacastes', 'Cruz Calle',
    'Dolores', 'El Capulín', 'El Jícaro', 'El Límite', 'El Obispo', 'El Obraje',
    'El Pinal', 'El Pinito', 'Guacamayas', 'Hornito', 'La Ermita', 'La Leona',
    'La Loma', 'La Quesera', 'Las Burras', 'Limones', 'Liquidámbar', 'Monte Barroso',
    'Puebnlo Nuevo', 'Platanar', 'Rodeíto', 'Rodeo El Espino', 'Rodeo Las Lajas',
    'Roble Gacho', 'Sacramento', 'San Antonio', 'San José', 'San Vicente',
    'Santa Anita', 'Socorro', 'Tisizón', 'Valeriano', 'Valle Arriba'
  ].sort();

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex gap-2 items-center flex-1">

        <span className="text-sm font-medium text-gray-700 whitespace-nowrap font-semibold">Buscar por:</span>

        <select
          name="campo"
          value={filtros.campo}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="nombre_completo">Nombre</option>
          <option value="dpi">DPI</option>
          <option value="codigo">Formulario</option>
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
        {lugares.map((lugar) => (
          <option key={lugar} value={lugar}>{lugar}</option>
        ))}
      </select>
    </div>
  );
}
