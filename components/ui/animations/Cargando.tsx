'use client';

import { motion } from 'framer-motion';

interface Props {
  texto?: string;
}

const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.3,
    },
  },
};

const letterVariants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 12,
      stiffness: 100,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

export default function Cargando({ texto = "Cargando..." }: Props) {
  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full pt-20 gap-8">
      <motion.img
        src="/images/logo-muni.png"
        alt="Logo Municipal"
        className="w-2/5 h-auto lg:w-48"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      />
      <motion.div
        className="flex text-xs font-bold tracking-widest text-[#06c] lg:text-lg"
        variants={textContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {texto.split('').map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            variants={letterVariants}
            style={{ display: 'inline-block' }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}