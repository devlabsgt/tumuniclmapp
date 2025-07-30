'use-client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { logoutPorInactividad } from '@/utils/auth/logoutCliente';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function useAutoLogout(minutos: number = 60) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await logoutPorInactividad();

        await Swal.fire({
          title: 'Sesión cerrada',
          text: 'Se cerró la sesión por inactividad, por favor, vuelva a iniciar sesión.',
          icon: 'info',
          confirmButtonText: 'Aceptar',
        });

        router.push('/sign-in');
      }, minutos * 60 * 1000);
    };

    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [minutos, session, router]); 
}