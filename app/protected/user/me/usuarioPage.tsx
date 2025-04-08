'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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
    .single();

  return { usuario, empleado: empleado || null };
};

export function UsuarioPageContent() {
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
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow bg-white text-sm">
      <h1 className="text-xl font-bold text-center mb-6">
        Informe de Datos de Empleado Municipal
      </h1>

      <div className="border-t border-b divide-y">
        <div className="flex justify-between py-3 items-center">
          <strong className="w-1/3">USUARIO</strong>
          <span className="w-2/3 flex items-center gap-2">{usuario.email}</span>
        </div>

        <div className="flex justify-between py-3">
          <strong className="w-1/3">NOMBRE</strong>
          <span className="w-2/3">{usuario.nombre}</span>
        </div>
      </div>

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
          </div>
        ) : (
          <div className="flex justify-center mt-8">
            Aún no se ha ingresado información adicional
          </div>
        )}
      </div>
    </div>
  );
}
