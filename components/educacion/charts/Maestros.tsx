'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, User } from 'lucide-react';
import { Typewriter } from 'react-simple-typewriter';

interface MaestroAlumnos {
  id: number;
  nombre: string;
  ctd_alumnos: number;
}

interface MaestrosProps {
  onEdit: (maestro: MaestroAlumnos) => void;
  maestros: MaestroAlumnos[];
  rol: string | null;
}

export default function Maestros({ onEdit, maestros, rol }: MaestrosProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasEditPermission = 
    rol === 'SUPER' || 
    rol === 'RRHH' || 
    rol === 'DIGITADOR' || 
    rol === 'SECRETARIO';

  const totalAlumnos = useMemo(() => {
    return maestros.reduce((sum, maestro) => sum + maestro.ctd_alumnos, 0);
  }, [maestros]);

  const maxAlumnos = useMemo(() => {
    if (maestros.length === 0) return 0;
    return Math.max(...maestros.map(m => m.ctd_alumnos));
  }, [maestros]);

  if (maestros.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-lg shadow-sm">
        <p className="text-gray-500 dark:text-gray-400">No hay maestros asociados con alumnos en este programa.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl overflow-hidden transition-colors duration-200">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-green-600 dark:text-green-500" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Maestros del Programa</h3>
        </div>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="overflow-hidden mt-4"
          >
            {hasEditPermission && (
              <div className="text-sm text-green-700 dark:text-green-400 my-4">
                  <Typewriter
                      words={['Seleccione un maestro para editar']}
                      loop={1}
                      cursor
                      cursorStyle="_"
                      typeSpeed={40}
                  />
              </div>
            )}
            <div className="space-y-4">
              {maestros.map((item) => (
                <div 
                  key={item.id} 
                  className={`
                    space-y-4 bg-gray-50 dark:bg-neutral-800 p-4 rounded-md shadow-sm transition-all duration-200 mx-3
                    ${hasEditPermission 
                        ? 'cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-105' 
                        : 'cursor-default'}
                  `}
                  onClick={() => {
                    if (hasEditPermission) {
                      onEdit(item);
                    }
                  }}
                >
                  <div className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="truncate">{item.nombre}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{item.ctd_alumnos}</span>
                  </div>
                  <div className="relative bg-gray-200 dark:bg-neutral-700 rounded-full h-4 overflow-hidden">
                    <motion.div
                      className="bg-green-600 dark:bg-green-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.ctd_alumnos / maxAlumnos) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>

          <div className="border-b-4 border-gray-200 dark:border-neutral-800 mt-4"></div>
          <div className="text-end text-sm font-bold text-gray-600 dark:text-gray-400 pt-6">Total de alumnos: {totalAlumnos}</div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}