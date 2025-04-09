'use client';

type Empleado = {
  direccion?: string;
  telefono?: string;
  dpi?: string;
  nit?: string;
  igss?: string;
  cargo?: string;
  banco?: string;
  cuenta?: string;
  sueldo?: number;
  bonificacion?: number;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  contrato_no?: string;
  renglon?: string;
};

export function EmpleadoDatos({ empleado }: { empleado: Empleado }) {
  if (!empleado) return null;

  const formatoFecha = (fecha: string | null | undefined) =>
    fecha ? new Date(fecha).toLocaleDateString('es-GT') : '—';

  const formatoMoneda = (valor: number | null | undefined) =>
    typeof valor === 'number' ? `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full text-left border-collapse">
        <tbody>
          <Fila label="Dirección" valor={empleado.direccion ?? '—'} />
          <Fila label="Teléfono" valor={empleado.telefono ?? '—'} />
          <Fila label="DPI" valor={empleado.dpi ?? '—'} />
          <Fila label="NIT" valor={empleado.nit ?? '—'} />
          <Fila label="IGSS" valor={empleado.igss ?? '—'} />
          <Fila label="Cargo" valor={empleado.cargo ?? '—'} />
          <Fila label="Banco" valor={empleado.banco ?? '—'} />
          <Fila label="Cuenta" valor={empleado.cuenta ?? '—'} />
          <Fila label="Sueldo" valor={formatoMoneda(empleado.sueldo)} />
          <Fila label="Bonificación" valor={formatoMoneda(empleado.bonificacion)} />
          <Fila label="Fecha Inicio" valor={formatoFecha(empleado.fecha_inicio)} />
          <Fila label="Fecha Finalización" valor={formatoFecha(empleado.fecha_finalizacion)} />
          <Fila label="Contrato No." valor={empleado.contrato_no ?? '—'} />
          <Fila label="Renglón" valor={empleado.renglon ?? '—'} />
        </tbody>
      </table>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string | number }) {
  return (
    <tr className="border-b">
      <td className="p-3 font-semibold w-1/3">{label}</td>
      <td className="p-3">{valor}</td>
    </tr>
  );
}
