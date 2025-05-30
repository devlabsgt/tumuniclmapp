'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  fecha_nacimiento?: string;
  codigo: string;
  telefono?: string;
  sexo?: string;
  cantidad?: number; // ✅ NUEVO CAMPO
}

interface ResumenBeneficiarios {
  total: number;
  hombres: number;
  mujeres: number;
}

export function TablaBeneficiarios({ 
  data, 
  resumen,
  isLoading
}: { 
  data: Beneficiario[]; 
  resumen: ResumenBeneficiarios;
  isLoading: boolean;
}) {
  const router = useRouter();

  const irAEditar = (id: string) => {
    router.push(`/protected/fertilizante/beneficiarios/editar?id=${id}`);
  };

  const mostrar = (valor?: string | number) =>
    valor !== undefined && valor !== null && valor.toString().trim() !== ''
      ? valor
      : 'N/A';

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return 'N/A';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad.toString();
  };

  const formatearFecha = (iso?: string) => {
    if (!iso) return 'N/A';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  };

  return (
    <div>
      {isLoading && (
        <div className="text-center text-gray-600 font-semibold text-sm mb-4 animate-pulse" />
      )}

<div className="w-full overflow-x-auto max-w-full border-[2.5px] border-gray-400">
      <table className="w-full border-collapse text-xs border-[2.5px] border-gray-300">
        <thead>
          <tr className="text-left text-[13px] font-semibold bg-gray-200 ">
            <th colSpan={4} className="p-2 border-b-[2.5px] border-r-[2.5px] border-gray-400 text-center ">Datos de entrega</th>
            <th colSpan={7} className="p-2 border-b-[2.5px] border-gray-400 text-center">Datos del beneficiario</th>
          </tr>

          <tr className="bg-gray-100 text-left border-b-[2.5px] border-gray-400">
            <th className="p-2 border-[1.5px] border-gray-300">Folio</th>
            <th className="p-2 border-[1.5px] border-gray-300">Lugar</th>
            <th className="p-2 border-[1.5px] border-gray-300">Fecha</th>
            <th className="p-2  border-r-[2.5px] border-gray-400">Ctd.</th>
            <th className="p-2 border-[1.5px] border-gray-300 min-w-[160px]">Nombre</th>
            <th className="p-2 border-[1.5px] border-gray-300">DPI</th>
            <th className="p-2 border-[1.5px] border-gray-300">Teléfono</th>
            <th className="p-2 border-[1.5px] border-gray-300">Nacimiento</th>
            <th className="p-2 border-[1.5px] border-gray-300">Edad</th>
            <th className="p-2 border-r-[2.5px] border-gray-400">Sexo</th>
            <th className="p-2 border-[1.5px] border-gray-300">Acciones</th>
          </tr>
        </thead>


      <tbody>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse bg-gray-50 border-[1.5px] border-gray-300">
                {Array.from({ length: 11 }).map((_, j) => (
                  <td key={j} className="p-2 border-[1.5px] border-gray-300">
                    <div className="h-4 bg-gray-400 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          : data.map((b) => (
              <tr key={b.id} className="hover:bg-green-50 bg-white border-[2.5px] border-gray-300">
                <td className="p-2 border-[1.5px] text-center border-gray-300">{mostrar(b.codigo)}</td>
                <td className="p-2 border-[1.5px] border-gray-300">{mostrar(b.lugar)}</td>
                <td className="p-2 border-[1.5px] border-gray-300">{formatearFecha(b.fecha)}</td>
                <td className="p-2 border-r-[2.5px] border-r-gray-400 text-center">{mostrar(b.cantidad)}</td>
                <td className="p-2 border-[1.5px] border-gray-300">{mostrar(b.nombre_completo)}</td>
                <td className="p-2 border-[1.5px] border-gray-300">{mostrar(b.dpi)}</td>
                <td className="p-2 border-[1.5px] border-gray-300">{mostrar(b.telefono)}</td>
                <td className="p-2 border-[1.5px] border-gray-300">{formatearFecha(b.fecha_nacimiento)}</td>
                <td className="p-2 border-[1.5px] text-center border-gray-300">{calcularEdad(b.fecha_nacimiento)}</td>
                <td className="p-2 border-r-[2.5px] text-center border-gray-400">{mostrar(b.sexo)}</td>
                <td className="p-2 border-[1.5px] border-gray-300 text-center">
  

                  <Button
                    variant="ghost"
                      onClick={() => irAEditar(b.id)}
                      className="text-blue-600 text-xs"
                  >
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
      </tbody>

        </table>
      </div>
    </div>
  );
}
