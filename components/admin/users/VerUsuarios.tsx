'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import UsersTable from '@/components/admin/users/UsersTable';
import SearchBar from '@/components/admin/users/SearchBar';
import { Usuario } from '@/components/admin/users/types';
import { Plus } from 'lucide-react';

export default function VerUsuarios() {
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [campoBusqueda, setCampoBusqueda] = useState<'nombre' | 'email'>('email');
  const [rolFiltro, setRolFiltro] = useState<string>('');
  const [orden, setOrden] = useState<'alfabetico' | 'creacion'>('alfabetico');
  const [rolActual, setRolActual] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const res = await fetch('/api/users/listar');
        const json = await res.json();
        if (!res.ok) {
          console.error('Error al obtener usuarios:', json.error);
          return;
        }
        setTodosLosUsuarios(json.data ?? []);
      } catch (error) {
        console.error('Error inesperado al obtener usuarios:', error);
      }
    };

    const obtenerRolUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const json = await res.json();
        if (res.ok) {
          setRolActual(json.rol ?? null);
        }
      } catch (err) {
        console.error('Error al obtener rol del usuario:', err);
      }
    };

    obtenerUsuarios();
    obtenerRolUsuario();
  }, []);

  useEffect(() => {
    let filtrados = todosLosUsuarios.filter((u) =>
      u[campoBusqueda]?.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (rolFiltro.trim() !== '') {
      filtrados = filtrados.filter(
        (u) => u.rol?.toLowerCase().trim() === rolFiltro.toLowerCase().trim()
      );
    }

    if (orden === 'alfabetico') {
      filtrados = [...filtrados].sort((a, b) => {
        const nombreA = a.nombre?.toLowerCase() || '';
        const nombreB = b.nombre?.toLowerCase() || '';
        return nombreA.localeCompare(nombreB);
      });
    }

    setUsuariosFiltrados(filtrados);
  }, [busqueda, campoBusqueda, rolFiltro, orden, todosLosUsuarios]);

  // Extraer roles únicos y filtrar SUPER si no corresponde
  const rolesUnicos: string[] = [];
  todosLosUsuarios.forEach((u) => {
    if (u.rol && !rolesUnicos.includes(u.rol)) {
      rolesUnicos.push(u.rol);
    }
  });

  const rolesFiltrados = rolActual === 'SUPER'
    ? rolesUnicos
    : rolesUnicos.filter((rol) => rol !== 'SUPER');

  return (
    <div className="px-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/protected/admin")}
        className="text-blue-600 text-base underline"
      >
        Volver
      </Button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios del sistema</h1>
        <Link href="/protected/admin/sign-up">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-base">
            <Plus className="mr-2 w-4 h-4" />
            Crear Usuario
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-end">
        <div>
          <SearchBar
            valor={busqueda}
            campo={campoBusqueda}
            onBuscar={setBusqueda}
            onCambiarCampo={setCampoBusqueda}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1">
            <select
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              className="border rounded px-3 py-2 h-10 text-sm w-full"
            >
              <option value="">Todos los roles</option>
              {rolesFiltrados.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <label htmlFor="orden" className="text-sm font-medium">Ordenar:</label>
            <select
              id="orden"
              value={orden}
              onChange={(e) => setOrden(e.target.value as 'alfabetico' | 'creacion')}
              className="border rounded px-2 py-1 h-10"
            >
              <option value="alfabetico">Alfabéticamente</option>
              <option value="creacion">Creación</option>
            </select>
          </div>
        </div>
      </div>

      <UsersTable usuarios={usuariosFiltrados} />
    </div>
  );
}
