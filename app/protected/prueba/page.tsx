'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const afiliados = [
  { nombre: 'JUAN CARLOS LÓPEZ GARCÍA', dpi: '273733311208', telefono: '59998877', comunidad: 'Apantes', padron: '2451', activo: true },
  { nombre: 'ANA MARÍA ROSALES PÉREZ', dpi: '3385820372008', telefono: '55667788', comunidad: 'Liquidámbar', padron: '3120', activo: false },
  { nombre: 'CÉSAR ENRIQUE RAMOS', dpi: '1887721032008', telefono: '47712345', comunidad: 'Dolores', padron: '1901', activo: true },
  { nombre: 'MARCELA ZÚÑIGA REYES', dpi: '190600420108', telefono: '44455666', comunidad: 'Apantes', padron: '4210', activo: true },
  { nombre: 'FELIPE GUTIÉRREZ MARTÍNEZ', dpi: '1874528602008', telefono: '44556677', comunidad: 'Dolores', padron: '3124', activo: false },
  { nombre: 'LUIS ALFREDO PÉREZ', dpi: '1234567890123', telefono: '55001122', comunidad: 'Apantes', padron: '1999', activo: true },
  { nombre: 'KAREN LÓPEZ MENÉNDEZ', dpi: '2345678901234', telefono: '66002233', comunidad: 'Liquidámbar', padron: '2122', activo: false },
  { nombre: 'OSCAR GONZÁLEZ MORALES', dpi: '3456789012345', telefono: '77003344', comunidad: 'Dolores', padron: '1888', activo: true },
  { nombre: 'JULIA MENDOZA CASTILLO', dpi: '4567890123456', telefono: '88004455', comunidad: 'Apantes', padron: '3001', activo: true },
  { nombre: 'PEDRO ALVARADO JIMÉNEZ', dpi: '5678901234567', telefono: '99005566', comunidad: 'Liquidámbar', padron: '2202', activo: false },
  { nombre: 'MARÍA MARTÍNEZ LÓPEZ', dpi: '6789012345678', telefono: '50112233', comunidad: 'Dolores', padron: '4110', activo: true },
  { nombre: 'RICARDO DÍAZ FERNÁNDEZ', dpi: '7890123456789', telefono: '60223344', comunidad: 'Apantes', padron: '3111', activo: true },
  { nombre: 'ANA GABRIELA ORTIZ', dpi: '8901234567890', telefono: '70334455', comunidad: 'Liquidámbar', padron: '1222', activo: false },
  { nombre: 'JORGE ENRIQUE LEIVA', dpi: '9012345678901', telefono: '80445566', comunidad: 'Dolores', padron: '1777', activo: true },
  { nombre: 'VICTORIA GÓMEZ', dpi: '6678901234567', telefono: '56789012', comunidad: 'Dolores', padron: '3112', activo: false },
];

export default function ListaAfiliados() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<'nombre' | 'padron'>('nombre');

  const totalAfiliados = 20;
  const entregados = afiliados.length;
  const porcentaje = ((entregados / totalAfiliados) * 100).toFixed(2);

  const filtrados = afiliados
    .filter((a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      if (orden === 'padron') return a.padron.localeCompare(b.padron);
      return a.nombre.localeCompare(b.nombre);
    });

  return (
    <div className="p-6">
      <a href="#" className="text-blue-600 text-sm underline">Volver</a>
      <h1 className="text-2xl font-bold mb-4">Lista de Afiliados</h1>

      <div className="flex justify-between mb-4">
        <Button>Generar Reporte PDF</Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Nuevo Afiliado</Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium">Buscar por:</label>
        <input
          type="text"
          placeholder="Nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        />

        <label className="text-sm font-medium">Ordenar por:</label>
        <select
          className="border px-2 py-1 rounded text-sm"
          value={orden}
          onChange={(e) => setOrden(e.target.value as 'nombre' | 'padron')}
        >
          <option value="nombre">Nombre (A-Z)</option>
          <option value="padron">No. Padrón (ascendente)</option>
        </select>
      </div>

      <div className="mb-4">
        <p className="font-semibold text-green-700">
          Afiliados activos: {entregados} / {totalAfiliados} ({porcentaje}%)
        </p>
        <div className="w-full h-3 bg-gray-200 rounded-full mt-1">
          <div
            className="h-3 bg-green-500 rounded-full"
            style={{ width: `${porcentaje}%` }}
          ></div>
        </div>
      </div>

      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100">
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
          {filtrados.map((a, index) => (
            <tr key={index} className="border-t">
              <td className="p-2 border">{index + 1}</td>
              <td className="p-2 border">{a.nombre}</td>
              <td className="p-2 border">{a.dpi}</td>
              <td className="p-2 border">{a.telefono}</td>
              <td className="p-2 border">{a.comunidad}</td>
              <td className="p-2 border flex items-center gap-2">
                {a.padron}
                <span
                  className={`w-3 h-3 rounded-full ${a.activo ? 'bg-green-500' : 'bg-red-500'}`}
                  title={a.activo ? 'Activo' : 'Inactivo'}
                />
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => alert(`Editar afiliado ${a.nombre}`)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">Ver por: <select className="border p-1 rounded ml-2"><option>20</option></select></span>
        <div className="flex gap-2 text-sm">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              className={`px-3 py-1 border rounded ${i === 0 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
            >
              {i + 1}
            </button>
          ))}
          <button className="px-3 py-1 border rounded bg-white text-blue-600">→</button>
        </div>
      </div>
    </div>
  );
}
