'use client';

import React, { useState, useMemo } from 'react';
import type { Alumno, Programa } from '../lib/esquemas';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ClipboardList } from 'lucide-react';
import MensajeAnimado from '../../ui/Typeanimation';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  niveles: Programa[];
  alumnos: Alumno[];
  onBarClick: (data: any) => void;
}

export default function EstadisticasNiveles({ niveles, alumnos, onBarClick }: Props) {
  const [filtroGrafica, setFiltroGrafica] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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
          <h3 className="text-xl font-bold text-gray-800">Niveles </h3>
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
                    <div className="my-6 text-lg text-blue-600 font-semibold">
                        <MensajeAnimado
                          textos={[
                            'Haga clic en una barra para ver los detalles del nivel.',
                          ]}
                        />
                      </div>
                      
                    <div className="relative mb-4 w-4/5 mx-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w- text-gray-400" />
                      <Input
                          placeholder="Buscar nivel..."
                          value={filtroGrafica}
                          onChange={(e) => setFiltroGrafica(e.target.value)}
                          className="pl-9"
                      />
                    </div>
              {barData.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {barData.map((item) => (
                    <div key={item.id} className="space-y-1 cursor-pointer" onClick={() => onBarClick({ activePayload: [{ payload: item }] })}>
                      <div className="flex justify-between text-sm font-medium text-gray-600">
                        <span className="truncate">{item.nombre}</span>
                        <span className="font-semibold">{item.alumnos_count}</span>
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