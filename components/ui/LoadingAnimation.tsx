'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextoHoyConcepcionAvanza from '@/components/ui/TextoHoyConcepcionAvanza';

interface Props {
  isLoading?: boolean;
}

export default function LoadingAnimation({ isLoading: parentIsLoading }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // La secuencia de salida se activa solo cuando el componente debe desaparecer.
    // Esto ocurre si isLoading se establece en 'false' (modo controlado) o
    // si isLoading es 'undefined' desde el principio (modo autónomo).
    if (parentIsLoading === false || parentIsLoading === undefined) {
      
      // 1. Esperamos 1500ms con el componente aún visible.
      const timer = setTimeout(() => {
        // 2. Después de 1500ms, cambiamos 'show' a false.
        setShow(false);
        // 3. Esto activa la animación 'exit' que dura 1000ms.
      }, 1500); 
      // Duración total de la secuencia de salida: 1500ms (espera) + 1000ms (animación) = 2500ms.

      return () => clearTimeout(timer);
    }
    
    // Si isLoading es 'true', nos aseguramos de que el componente permanezca visible
    // sin iniciar ningún temporizador de salida.
    if (parentIsLoading === true) {
      setShow(true);
    }
  }, [parentIsLoading]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 flex items-center justify-center bg-gray-100/70 backdrop-blur-sm z-50 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120, delay: 0.2 } }}
            exit={{ 
              scale: 15,
              opacity: 0, 
              transition: { 
                duration: 1.0, // <-- Esta animación dura 1000ms
                ease: [0.76, 0, 0.24, 1]
              } 
            }}
            className="flex flex-col items-center gap-8 z-10"
          >
            <TextoHoyConcepcionAvanza 
              size="text-2xl md:text-7xl" 
              color="#0066cc" 
            />
            
            <img
              src="/icon-512x512.png"
              alt="Emblema Municipal"
              width="512"
              height="512"
              className="w-32 h-32 md:w-48 md:h-48 rounded-2xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}