'use client';

import { motion } from 'framer-motion';

const texto = '¡Hoy! Concepción Avanza';

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const letra = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

interface Props {
  size?: string; // Ejemplo: 'text-5xl', 'text-6xl', etc.
}

export default function TextoHoyAvanza({ size = 'text-7xl' }: Props) {
  const responsiveSize = `text-3xl ${size ? `md:${size}` : ''}`;

  return (
    <motion.div
      className={`text-center text-[#06c] mt-4 ${responsiveSize}`}
      style={{
        fontFamily: 'Blacksword',
        letterSpacing: '0.08em',
      }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {texto.split('').map((char, i) => (
        <motion.span key={i} variants={letra}>
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}
