'use client';

import React, { useState, useMemo } from 'react';
import type { Alumno, Programa } from '../lib/esquemas';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Typewriter } from 'react-simple-typewriter';

interface Props {
  niveles: Programa[];
  alumnos: Alumno[];
  onBarClick: (data: any) => void;
}

export default function EstadisticasNiveles({ niveles, alumnos, onBarClick }: Props) {
  const [filtroGrafica, setFiltroGrafica] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  if (!niveles || !alumnos) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  const barData = useMemo(() => {
    const data = niveles.map(nivel => ({
      ...nivel,
      alumnos_count: alumnos.filter(a => a.programa_id === nivel.id).length
    }));
    const filteredData = data.filter(nivel => nivel.nombre.toLowerCase().includes(filtroGrafica.toLowerCase()));
    
    return filteredData.sort((a, b) => b.alumnos_count - a.alumnos_count);
  }, [niveles, alumnos, filtroGrafica]);
  
  const maxAlumnos = useMemo(() => {
    if (barData.length === 0) return 0;
    return Math.max(...barData.map(d => d.alumnos_count));
  }, [barData]);

  return (
    <div className="h-auto w-full bg-white">
      <div className="p-4 bg-white border rounded-xl">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-800">Niveles </h3>
              <p className="text-gray-600 text-xs mt-1">Total de niveles: {niveles.length}</p>
            </div>
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
              className="overflow-hidden"
            >

                      
            <div className="my-6 relative w-4/5 mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w- text-gray-400" />
              <Input
                  placeholder="Buscar nivel..."
                  value={filtroGrafica}
                  onChange={(e) => setFiltroGrafica(e.target.value)}
                  className="pl-9"
              />

            </div>
              {barData.length > 0 ? (
                <div className="space-y-4">
                            <div className="border-b-4 border-gray-200 mt-4"></div>
               <div className="my-2 text-xs text-blue-600 ">
                  <Typewriter
                    words={[
                      'Seleccione una barra para ver los detalles del nivel.',
                    ]}
                    loop={1}
                    cursor
                    cursorStyle="_"
                    typeSpeed={40}
                  />
              </div>
                  {barData.map((item) => (
                    <div key={item.id} className="space-y-4 cursor-pointer bg-gray-50 p-4 rounded-md shadow-sm transition-transform duration-200 hover:bg-blue-50 hover:scale-105 mx-5" onClick={() => onBarClick({ activePayload: [{ payload: item }] })}>
                        <div className="flex justify-between items-start text-sm font-medium text-gray-600">
                            <div>
                                <span className="text-lg truncate font-bold">{item.nombre}</span>
                                <div className="text-xs text-gray-500">{item.descripcion || ' '}</div>
                                
                            </div>
                            <span className="font-bold">{item.alumnos_count}</span>
                        </div>
                        <div className="relative bg-gray-200 rounded-full h-4">
                            <motion.div
                                className="bg-blue-600 h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.alumnos_count / maxAlumnos) * 100}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No se encontraron niveles con ese nombre.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}