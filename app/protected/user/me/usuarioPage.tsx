'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { EmpleadoDatos } from '@/components/admin/empleados/EmpleadoDatos'; // ✅ Importar el mismo
import { Button } from '@/components/ui/button'; // por si necesita botones después
import { useRouter } from 'next/navigation';

const fetchUsuarioActual = async () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Error al obtener usuario logueado');
  }

  const id = authData.user.id;

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
    const router = useRouter();

  const [data, setData] = useState<{ usuario: any; empleado: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchUsuarioActual();
        setData(result);
      } catch (err: any) {
        console.error(err);
        setError('Error al cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return null;

  const { usuario, empleado } = data;

  return (
    <div className="max-w-2xl mx-auto  p-6 border rounded shadow bg-white text-sm">
      {/* Título de Perfil */}
    <div className="flex items-center justify-start mb-6">
   <Button
          variant="ghost"
          onClick={() => router.push('/protected')}
          className="text-blue-600 text-base underline"
        >
          Volver
        </Button>

      <h1 className="text-2xl font-bold text-left ml-4">
        Mi Perfil
      </h1>
    </div>

      {/* Datos de Usuario */}
      <div className="border-t border-b divide-y mb-8">
        <div className="flex justify-between py-3 items-center">
          <strong className="w-1/3">USUARIO</strong>
          <span className="w-2/3">{usuario.email}</span>
        </div>

        <div className="flex justify-between py-3">
          <strong className="w-1/3">NOMBRE</strong>
          <span className="w-2/3">{usuario.nombre}</span>
        </div>
      </div>

      {/* Datos de Empleado */}
      <div>
        <h2 className="text-xl font-bold text-left mb-4">
          Datos de empleado
        </h2>

        {empleado ? (
          <EmpleadoDatos empleado={empleado} />
        ) : (
          <div className="flex justify-center mt-8">
            <span className="text-gray-600">
              Aún no se ha ingresado información adicional
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
