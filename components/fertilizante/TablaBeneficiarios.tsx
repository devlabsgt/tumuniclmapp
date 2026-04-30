'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { Route } from 'next';
import type {TablaBeneficiariosProps} from './types';

export function TablaBeneficiarios({ 
  data, 
  isLoading,
  permisos
}: TablaBeneficiariosProps) {
  const router = useRouter();
  const irAEditar = (id: string) => {
    router.push(`/protected/fertilizante/beneficiarios/editar?id=${id}` as Route);
  };

const mostrar = (valor: string | number | null | undefined) =>
  valor !== undefined && valor !== null && valor.toString().trim() !== ''
    ? valor
    : '—';

const formatearFecha = (iso?: string | null) => {
  if (!iso || iso === 'null') return '—';
  const partes = iso.split('-');
  if (partes.length !== 3) return iso;
  const [a, m, d] = partes;
  return `${d}/${m}/${a}`;
};
const calcularEdad = (fechaNacimiento?: string | null) => {
  if (!fechaNacimiento || fechaNacimiento === 'null') return '—';
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return '—';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad.toString();
};

const formatearTimestamp = (ts?: string | null) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const anio = d.getFullYear();
  let hora = d.getHours();
  const ampm = hora >= 12 ? 'PM' : 'AM';
  hora = hora % 12;
  hora = hora ? hora : 12;
  const min = d.getMinutes().toString().padStart(2, '0');
  const horaStr = hora.toString().padStart(2, '0');
  return `${dia}/${mes}/${anio}, ${horaStr}:${min} ${ampm}`;
};
  return (
    <div>
      {isLoading && (
        <div className="text-center text-gray-600 font-semibold text-sm mb-4 animate-pulse" />
      )}

      {/* AQUÍ ESTÁ LA CORRECCIÓN:
        1. El DIV tiene el overflow y el flex-center.
        2. El DIV YA NO TIENE EL BORDE.
      */}
      <div className="w-full overflow-x-auto max-w-full flex justify-start md:justify-center">
        
        {/*
          AQUÍ ESTÁ LA OTRA PARTE:
          1. LA TABLA tiene el borde.
          2. LA TABLA NO tiene w-full.
        */}
        <table className="border-collapse text-xs border-[2.5px] border-gray-400 table-fixed min-w-[1550px]">
        
        <colgroup>
          <col style={{ width: '50px' }} />
          <col style={{ width: '150px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '350px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '50px' }} />
          <col style={{ width: '200px' }} />
          {(permisos.includes('EDITAR') || permisos.includes('TODO')) && (
            <col style={{ width: '100px' }} />
          )}
        </colgroup>

        <thead>
          <tr className="text-left text-[13px] font-semibold bg-gray-200">
            <th colSpan={5} className="p-2 border-b-[2.5px] border-r-[2.5px] border-gray-400 text-center uppercase tracking-wider">Datos de entrega</th>
            <th colSpan={6} className="p-2 border-b-[2.5px] border-r-[2.5px] border-gray-400 text-center uppercase tracking-wider text-blue-800">Datos del beneficiario</th>
            <th colSpan={(permisos.includes('EDITAR') || permisos.includes('TODO')) ? 2 : 1} className="p-2 border-b-[2.5px] border-gray-400 text-center uppercase tracking-wider text-green-800">Registros</th>
          </tr>
          <tr className="bg-gray-100 text-left border-b-[2.5px] border-gray-400 font-bold">
            <th className="p-2 border-[1.5px] border-gray-300">Folio</th>
            <th className="p-2 border-[1.5px] border-gray-300">Lugar</th>
            <th className="p-2 border-[1.5px] border-gray-300">F. Entrega</th>
            <th className="p-2 border-[1.5px] border-gray-300 text-center">Ctd.</th>
            <th className="p-2 border-r-[2.5px] border-gray-400 text-center">Estado</th>
            <th className="p-2 border-[1.5px] border-gray-300">Nombre</th>
            <th className="p-2 border-[1.5px] border-gray-300">DPI</th>
            <th className="p-2 border-[1.5px] border-gray-300">Teléfono</th>
            <th className="p-2 border-[1.5px] border-gray-300">F. Nacimiento</th>
            <th className="p-2 border-[1.5px] border-gray-300 text-center">Edad</th>
            <th className="p-2 border-r-[2.5px] border-gray-400 text-center">Sexo</th>
            <th className={`p-2 border-gray-300 ${(permisos.includes('EDITAR') || permisos.includes('TODO')) ? 'border-r-[2.5px] border-r-gray-400' : ''}`}>Usuario que registró</th>
            {(permisos.includes('EDITAR') || permisos.includes('TODO')) && (
              <th className="p-2 border-[1.5px] border-gray-300 text-center">Acciones</th>
            )}
          </tr>
        </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-gray-50 border-[1.5px] border-gray-300">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="p-2 border-[1.5px] border-gray-300">
                        <div className="h-4 bg-gray-400 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((b) => (
                  <tr key={b.id} className="hover:bg-green-50 bg-white border-[2.5px] border-gray-300">
                    <td className="pl-2 border-[1.5px] text-center border-gray-300">{mostrar(b.codigo)}</td>
                    <td className="pl-2 border-[1.5px] border-gray-300">{mostrar(b.lugar)}</td>
                    <td className="pl-2 border-[1.5px] border-gray-300">{formatearFecha(b.fecha)}</td>
                    <td className="pl-2 border-r-[1.5px] border-r-gray-400 text-center">{mostrar(b.cantidad)}</td>
                    <td className="pl-2 border-r-[2.5px] text-center border-gray-400">{mostrar(b.estado)}</td>
                    <td className="pl-2 border-[1.5px] border-gray-300">{mostrar(b.nombre_completo)}</td>
                    <td className="pl-2 border-[1.5px] border-gray-300">{mostrar(b.dpi)}</td>
                    <td className="pl-2 border-[1.5px] border-gray-300">{mostrar(b.telefono)}</td>
                    <td className="pl-2 border-[1.5px] border-gray-300">{formatearFecha(b.fecha_nacimiento)}</td>
                    <td className="pl-2 border-[1.5px] text-center border-gray-300">{calcularEdad(b.fecha_nacimiento)}</td>
                    <td className="pl-2 border-r-[2.5px] text-center border-gray-400">{mostrar(b.sexo)}</td>
                    <td className={`pl-2 border-[1.5px] border-gray-300 ${(permisos.includes('EDITAR') || permisos.includes('TODO')) ? 'border-r-[2.5px] border-r-gray-400' : ''}`}>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{mostrar(b.creado_por)}</span>
                        <span className="text-[10px] text-gray-500 italic">{formatearTimestamp(b.created_at)}</span>
                      </div>
                    </td>
                    {(permisos.includes('EDITAR') || permisos.includes('TODO')) && (
                      <td className="pl-2 border-[1.5px] border-gray-300 text-center">
                        <Button
                          variant="ghost"
                          onClick={() => irAEditar(b.id)}
                          className="text-blue-600 text-xs font-bold hover:bg-blue-50"
                        >
                          Editar
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}