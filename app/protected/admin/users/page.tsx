'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Usuario = {
  email: string;
  nombre: string | null;
};


export default function UsersPage() {
  const supabase = createClient();
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      const { data, error } = await supabase.rpc('obtener_usuarios');

      if (error) {
            console.error('Error al obtener usuarios:', error);
        return;
      }

      setTodosLosUsuarios(data || []);
    };

    obtenerUsuarios();
  }, [supabase]);

  useEffect(() => {
    const filtrados = todosLosUsuarios.filter((u) =>
      u.email.toLowerCase().includes(busqueda.toLowerCase())
    );
    setUsuariosFiltrados(filtrados);
    setPaginaActual(1); // Reiniciar a la primera página al filtrar
  }, [busqueda, todosLosUsuarios]);

  const usuariosEnPagina = usuariosFiltrados.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Usuarios del sistema</h1>

        <div className="mb-4 flex justify-center">
        <Input
          type="text"
          placeholder="Buscar por correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <table className="min-w-full bg-white text-sm border rounded shadow">
            <thead className="bg-gray-100 text-left">
            <tr>
                <th className="p-3 border-b">Correo</th>
                <th className="p-3 border-b">Nombre</th>
            </tr>
            </thead>
            <tbody>
            {usuariosEnPagina.map((usuario, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3">{usuario.email}</td>
                <td className="p-3">{usuario.nombre || '—'}</td>
                </tr>
            ))}
            {usuariosEnPagina.length === 0 && (
                <tr>
                <td colSpan={2} className="p-3 text-center text-gray-500">
                    No hay resultados
                </td>
                </tr>
            )}
            </tbody>

      </table>

      {/* 🔽 Paginación abajo */}
    <div className="mt-4 flex justify-center items-center gap-2">
        <Button
          onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
          disabled={paginaActual === 1}
        >
          Anterior
        </Button>

        <span className="text-sm">
          Página {paginaActual} de {totalPaginas || 1}
        </span>

        <Button
          onClick={() =>
            setPaginaActual((prev) =>
              Math.min(totalPaginas, prev + 1)
            )
          }
          disabled={paginaActual === totalPaginas || totalPaginas === 0}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
