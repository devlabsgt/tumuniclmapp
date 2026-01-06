'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Alumno } from '../lib/esquemas';
import { format } from 'date-fns';
import { useRef } from 'react';
import Dimgpdf from './Dimgpdf';

interface AlumnoCardProps {
  isOpen: boolean;
  onClose: () => void;
  alumno: Alumno | null;
}

export default function AlumnoCard({ isOpen, onClose, alumno }: AlumnoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !alumno) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        ref={cardRef}
        className="bg-slate-50 dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{alumno.nombre_completo}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Detalles del Alumno</p>
            </div>
            <Button 
                size="icon" 
                variant="ghost" 
                onClick={onClose} 
                className="rounded-full -mt-2 -mr-2 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* --- SECCIÓN DATOS DEL ALUMNO --- */}
            <div className="space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Datos Personales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CUI / DPI</p>
                  <p className="text-gray-800 dark:text-gray-200">{alumno.cui_alumno || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sexo</p>
                  <p className="text-gray-800 dark:text-gray-200">{alumno.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Nacimiento</p>
                  <p className="text-gray-800 dark:text-gray-200">
                    {alumno.fecha_nacimiento ? format(new Date(alumno.fecha_nacimiento), 'dd/MM/yyyy') : 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación</p>
                  <p className="text-gray-800 dark:text-gray-200">{alumno.ubicacion || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</p>
                  <p className="text-gray-800 dark:text-gray-200">
                    {alumno.telefono_alumno ? (
                      <a href={`https://wa.me/502${alumno.telefono_alumno}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 dark:text-blue-400">
                        {alumno.telefono_alumno}
                      </a>
                    ) : (
                      'No especificado'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* --- SECCIÓN DATOS DEL ENCARGADO --- */}
            <div className="space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Datos del Encargado</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</p>
                  <p className="text-gray-800 dark:text-gray-200">{alumno.nombre_encargado || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CUI / DPI</p>
                  <p className="text-gray-800 dark:text-gray-200">{alumno.cui_encargado || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</p>
                  <p className="text-gray-800 dark:text-gray-200">
                    {alumno.telefono_encargado ? (
                      <a href={`https://wa.me/502${alumno.telefono_encargado}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 dark:text-blue-400">
                        {alumno.telefono_encargado}
                      </a>
                    ) : (
                      'No especificado'
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex w-full justify-between gap-3 pt-4">
              <div className="flex-1">
                {/* Nota: Dimgpdf generará el PDF tal cual se ve en pantalla. Si estás en modo dark, el PDF saldrá oscuro. */}
                <Dimgpdf rootElementRef={cardRef} fileName={`Alumno_${alumno.nombre_completo.replace(/\s+/g, '_')}`} />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 dark:bg-transparent dark:text-gray-300 dark:border-neutral-600 dark:hover:bg-neutral-800"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}