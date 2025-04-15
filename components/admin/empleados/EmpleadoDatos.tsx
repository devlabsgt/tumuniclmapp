'use client';

import { camposFormulario } from './EmpleadoCampos';

type Empleado = {
  [key: string]: any;
};

export function EmpleadoDatos({ empleado }: { empleado: Empleado }) {
  if (!empleado) return null;

  const formatoFecha = (fecha: string | null | undefined) => {
    if (!fecha) return '—';
    const partes = fecha.split('-');
    if (partes.length !== 3) return '—';
    const [año, mes, dia] = partes;
    return `${dia}/${mes}/${año}`;
  };

  const formatoMoneda = (valor: number | null | undefined) =>
    typeof valor === 'number' ? `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : '—';

  const formatearValor = (campo: any, valor: any) => {
    if (campo.name === 'salario' || campo.name === 'bonificación') {
      return formatoMoneda(valor);
    }
    if (campo.type === 'date') {
      return formatoFecha(valor);
    }
    return valor ?? '—';
  };

  return (
    <div className="overflow-x-auto border border-border rounded bg-background text-foreground">
      <table className="w-full text-left border-collapse">
        <tbody>
          {camposFormulario.map((campo) => (
            <Fila
              key={campo.name}
              label={campo.label}
              valor={formatearValor(campo, empleado[campo.name])}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string | number }) {
  return (
    <tr className="border-b border-border hover:bg-muted">
      <td className="p-3 font-semibold w-1/3">{label}</td>
      <td className="p-3">{valor}</td>
    </tr>
  );
}
