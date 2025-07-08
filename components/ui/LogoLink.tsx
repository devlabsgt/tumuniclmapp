'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LogoLink() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [horaGT, setHoraGT] = useState('');

  const isBaseRoute = pathname === '/' || pathname === '/admin' || pathname === '/user';

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      const hora = ahora.toLocaleTimeString('es-GT', { hour12: false });
      setHoraGT(hora);
    };

    actualizarHora();
    const intervalo = setInterval(actualizarHora, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex items-center gap-1 font-semibold">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push('/protected')}
        style={{ color: theme === 'dark' ? '#ffffff' : '#06c' }}
      >
        <Image
          src="/images/logo.webp"
          alt="Logo Municipalidad de Concepción Las Minas"
          height={250}
          width={250}
        />
        <div className="flex flex-col">
          <span className="hidden md:inline-block text-xl font-semibold">
            Municipalidad de <br /> Concepción Las Minas
          </span>
          <span className="text-sm text-gray-500 font-normal mt-1">
            Hora actual: <span className="font-mono">{horaGT}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
