'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { camposFormulario } from './EmpleadoCampos';

export function EmpleadoForm({
  formulario,
  handleChange,
}: {
  formulario: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  return (
    <>
      {camposFormulario.map((campo) => (
        <div key={campo.name}>
          <Label htmlFor={campo.name}>{campo.label}</Label>

          {campo.options ? (
            <select
              id={campo.name}
              name={campo.name}
              value={formulario[campo.name] || ''}
              onChange={handleChange}
              className="mt-1 block w-full border rounded px-3 py-2"
              required
            >
              <option value="">Seleccione una opción</option>
              {campo.options.map((opcion: string) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          ) : (
            <Input
              type={campo.type === 'date' ? 'date' : 'text'}
              id={campo.name}
              name={campo.name}
              value={formulario[campo.name] || ''}
              onChange={handleChange}
              className="mt-1"
              required={campo.name !== 'fecha_fin'} // Fecha fin puede ser opcional
            />
          )}
        </div>
      ))}
    </>
  );
}
