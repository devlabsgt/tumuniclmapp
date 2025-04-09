'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { EmpleadoDatos } from '@/components/admin/empleados/EmpleadoDatos';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const fetchUsuario = async (id: string) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: usuarios, error: errorUsuarios } = await supabase.rpc('obtener_usuarios');
  if (errorUsuarios || !usuarios) throw new Error('Error al obtener usuarios');

  const usuario = usuarios.find((u: any) => u.id === id);
  if (!usuario) throw new Error('Usuario no encontrado');

  const { data: empleado, error: errorEmpleado } = await supabase
    .from('empleados_municipales')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();

  return { usuario, empleado };
};

export function UsuarioPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const { data, error, isLoading } = useSWR(id ? ['usuario', id] : null, () => fetchUsuario(id!));

  if (!id) return <p>No se proporcionó un ID.</p>;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    router.push('/protected/admin/users');
    return null;
  }

  if (!data) return null;
  const { usuario, empleado } = data;

  return (
    <>
      <div className="flex justify-start mb-4">
        <Button
          type="button"
          className="h-10 text-white text-sm w-auto px-4 bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push(`/protected/admin/users`)}
        >
          Volver a usuarios
        </Button>
      </div>

      <div className="max-w-2xl mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">Informe de Datos de Empleado Municipal</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
             <Button className="h-12 text-white text-lg ml-5 bg-blue-600 hover:bg-blue-700">
            Opciones
          </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="center" className="py-2 px-1 space-y-2 bg-background shadow-md rounded-md border border-border">
              <DropdownMenuItem
                className="cursor-pointer text-base hover:bg-muted w-full px-2 py-1 rounded"
                onClick={() => router.push(`/protected/admin/users/editar?id=${usuario.id}`)}
              >
                Editar Usuario
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-base hover:bg-muted w-full px-2 py-1 rounded"
                onClick={() => router.push(`/protected/admin/empleado/editar?user_id=${usuario.id}`)}
              >
                Editar Datos<br />de Empleado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Datos de usuario */}
        <div className="border-t border-b divide-y divide-border">
          <div className="flex justify-between py-3 items-center">
            <strong className="w-1/3">USUARIO</strong>
            <span className="w-2/3 flex items-center gap-2">
              {usuario.email}
              {usuario.activo === 'true' || usuario.activo === true ? (
                <span className="text-green-600">🟢 Activo</span>
              ) : (
                <span className="text-red-600">🔴 Inactivo</span>
              )}
            </span>
          </div>
          <div className="flex justify-between py-3">
            <strong className="w-1/3">NOMBRE</strong>
            <span className="w-2/3">{usuario.nombre}</span>
          </div>
          <div className="flex justify-between py-3">
            <strong className="w-1/3">ROL</strong>
            <span className="w-2/3">{usuario.rol}</span>
          </div>
        </div>

        {/* Datos del empleado */}
        <div className="mt-6">
          {empleado ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Datos de empleado</h2>
              </div>
              <EmpleadoDatos empleado={empleado} />
            </>
          ) : (
            <div className="flex justify-center mt-4">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => router.push(`/protected/admin/empleado/crear?user_id=${usuario.id}`)}
              >
                Ingresar datos<br />del empleado
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
