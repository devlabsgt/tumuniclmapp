'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    const verificarAcceso = async () => {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/sign-in');
        return;
      }

      const { data, error } = await supabase
        .from('usuarios_roles')
        .select('roles(nombre)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      const rolNombre =
        !error && data?.roles && 'nombre' in data.roles
          ? (data.roles as { nombre: string }).nombre
          : null;

      const rolNormalizado = rolNombre?.toUpperCase();
      if (rolNormalizado === 'ADMINISTRADOR' || rolNormalizado === 'SUPER') {
        router.push('/protected/admin');
      } else {
        router.push('/protected/user');
      }

    };

    verificarAcceso();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center text-gray-700">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-semibold">Verificando acceso...</p>
    </div>
  );
}
