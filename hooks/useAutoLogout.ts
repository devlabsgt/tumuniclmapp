'use client';

import { useEffect } from 'react';
import Swal from 'sweetalert2';
import { logoutPorInactividad } from '@/utils/auth/logoutCliente';
import { useRouter } from 'next/navigation';

export function useAutoLogout(minutos: number = 15) {
  const router = useRouter();

  useEffect(() => {
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
  }, [minutos, router]);
}
