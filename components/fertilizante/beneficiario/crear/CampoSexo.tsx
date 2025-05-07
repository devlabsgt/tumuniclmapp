'use client';

interface Props {
  sexo: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CampoSexo({ sexo, onChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-lg font-medium">Sexo:</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="sexo"
            value="M"
            checked={sexo === 'M'}
            onChange={onChange}
            className="accent-blue-600"
          />
          Masculino
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="sexo"
            value="F"
            checked={sexo === 'F'}
            onChange={onChange}
            className="accent-pink-500"
          />
          Femenino
        </label>
      </div>
    </div>
  );
}
