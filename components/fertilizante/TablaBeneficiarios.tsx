'use client';

import { useRouter } from 'next/navigation';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
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

  return (
    <div>
      {/* Resumen de beneficiarios */}
      <div className="mb-4 text-green-700">
        <div className="text-lg font-bold">
          🌾 Beneficiarios: <span className="text-green-800">{resumen.total}</span> <br/>
          👨‍🌾 Hombres: <span className="text-green-700 font-semibold">{resumen.hombres}</span> | 
          👩‍🌾 Mujeres: <span className="text-green-700 font-semibold">{resumen.mujeres}</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="w-full overflow-x-auto max-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Folio</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">DPI</th>
              <th className="p-2 border">Lugar</th>
              <th className="p-2 min-w-[140px] border">Fecha</th>
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
                <td className="p-2 border">{b.fecha || 'N/A'}</td> 
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
