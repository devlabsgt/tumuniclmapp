'use client';

import { Input } from '@/components/ui/input';

interface Props {
  filtros: {
    nombre: string;
    dpi: string;
    lugar: string;
  };
  setFiltros: (filtros: { nombre: string; dpi: string; lugar: string }) => void;
}

export function FiltroBeneficiarios({ filtros, setFiltros }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <Input
        name="nombre"
        value={filtros.nombre}
        onChange={handleChange}
        placeholder="Buscar por nombre"
      />
      <Input
        name="dpi"
        value={filtros.dpi}
        onChange={handleChange}
        placeholder="Buscar por DPI"
      />
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
