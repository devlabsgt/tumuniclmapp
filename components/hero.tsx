'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import TextoHoyAvanza from '@/components/ui/TextoHoyConcepcionAvanza';



export default function Header() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center w-full gap-8 relative">
      {/* Botón salir */}
      <div className="w-full max-w-5xl flex justify-start pr-2">
        <Button
          variant="link"
          size="sm"
          onClick={() => window.location.href = 'https://www.tumuniclm.com'}
          className="text-blue-600 text-xl flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          ir a tumuniclm.com
        </Button>
      </div>
      <TextoHoyAvanza size="text-6xl" />


      {/* Tarjeta principal */}
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 transition-colors"
          >
            Bienvenido a la aplicación de la Municipalidad de Concepción Las Minas
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="text-lg font-medium text-[#06c]"
          >
            Haz click aquí 🤳 para acceder al sistema
          </motion.p>
        </div>
      </motion.button>
    </div>
  );
}
