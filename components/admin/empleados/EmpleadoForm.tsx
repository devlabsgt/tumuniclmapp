'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { camposFormulario } from './EmpleadoCampos';

export function EmpleadoForm({
  formulario,
  handleChange,
}: {
  formulario: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      {camposFormulario.map((campo) => (
        <div key={campo.name}>
          <Label htmlFor={campo.name}>{campo.label}</Label>
          <Input
            type={campo.type === 'date' ? 'date' : 'text'}
            id={campo.name}
            name={campo.name}
            value={formulario[campo.name] || ''}
            onChange={handleChange}
            className="mt-1"
            required={campo.name !== 'fecha_fin'} // Fecha fin puede ser opcional
          />
        </div>
      ))}
    </>
  );
}
