'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Alumno } from '../lib/esquemas';

interface EstadisticasLugaresProps {
  alumnos: Alumno[];
}

export default function EstadisticasLugares({ alumnos }: EstadisticasLugaresProps) {
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
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Alumnos por Lugar</h3>
        <p className="text-gray-500">No hay alumnos inscritos en lugares para este programa.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white border rounded-xl shadow-lg"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">Alumnos por Lugar</h3>
      <div className="overflow-x-auto">
        <div className="space-y-4 min-w-[300px]">
          {alumnosPorLugar.map((item) => (
            <div key={item.nombre} className="flex items-center gap-4">
              <span className="w-1/4 sm:w-1/5 text-sm font-medium text-gray-600 truncate">{item.nombre}</span>
              <div className="relative flex-grow bg-gray-200 rounded-full h-6">
                <motion.div
                  className="bg-purple-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.alumnos / maxAlumnos) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white font-semibold text-xs drop-shadow-sm">{item.alumnos}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}