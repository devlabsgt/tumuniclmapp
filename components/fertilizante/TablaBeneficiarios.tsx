'use client';

import { useRouter } from 'next/navigation';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
}

export function TablaBeneficiarios({ data }: { data: Beneficiario[] }) {
  const router = useRouter();

  const irAEditar = (id: string) => {
    router.push(`/protected/fertilizante/beneficiarios/editar?id=${id}`);
  };

  return (
    <div>
      {/* Resumen de total de beneficiarios */}
      <div className="mb-4 text-lg font-semibold text-green-700">
        🌱 Beneficiarios: {data.length}
      </div>

      {/* Tabla de datos */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">DPI</th>
              <th className="p-2 border">Lugar</th>
              <th className="p-2 border">Fecha</th>
              <th className="p-2 border">Código</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="p-2 border">{b.nombre_completo}</td>
                <td className="p-2 border">{b.dpi}</td>
                <td className="p-2 border">{b.lugar}</td>
                <td className="p-2 border">{new Date(b.fecha).toLocaleDateString()}</td>
                <td className="p-2 border">{b.codigo}</td>
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
