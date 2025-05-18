'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import UsersTable from '@/components/admin/users/UsersTable';
import SearchBar from '@/components/admin/users/SearchBar';
import Pagination from '@/components/admin/users/Pagination';
import { Usuario } from '@/components/admin/users/types';

export default function UsersPage() {
  const supabase = createClient();
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [campoBusqueda, setCampoBusqueda] = useState<'nombre' | 'email'>('email');
  const [rolFiltro, setRolFiltro] = useState<'todos' | 'admin' | 'usuario'>('todos');
  const [orden, setOrden] = useState<'alfabetico' | 'creacion'>('alfabetico');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;
  const router = useRouter();

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      const { data, error } = await supabase.rpc('obtener_usuarios');
      if (error) {
        console.error('Error al obtener usuarios:', error);
        return;
      }
          console.log('🚨 usuarios raw:', data); // 👈 AÑADIR ESTO

      setTodosLosUsuarios(data || []);
    };
    obtenerUsuarios();
  }, [supabase]);

  useEffect(() => {
    let filtrados = todosLosUsuarios.filter((u) =>
      u[campoBusqueda]?.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (rolFiltro !== 'todos') {
      filtrados = filtrados.filter((u) => u.rol === rolFiltro);
    }

    if (orden === 'alfabetico') {
      filtrados = [...filtrados].sort((a, b) => {
        const nombreA = a.nombre?.toLowerCase() || '';
        const nombreB = b.nombre?.toLowerCase() || '';
        return nombreA.localeCompare(nombreB);
      });
    }

    setUsuariosFiltrados(filtrados);
    setPaginaActual(1);
  }, [busqueda, campoBusqueda, rolFiltro, orden, todosLosUsuarios]);

  const usuariosEnPagina = usuariosFiltrados.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  return (
    <div className="px-6">
         <Button
          variant="ghost"
          onClick={() => router.push("/protected/admin/")}
          className="text-blue-600 text-base underline"
        >
          Volver
        </Button>

      <div className="flex items-center justify-between mb-4">


        <h1 className="text-2xl font-bold">Usuarios del sistema</h1>
        <Link href="/protected/admin/sign-up">
          <Button>Crear Usuario</Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <SearchBar
          valor={busqueda}
          campo={campoBusqueda}
          onBuscar={setBusqueda}
          onCambiarCampo={setCampoBusqueda}
        />
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <label htmlFor="rol" className="text-sm font-medium">Rol:</label>
            <select
              id="rol"
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value as 'todos' | 'admin' | 'usuario')}
              className="border rounded px-2 py-1"
            >
              <option value="todos">Todos</option>
              <option value="Admin">Admin</option>
              <option value="Usuario">Usuario</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label htmlFor="orden" className="text-sm font-medium">Ordenar:</label>
            <select
              id="orden"
              value={orden}
              onChange={(e) => setOrden(e.target.value as 'alfabetico' | 'creacion')}
              className="border rounded px-2 py-1"
            >
              <option value="alfabetico">Alfabéticamente</option>
              <option value="creacion">Creación</option>
            </select>
          </div>
        </div>
      </div>

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
