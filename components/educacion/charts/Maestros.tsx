'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, GraduationCap, Pencil } from 'lucide-react';

// Tipos para el componente
interface MaestroAlumnos {
  id: number;
  nombre: string;
  ctd_alumnos: number;
}

interface MaestrosProps {
  onEdit: (maestro: MaestroAlumnos) => void;
  maestros: MaestroAlumnos[];
}

export default function Maestros({ onEdit, maestros }: MaestrosProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Se calcula el máximo de alumnos para normalizar la barra de la gráfica
  const maxAlumnos = useMemo(() => {
    if (maestros.length === 0) return 0;
    return Math.max(...maestros.map(m => m.ctd_alumnos));
  }, [maestros]);

  if (maestros.length === 0) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <p className="text-gray-500">No hay maestros asociados con alumnos en este programa.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border rounded-xl shadow-lg overflow-hidden">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Maestros del Programa</h3>
        </div>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="h-6 w-6 text-gray-600" />
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
            <div className="space-y-4">
              {maestros.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                    <span className="truncate">{item.nombre}</span>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.ctd_alumnos}</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => onEdit(item)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                  <div className="relative bg-gray-200 rounded-full h-4">
                    <motion.div
                      className="bg-blue-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.ctd_alumnos / maxAlumnos) * 100}%` }}
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