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
  size?: string;
  color?: string;
}

export default function TextoHoyConcepcionAvanza({ 
  size = 'text-5xl md:text-7xl', 
  color = '#FFFFFF' // Color blanco por defecto
}: Props) {
  
  return (
    <motion.div
      className={`text-center mt-4 ${size}`}
      style={{
        fontFamily: 'Blacksword',
        letterSpacing: '0.05em',
        color: color, // Se aplica el color recibido como prop
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
