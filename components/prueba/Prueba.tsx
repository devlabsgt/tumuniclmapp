'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const afiliados = [
  {
    id: '0001',
    nombre: 'JUAN CARLOS LÓPEZ GARCÍA',
    dpi: '273733311208',
    telefono: '59998877',
    comunidad: 'Apantes',
    padron: '2451',
    activo: true,
  },
  {
    id: '0002',
    nombre: 'ANA MARÍA ROSALES PÉREZ',
    dpi: '3385820372008',
    telefono: '55667788',
    comunidad: 'Liquidámbar',
    padron: '3120',
    activo: false,
  },
  // más registros...
];

export default function Prueba() {
  const router = useRouter();

  const irAEditar = (id: string) => {
    router.push(`/editar?id=${id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lista de Afiliados</h1>
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">No.</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">DPI</th>
            <th className="p-2 border">Teléfono</th>
            <th className="p-2 border">Comunidad</th>
            <th className="p-2 border">No. Padrón</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {afiliados.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-2 border">{a.id}</td>
              <td className="p-2 border">{a.nombre}</td>
              <td className="p-2 border">{a.dpi}</td>
              <td className="p-2 border">{a.telefono}</td>
              <td className="p-2 border">{a.comunidad}</td>
              <td className="p-2 border flex items-center gap-2">
                {a.padron}
                <span
                  className={`w-3 h-3 rounded-full ${
                    a.activo ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={a.activo ? 'Activo' : 'Inactivo'}
                />
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => irAEditar(a.id)}
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
  );
}
