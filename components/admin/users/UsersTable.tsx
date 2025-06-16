'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

type Props = {
  usuarios: Usuario[];
};

export default function UsersTable({ usuarios }: Props) {
  const router = useRouter();
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10);
  const [rolActual, setRolActual] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerRolUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        setRolActual(data?.rol || null);
      } catch (error) {
        console.error('Error al obtener el rol del usuario:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerRolUsuario();
  }, []);

  if (cargando) {
    return <div className="text-center p-4 text-sm text-gray-500">Cargando usuarios...</div>;
  }

  const usuariosFiltrados = usuarios.filter((u) =>
    rolActual === 'SUPER' || u.rol !== 'SUPER'
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const inicio = (paginaActual - 1) * usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(inicio, inicio + usuariosPorPagina);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto border-[2.5px] border-gray-400">
        <table className="w-full border-collapse border-[2.5px] border-gray-300 text-lg">
          <thead>
            <tr className="text-left text-[15px] font-semibold bg-gray-200 border-b-[2.5px] border-gray-400">
              <th className="p-2 border-[1.5px] border-gray-300 text-center">No.</th>
              <th className="p-2 border-[1.5px] border-gray-300">Correo</th>
              <th className="p-2 border-[1.5px] border-gray-300">Nombre</th>
              <th className="p-2 border-[1.5px] border-gray-300">Rol</th>
              <th className="p-2 border-[1.5px] border-gray-300 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-muted-foreground border-[1.5px] border-gray-300">
                  No hay resultados
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((usuario, index) => (
                <tr
                  key={usuario.id}
                  className="hover:bg-gray-50 border-[1.5px] border-gray-300"
                >
                  <td className="p-2 border-[1.5px] border-gray-300 text-center">
                    {inicio + index + 1}
                  </td>
                  <td className="p-2 border-[1.5px] border-gray-300">{usuario.email}</td>
                  <td className="p-2 border-[1.5px] border-gray-300">{usuario.nombre || '—'}</td>
                  <td className="p-2 border-[1.5px] border-gray-300">{usuario.rol || '—'}</td>
                  <td className="p-2 text-center border-[1.5px] border-gray-300">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/protected/admin/users/ver?id=${usuario.id}`)}
                      className="text-blue-600 text-xs"
                    >
                      Ver Usuario
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 mb-4 gap-2 flex-wrap items-center text-sm">
        <span className="font-medium">Ver por:</span>
        <select
          value={usuariosPorPagina}
          onChange={(e) => {
            setUsuariosPorPagina(parseInt(e.target.value));
            setPaginaActual(1); // Reiniciar página al cambiar tamaño
          }}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex justify-center mt-2 mb-6 gap-2 flex-wrap">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
          className={`px-3 py-2 rounded border ${
            paginaActual === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-blue-50'
          }`}
        >
          ←
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPaginaActual(n)}
            className={`px-4 py-2 rounded border font-medium ${
              paginaActual === n ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50'
            }`}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-2 rounded border ${
            paginaActual === totalPaginas ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-blue-50'
          }`}
        >
          →
        </button>
      </div>
    </div>
  );
}
