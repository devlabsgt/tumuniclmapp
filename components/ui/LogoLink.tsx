'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { CoolMode } from '@/components/ui/cool-mode';

export default function LogoLink() {
  return (
    <div className="flex items-center gap-1 font-semibold">
      <CoolMode>
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          style={{ color: '#06c' }}
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
              src="/images/logo-muni.png"
              alt="Logo Municipalidad de Concepción Las Minas"
              height={100}
              width={100}
              className="block w-40 lg:w-60"
            />
          </motion.div>

          <motion.span
            className="hidden md:inline-block text-xl font-semibold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <span className="text-blue-600">Municipalidad de</span> <br />
            <span> Concepción Las Minas </span><br />
          </motion.span>
        </motion.div>
      </CoolMode>
    </div>
  );
}