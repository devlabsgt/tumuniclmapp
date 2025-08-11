'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
      const destination = (rolNormalizado === 'ADMINISTRADOR' || rolNormalizado === 'SUPER') 
        ? '/protected/admin' 
        : '/protected/user';

      // --- INICIO DE LA NUEVA LÓGICA DE TRANSICIÓN ---

      // 1. Empezamos a descargar los componentes de la página de destino en segundo plano.
      //    Esto no navega, solo prepara todo para que la navegación sea instantánea.
      router.prefetch(destination);

      // 2. Inmediatamente después, le decimos a la animación de carga que inicie su secuencia
      //    de salida, que como sabemos, dura 2500ms en total.
      setIsLoading(false);

      // 3. NO esperamos los 2500ms completos. En su lugar, esperamos un poco menos,
      //    por ejemplo 800ms, para dar tiempo a que la animación de salida sea visible
      //    y a que la precarga avance.
      setTimeout(() => {
        // 4. Después de 800ms, ejecutamos la navegación. Como ya está precargada,
        //    esta transición será muy rápida. La animación de salida seguirá su curso
        //    mientras la nueva página se renderiza.
        router.push(destination);
      }, 1500); // <-- Puede ajustar este valor (entre 500 y 1500) para el efecto deseado.

      // --- FIN DE LA NUEVA LÓGICA DE TRANSICIÓN ---
    };

    verificarAcceso();
  }, [router]);

  return;
}