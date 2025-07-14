'use client';

interface Props {
  estado: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  esEdicion?: boolean;
}

export default function CampoEstado({ estado, onChange, disabled = false, esEdicion = false }: Props) {
  const esEntregadoOExtraviado = estado === 'Entregado' || estado === 'Extraviado';
  const esAnuladoOInforme = estado === 'Anulado' || estado === 'Informe';

  return (
    <div className="flex items-center gap-4">
      <label className="text-lg font-medium">Estado:</label>
      <div className="flex gap-4 flex-wrap">
        {esEntregadoOExtraviado && (
          <>
            <label className="flex items-center gap-2 text-green-700 font-medium">
              <input
                type="radio"
                name="estado"
                value="Entregado"
                checked={estado === 'Entregado'}
                onChange={onChange}
                disabled={disabled}
                className="accent-green-600"
              />
              Entregado
            </label>

            <label className="flex items-center gap-2 text-yellow-600 font-medium">
              <input
                type="radio"
                name="estado"
                value="Extraviado"
                checked={estado === 'Extraviado'}
                onChange={onChange}
                disabled={disabled}
                className="accent-yellow-500"
              />
              Extraviado
            </label>
          </>
        )}

        {esEdicion && esAnuladoOInforme && (
          <>
            <label className="flex items-center gap-2 text-red-600 font-semibold">
              <input
                type="radio"
                name="estado"
                value="Anulado"
                checked={estado === 'Anulado'}
                onChange={onChange}
                disabled={disabled}
                className="accent-red-600"
              />
              Anulado
            </label>

            <label className="flex items-center gap-2 text-blue-600 font-semibold">
              <input
                type="radio"
                name="estado"
                value="Informe"
                checked={estado === 'Informe'}
                onChange={onChange}
                disabled={disabled}
                className="accent-blue-600"
              />
              Informe
            </label>
          </>
        )}
      </div>
    </div>
  );
}