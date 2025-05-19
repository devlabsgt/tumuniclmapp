'use client';

import { useRouter } from 'next/navigation';

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
}

interface ResumenBeneficiarios {
  total: number;
  hombres: number;
  mujeres: number;
}

export function TablaBeneficiarios({ 
  data, 
  resumen 
}: { 
  data: Beneficiario[]; 
  resumen: ResumenBeneficiarios; 
}) {
  const router = useRouter();

  const irAEditar = (id: string) => {
    router.push(`/protected/fertilizante/beneficiarios/editar?id=${id}`);
  };

  const mostrar = (valor?: string) => valor?.trim() || 'N/A';

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
      {/* Tabla */}
      <div className="w-full overflow-x-auto max-w-full">
        <table className="w-full  border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Folio</th>
              <th className="p-2 min-w-[160px] border">Nombre</th>
              <th className="p-2 border">DPI</th>
              <th className="p-2 border">Lugar</th>
              <th className="p-2 border">Fecha</th>
              <th className="p-2 border">Nacimiento</th>
              <th className="p-2 border">Edad</th>
              <th className="p-2 border">Teléfono</th>
              <th className="p-2 border">Sexo</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="p-2 border">{mostrar(b.codigo)}</td>
                <td className="p-2 border">{mostrar(b.nombre_completo)}</td>
                <td className="p-2 border">{mostrar(b.dpi)}</td>
                <td className="p-2 border">{mostrar(b.lugar)}</td>
                <td className="p-2 border">{formatearFecha(b.fecha)}</td>
                <td className="p-2 border">{formatearFecha(b.fecha_nacimiento)}</td>
                <td className="p-2 border">{calcularEdad(b.fecha_nacimiento)}</td>
                <td className="p-2 border">{mostrar(b.telefono)}</td>
                <td className="p-2 border">{mostrar(b.sexo)}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => irAEditar(b.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
