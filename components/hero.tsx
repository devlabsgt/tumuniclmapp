'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import LoadingAnimation from "@/components/ui/animations/LoadingAnimation"; 
import { useEffect, useState } from 'react';

export default function Hero() {
  const router = useRouter();
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMostrarBienvenida(true), 1000); // 2.5 segundos
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col items-center w-full gap-8 relative">
  <LoadingAnimation /> 
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: mostrarBienvenida ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/sign-in')}
        className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-neutral-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-6 w-full max-w-5xl text-left cursor-pointer border border-gray-200 dark:border-neutral-700"
      >
        {/* Imagen SVG a la izquierda */}
        <motion.div
          className="mb-6 md:mb-0 md:mr-6 w-[160px] h-[160px] flex justify-center items-center rounded-full bg-transparent"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Image
            src="/svg/gestion.svg"
            alt="Gestión Municipal"
            width={160}
            height={160}
            className="w-full h-full"
          />
        </motion.div>

        {/* Texto a la derecha */}
        <div className="flex-1 text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mostrarBienvenida ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mb-5 text-xl md:text-4xl font-extrabold text-gray-900 dark:text-white  transition-colors"
          >
            Bienvenido a la aplicación web Municipal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: mostrarBienvenida ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-xl font-medium text-[#06c]"
          >
            Haz click aquí 🤳 para acceder al sistema
          </motion.p>
        </div>
      </motion.button>
    </div>
  );
}
