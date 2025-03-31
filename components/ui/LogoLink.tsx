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
    <div
      className="flex items-center gap-1 font-semibold cursor-pointer"
      onClick={() => !isBaseRoute && router.back()}
      style={{ color: theme === 'dark' ? '#ffffff' : '#06c' }}
    >
      {!isBaseRoute && (
        <ArrowLeft size={40} color={theme === 'dark' ? '#fff' : '#06c'} />
      )}
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
  );
}
