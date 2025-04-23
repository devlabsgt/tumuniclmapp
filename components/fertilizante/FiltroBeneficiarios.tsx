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

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex gap-2 items-center flex-1">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Buscar por: </span>
        <select
          name="campo"
          value={filtros.campo}
          onChange={handleChange}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="nombre_completo">Nombre</option>
          <option value="dpi">DPI</option>
          <option value="codigo">Código</option>
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
        {[
          'Apantes', 'Liquidámbar', 'Rodeo El Espino', 'Dolores', 'Sacramento', 'Platanar',
          'Caserío Los Planes', 'El Jícaro', 'La Loma', 'Monte Barroso', 'Agua Caliente',
          'Roble Gacho', 'El Pinal', 'San Vicente', 'Guacamayas', 'La Ermita', 'Conacastes',
          'Cañada', 'Santa Anita', 'Valeriano', 'Alambrados', 'Anguiatú', 'Las Burras',
          'El Pinito', 'La Leona', 'Limones', 'Cruz Calle', 'Cabildo', 'El Obraje',
          'San Antonio', 'La Quesera', 'Rodeo Las Lajas', 'Tisizón', 'Hornito', 'Anonas',
          'Socorro', 'Aguajal', 'San José', 'Valle Arriba', 'El Capulín', 'Rodeíto',
          'El Límite', 'El Obispo', 'Puebnlo Nuevo', 'Casco Urbano'
        ].map((lugar) => (
          <option key={lugar} value={lugar}>{lugar}</option>
        ))}
      </select>
    </div>
  );
}
