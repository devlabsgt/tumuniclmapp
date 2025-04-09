'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { EmpleadoDatos } from '@/components/admin/empleados/EmpleadoDatos';

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
    .maybeSingle(); // 👈 Usa maybeSingle para que no truene si no hay

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
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow bg-white text-sm">
      <h1 className="text-xl font-bold text-center mb-6">
        Informe de Datos de Empleado Municipal
        <Button
          className="ml-5 text-center"
          onClick={() => router.push(`/protected/admin/users/editar?id=${usuario.id}`)}
        >
          Editar usuario
        </Button>
      </h1>



      {/* Datos de usuario */}
      <div className="border-t border-b divide-y">
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
      <div className="mt-8">
        {empleado ? (
          <>
            {/* Título y botón de datos de empleado */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Datos de empleado
              </h2>
              <Button
                onClick={() => router.push(`/protected/admin/empleado/editar?user_id=${usuario.id}`)}
              >
                Editar datos de Empleado
              </Button>
            </div>

            {/* Datos del empleado */}
            <EmpleadoDatos empleado={empleado} />
          </>
        ) : (
          <div className="flex justify-center mt-8">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => router.push(`/protected/admin/empleado/crear?user_id=${usuario.id}`)}
            >
              Ingresar datos del empleado
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
