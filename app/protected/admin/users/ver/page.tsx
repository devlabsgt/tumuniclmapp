'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';

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
    .single();

  return { usuario, empleado: empleado || null };
};

export default function UsuarioPage() {
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
        <span>Informe de Datos de Empleado Municipal</span>

          <Button
          className="ml-5 text-center"
          onClick={() => router.push(`/protected/admin/users/editar?id=${usuario.id}`)}
        >
          Editar usuario
      </Button>
      </h1>

      <div className="border-t border-b divide-y">
        <div className="flex justify-between py-3">
          <strong className="w-1/3">NOMBRE</strong>
          <span className="w-2/3">{usuario.nombre || '—'}</span>
        </div>
        <div className="flex justify-between py-3">
          <strong className="w-1/3">USUARIO</strong>
          <span className="w-2/3">{usuario.email}</span>
        </div>
        <div className="flex justify-between py-3">
          <strong className="w-1/3">ROL</strong>
          <span className="w-2/3">
              <span className="w-2/3">{usuario.rol}</span>
          </span>
        </div>

      </div>

      {/* Datos del empleado o botón para crear */}
      <div className="mt-8">
        {empleado ? (
          <div className="border-t border-b divide-y mt-6">
            <div className="flex justify-between py-3">
              <strong className="w-1/3">DPI</strong>
              <span className="w-2/3">{empleado.dpi || '—'}</span>
            </div>
            <div className="flex justify-between py-3">
              <strong className="w-1/3">CARGO</strong>
              <span className="w-2/3">{empleado.cargo || '—'}</span>
            </div>
            <div className="flex justify-between py-3">
              <strong className="w-1/3">FECHA INICIO</strong>
              <span className="w-2/3">
                {empleado.fecha_inicio
                  ? new Date(empleado.fecha_inicio).toLocaleDateString('es-GT')
                  : '—'}
              </span>
            </div>
            {/* Puede agregar más campos como sueldo, banco, cuenta, etc. */}
          </div>
        ) : (
          <div className="flex justify-center mt-8">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() =>
                router.push(`/protected/admin/users/empleado/crear?user_id=${usuario.id}`)
              }
            >
              Ingresar datos del empleado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
