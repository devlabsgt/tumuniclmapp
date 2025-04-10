'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import UsersTable from '@/components/admin/users/UsersTable';
import SearchBar from '@/components/admin/users/SearchBar';
import Pagination from '@/components/admin/users/Pagination';
import { Usuario } from '@/components/admin/users/types';

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
    setPaginaActual(1);
  }, [busqueda, todosLosUsuarios]);

  const usuariosEnPagina = usuariosFiltrados.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios del sistema</h1>
        <Link href="/protected/admin/sign-up">
          <Button>Crear Usuario</Button>
        </Link>
      </div>

      <SearchBar valor={busqueda} onBuscar={setBusqueda} />
      <div className="p-1 text-center text-gray-700">
        <span>Haz click en un usuario para ver y editar</span>
      </div>

      <UsersTable usuarios={usuariosEnPagina} />

      <Pagination
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        setPaginaActual={setPaginaActual}
      />
    </div>
  );
}