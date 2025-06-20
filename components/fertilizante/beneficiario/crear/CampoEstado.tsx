'use client';

interface Props {
  estado: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  esEdicion?: boolean;
}

export default function CampoEstado({ estado, onChange, esEdicion = false }: Props) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-lg font-medium">Estado:</label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="estado"
            value="Entregado"
            checked={estado === 'Entregado'}
            onChange={onChange}
            className="accent-green-600"
          />
          Entregado
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="estado"
            value="Extraviado"
            checked={estado === 'Extraviado'}
            onChange={onChange}
            className="accent-yellow-500"
          />
          Extraviado
        </label>

        {esEdicion && (
          <label className="flex items-center gap-2 text-red-600 font-semibold">
            <input
              type="radio"
              name="estado"
              value="Anulado"
              checked={estado === 'Anulado'}
              onChange={onChange}
              className="accent-red-600"
            />
            Anulado
          </label>
        )}
      </div>
    </div>
  );
}
