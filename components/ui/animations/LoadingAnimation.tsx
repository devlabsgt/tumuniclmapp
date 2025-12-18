'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextoHoyConcepcionAvanza from '@/components/ui/TextoHoyConcepcionAvanza';

interface Props {
  duration?: number;
}

export default function LoadingAnimation({ duration }: Props) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const delay = duration ?? 2500;

    const timer = setTimeout(() => {
      setShow(false); 
    }, delay); 

    return () => clearTimeout(timer);
  }, [duration]); 

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1 } }}

          className="fixed inset-0 flex items-center justify-center bg-gray-100/70 dark:bg-black/70 backdrop-blur-sm z-50 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120, delay: 0.2 } }}
            exit={{ 
              scale: 15,
              opacity: 0, 
              transition: { 
                duration: 1.0,
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
              alt="Logo Municipal"
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