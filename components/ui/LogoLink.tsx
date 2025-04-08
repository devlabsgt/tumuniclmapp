'use client';

import { useTheme } from 'next-themes';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

export default function LogoLink() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isBaseRoute = pathname === '/' || pathname === '/admin' || pathname === '/user';

  return (
    <div className="flex items-center gap-1 font-semibold">
      {!isBaseRoute && (
        <div
          className="cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeft size={40} color={theme === 'dark' ? '#fff' : '#06c'} />
        </div>
      )}
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
        <span className="hidden md:inline-block text-xl font-semibold">
          Municipalidad de <br /> Concepción Las Minas
        </span>
      </div>
    </div>
  );
}
