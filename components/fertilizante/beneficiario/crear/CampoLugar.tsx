'use client';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const lugares = [
  'Apantes', 'Liquidámbar', 'Rodeo El Espino', 'Dolores', 'Sacramento', 'Platanar',
  'Caserío Los Planes', 'El Jícaro', 'La Loma', 'Monte Barroso', 'Agua Caliente',
  'Roble Gacho', 'El Pinal', 'San Vicente', 'Guacamayas', 'La Ermita', 'Conacastes',
  'Cañada', 'Santa Anita', 'Valeriano', 'Alambrados', 'Anguiatú', 'Las Burras',
  'El Pinito', 'La Leona', 'Limones', 'Cruz Calle', 'Cabildo', 'El Obraje', 'San Antonio',
  'La Quesera', 'Rodeo Las Lajas', 'Tisizón', 'Hornito', 'Anonas', 'Socorro', 'Aguajal',
  'San José', 'Valle Arriba', 'El Capulín', 'Rodeíto', 'El Límite', 'El Obispo',
  'Puebnlo Nuevo', 'Casco Urbano',
];

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
        {lugares.map((lugar) => (
          <option key={lugar} value={lugar}>
            {lugar}
          </option>
        ))}
      </select>
    </div>
  );
}
