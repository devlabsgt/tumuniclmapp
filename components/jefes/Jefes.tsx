'use client';

import React, { useState, useMemo } from 'react';
import { User, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Jefes({ datos }: { datos: any }) {
  const [jefeAbierto, setJefeAbierto] = useState<string | null>(null);

  const jefes = useMemo(() => {
    const listaJefes = datos.usuarios.filter((u: any) => u.esjefe);
    
    return listaJefes.map((jefe: any) => {
      const dependencias = datos.dependencias.filter((d: any) => d.jefe_id === jefe.user_id);
      return { ...jefe, dependencias };
    }).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
  }, [datos]);

  return (
    <div className="space-y-2">
      {jefes.length === 0 ? (
        <div className="p-8 text-center text-slate-400 dark:text-neutral-600 text-xs uppercase font-medium italic">
          No hay jefes asignados actualmente
        </div>
      ) : (
        jefes.map((jefe: any) => {
          const isOpen = jefeAbierto === jefe.user_id;
          return (
            <div key={jefe.user_id} className="border border-slate-100 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900 overflow-hidden w-full">
              <button
                onClick={() => setJefeAbierto(isOpen ? null : jefe.user_id)}
                className={`w-full flex items-start justify-between p-3 text-left transition-colors ${isOpen ? 'bg-slate-50 dark:bg-neutral-800' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'}`}
              >
                <div className="flex items-start gap-3 max-w-[90%]">
                  <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${isOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-500'}`}>
                    <User size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase text-slate-700 dark:text-gray-200 whitespace-normal break-words leading-tight">
                    {jefe.nombre}
                  </span>
                </div>
                <div className="text-slate-400 mt-1 shrink-0">
                   {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-50/50 dark:bg-black/20"
                  >
                    <div className="p-3 pl-11 space-y-2 border-t border-slate-100 dark:border-neutral-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dependencias Asignadas</p>
                      {jefe.dependencias.length > 0 ? (
                        <div className="space-y-2">
                          {jefe.dependencias.map((dep: any) => (
                            <div key={dep.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 p-2 bg-white dark:bg-neutral-800 rounded border border-slate-100 dark:border-neutral-700">
                              <Building2 size={12} className="text-blue-500 mt-0.5 shrink-0" />
                              <span className="uppercase font-medium whitespace-normal break-words leading-tight">{dep.nombre}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-red-400 italic">Usuario marcado como jefe pero sin dependencias activas.</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
}