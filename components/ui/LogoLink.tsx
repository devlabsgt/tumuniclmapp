'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { CoolMode } from '@/components/ui/cool-mode';

const PRIMARY_BLUE = '#0066cc';
const SECONDARY_GRAY = '#4B5563';

const typeWriterVariant: Variants = {
  hidden: { width: 0, opacity: 0 },
  visible: (i: number) => {
    const duration = i === 1 ? 0.5 : 1;
    let delay = 0;
    
    if (i === 1) delay = 0.5;
    if (i === 2) delay = 1.2; 
    if (i === 3) delay = 2.4; 

    return {
      width: 'fit-content',
      opacity: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: "linear",
      },
    };
  },
};

export default function LogoLink() {
  return (
    <div className="flex items-center gap-1">
      <CoolMode>
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer p-2 rounded-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.17, 0.67, 0.83, 0.67] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.2, type: 'spring', damping: 12, stiffness: 100 }}
          >
            <Image
              src="/images/logo-muni.png"
              alt="Logo Municipalidad de Concepción Las Minas"
              height={100}
              width={100}
              className="block w-[200px] lg:w-60"
            />
          </motion.div>

          <div className="md:hidden flex flex-col items-center text-center mt-[-15px] mb-4">
            <motion.span 
              className="text-[10px] font-extrabold uppercase tracking-wider relative overflow-hidden inline-block whitespace-nowrap"
              style={{ color: PRIMARY_BLUE, fontFamily: 'Montserrat, sans-serif' }}
              variants={typeWriterVariant}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              SIGEM -CLM-
              <motion.span
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear', delay: 1 }}
                style={{ mixBlendMode: 'soft-light' }}
              />
            </motion.span>
            
            <motion.span 
              className={`text-[9px] font-medium ${SECONDARY_GRAY} mt-0 leading-tight block whitespace-nowrap overflow-hidden`}
              style={{ fontFamily: 'Inter, sans-serif' }}
              variants={typeWriterVariant}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              Sistema Integral de Gestión Municipal
            </motion.span>
            <motion.span 
              className="text-[9px] font-semibold mt-[3px] leading-tight block whitespace-nowrap overflow-hidden"
              style={{ color: PRIMARY_BLUE, fontFamily: 'Inter, sans-serif' }}
              variants={typeWriterVariant}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              Municipalidad de Concepción Las Minas
            </motion.span>
          </div>
          
          <div className="hidden md:inline-block leading-tight text-left">
            <motion.span 
              className="block text-3xl mb-0 font-extrabold uppercase tracking-wide relative overflow-hidden whitespace-nowrap"
              style={{ color: PRIMARY_BLUE, fontFamily: 'Montserrat, sans-serif' }}
              variants={typeWriterVariant}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              SIGEM -CLM-
              <motion.span
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear', delay: 1 }}
                style={{ mixBlendMode: 'soft-light' }}
              />
            </motion.span>
            
            <motion.span 
              className={`block text-xl font-medium ${SECONDARY_GRAY} mt-[-2px] whitespace-nowrap overflow-hidden`}
              style={{ fontFamily: 'Inter, sans-serif' }}
              variants={typeWriterVariant}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              Sistema Integral de Gestión Municipal
            </motion.span>
            <motion.span 
              className="block font-semibold text-lg mt-1 whitespace-nowrap overflow-hidden"
              style={{ color: PRIMARY_BLUE, fontFamily: 'Inter, sans-serif' }}
              variants={typeWriterVariant}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              Municipalidad de Concepción Las Minas
            </motion.span>
          </div>
        </motion.div>
      </CoolMode>
    </div>
  );
}