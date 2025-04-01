'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';

const fetchUsuario = async (id: string) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .rpc('obtener_usuarios');

    
  if (error || !data) throw new Error('Error al obtener usuarios');

  const usuario = data.find((u: any) => u.id === id);
  if (!usuario) throw new Error('Usuario no encontrado');

  return usuario;
};

export default function UsuarioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const { data: usuario, error, isLoading } = useSWR(
    id ? ['usuario', id] : null,
    () => fetchUsuario(id!)
  );

  if (!id) return <p>No se proporcionó un ID.</p>;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    router.push('/protected/admin/users');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow bg-white text-sm">
      <h1 className="text-2xl font-bold text-center mb-6">
        Informe de Datos de Empleado Municipal
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
      </div>
    </div>
  );
}
