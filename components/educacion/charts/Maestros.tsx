'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, GraduationCap } from 'lucide-react';

// Tipos para el componente
interface MaestroAlumnos {
  nombre: string;
  ctd_alumnos: number;
}

interface MaestrosProps {
  isOpen: boolean;
  onClose: () => void;
  maestros: MaestroAlumnos[];
}

export default function Maestros({ isOpen, onClose, maestros }: MaestrosProps) {
  // Se calcula el máximo de alumnos para normalizar la barra de la gráfica
  const maxAlumnos = useMemo(() => {
    if (maestros.length === 0) return 0;
    return Math.max(...maestros.map(m => m.ctd_alumnos));
  }, [maestros]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Maestros del Programa</h2>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full -mt-2 -mr-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
              {maestros.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {maestros.map((item) => (
                    <div key={item.nombre} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span className="truncate">{item.nombre}</span>
                        <span className="font-semibold">{item.ctd_alumnos}</span>
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
              ) : (
                <div className="p-4 text-center">
                    <p className="text-gray-500">No hay maestros asociados con alumnos en este programa.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button onClick={onClose} className="w-full">
                Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}