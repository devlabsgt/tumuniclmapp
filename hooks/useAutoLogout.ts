'use client';

import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { registrarLog } from '@/utils/registrarLog';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { obtenerFechaYFormatoGT } from '@/utils/formatoFechaGT';

export function useAutoLogout(minutos: number = 15) {
  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { fecha, formateada } = obtenerFechaYFormatoGT();

        await registrarLog({
          accion: 'INACTIVIDAD',
          descripcion: `${user.email} cerró sesión por inactividad el ${formateada}`,
          nombreModulo: 'SISTEMA',
        });

        await supabase.auth.signOut();

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
  }, [minutos, router]);
}
