'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LogoLink() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isBaseRoute = pathname === '/' || pathname === '/admin' || pathname === '/user';

  return (
    <div className="flex items-center gap-1 font-semibold">
      <motion.div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push('/protected')}
        style={{ color: theme === 'dark' ? '#ffffff' : '#06c' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Image
            src="/images/logo.webp"
            alt="Logo Municipalidad de Concepción Las Minas"
            height={250}
            width={250}
          />
        </motion.div>

        <motion.span
          className="hidden md:inline-block text-xl font-semibold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Municipalidad de <br /> Concepción Las Minas
        </motion.span>
      </motion.div>
    </div>
  );
}
