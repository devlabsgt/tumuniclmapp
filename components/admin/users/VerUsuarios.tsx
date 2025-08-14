'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import UsersTable from '@/components/admin/users/UsersTable';
import SearchBar from '@/components/admin/users/SearchBar';
import { Usuario } from '@/components/admin/users/types';
import { Plus } from 'lucide-react';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios'; // Importa el nuevo hook

export default function VerUsuarios() {
  const router = useRouter();
  const { todosLosUsuarios, loading } = useListaUsuarios(); // Usa el hook
  
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [campoBusqueda, setCampoBusqueda] = useState<'nombre' | 'email'>('email');
  const [rolFiltro, setRolFiltro] = useState<string>('');
  const [orden, setOrden] = useState<'alfabetico' | 'creacion'>('alfabetico');
  const [rolActual, setRolActual] = useState<string | null>(null);

  useEffect(() => {
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
  const rolesUnicos = useMemo(() => {
    const roles: string[] = [];
    todosLosUsuarios.forEach((u) => {
      if (u.rol && !roles.includes(u.rol)) {
        roles.push(u.rol);
      }
    });
    return roles;
  }, [todosLosUsuarios]);

  const rolesFiltrados = rolActual === 'SUPER'
    ? rolesUnicos
    : rolesUnicos.filter((rol) => rol !== 'SUPER');
    
  if (loading) {
    return <div className="text-center py-10">Cargando usuarios...</div>;
  }

  return (
    <div className="px-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-4 w-full">
        <Button
          variant="ghost"
          onClick={() => router.push("/protected/admin")}
          className="text-blue-600 text-base underline w-full md:w-auto"
        >
          Volver
        </Button>

        <h1 className="text-2xl font-bold text-center w-full md:w-auto">Usuarios del sistema</h1>

        <Link href="/protected/admin/sign-up" className="w-full md:w-auto">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-base w-full md:w-auto">
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