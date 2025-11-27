'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AnimatedIcon from '@/components/ui/AnimatedIcon';

interface ModuleAccordionProps {
  titulo: string;
  descripcion: string;
  iconKey: string;
  children: React.ReactNode;
}

export default function ModuleAccordion({ titulo, descripcion, iconKey, children }: ModuleAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hover, setHover] = useState(false);

  if (!children || (Array.isArray(children) && children.length === 0)) return null;

  return (
    <div className="border rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden mb-4 shadow-sm w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="w-full flex items-center justify-between px-4 py-8 md:py-5 bg-white dark:bg-gray-800 hover:bg-gray-50 transition-colors border-b border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-gray-700 rounded-full flex-shrink-0">
             <AnimatedIcon 
                iconKey={iconKey} 
                className="w-8 h-8" 
                trigger={hover ? 'loop' : undefined}
             />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">{titulo}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{descripcion}</p>
          </div>
        </div>
        
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-3 flex flex-col gap-3 bg-gray-50 dark:bg-gray-900/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}