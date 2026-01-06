'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alumno, } from '../lib/esquemas';
import { ChevronDown, MapPin, Users } from 'lucide-react';

interface EstadisticasLugaresProps {
  alumnos: Alumno[];
}

export default function EstadisticasLugares({ alumnos }: EstadisticasLugaresProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const alumnosPorLugar = useMemo(() => {
    const conteo = new Map<string, number>();

    alumnos.forEach(a => {
      if (a.ubicacion) {
        conteo.set(a.ubicacion, (conteo.get(a.ubicacion) || 0) + 1);
      }
    });

    return Array.from(conteo.entries())
      .map(([nombre, alumnos]) => ({ nombre, alumnos }))
      .sort((a, b) => b.alumnos - a.alumnos);
  }, [alumnos]);

  const maxAlumnos = alumnosPorLugar.length > 0 ? alumnosPorLugar[0].alumnos : 0;

  if (alumnosPorLugar.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-lg shadow-sm">
        <p className="text-gray-500 dark:text-gray-400">No hay alumnos inscritos en lugares para este programa.</p>
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
          <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Distribución Geográfica</h3>
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
            <div className="space-y-4 pt-2">
              {alumnosPorLugar.map((item) => (
                <div key={item.nombre} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="truncate">{item.nombre}</span>
                    <span className="font-semibold">{item.alumnos}</span>
                  </div>
                  <div className="relative bg-gray-200 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
                    <motion.div
                      className="bg-purple-600 dark:bg-purple-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.alumnos / maxAlumnos) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}