'use client';

import React, { useState, useMemo, Fragment } from 'react';
import { 
  UserPlus, UserCheck, ChevronRight, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AsignarJefe from './modals/AsignarJefe';
import { motion, AnimatePresence } from 'framer-motion';

export default function Estructura({ datos, onReload }: { datos: any, onReload: () => void }) {
  const [nodosAbiertos, setNodosAbiertos] = useState<Record<string, boolean>>({});
  const [seleccion, setSeleccion] = useState<{id: string, nombre: string, jefe_id?: string} | null>(null);

  const arbol = useMemo(() => {
    const build = (parentId: string | null = null, parentPath: string = ''): any[] => {
      return datos.dependencias
        .filter((d: any) => d.parent_id === parentId && !d.es_puesto)
        .map((d: any) => {
          const currentPath = parentPath ? `${parentPath}.${d.no}` : `${d.no}`;
          return { 
            ...d, 
            path: currentPath, 
            hijos: build(d.id, currentPath) 
          };
        });
    };
    return build(null);
  }, [datos.dependencias]);

  const getBadgeColor = (depth: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-slate-400 dark:border-neutral-700'
    ];
    return colors[depth] || colors[3];
  };

  const Fila = ({ nodo, depth = 0 }: { nodo: any, depth?: number }) => {
    const tieneHijos = nodo.hijos.length > 0;
    const abierto = nodosAbiertos[nodo.id];
    const nombreJefe = nodo.jefe?.nombre;
    const tieneAsignacion = !!nombreJefe;

    return (
      <Fragment>
        <tr 
          onClick={() => tieneHijos && setNodosAbiertos(prev => ({...prev, [nodo.id]: !prev[nodo.id]}))}
          className="border-b border-slate-50 dark:border-neutral-800/50 hover:bg-slate-100/50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
        >
          <td className="py-3 px-2 md:px-4 align-top">
            <div className="flex items-start gap-2" style={{ paddingLeft: `${depth * (typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 20)}px` }}>
              <div className="w-4 h-4 mt-0.5 flex items-center justify-center shrink-0">
                {tieneHijos && (abierto ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>)}
              </div>
              
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border font-bold min-w-[24px] text-center shadow-sm shrink-0 mt-0.5 ${getBadgeColor(depth)}`}>
                {nodo.path}
              </span>

              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-bold uppercase leading-tight whitespace-normal break-words ${depth === 0 ? 'text-black dark:text-white' : tieneAsignacion ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-neutral-500'}`}>
                  {nodo.nombre}
                </span>

                {depth > 0 && (
                  <div className="mt-1.5">
                     {tieneAsignacion ? (
                        <div className="flex items-start gap-1.5">
                          <UserCheck className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-normal break-words leading-tight">
                            {nombreJefe}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-neutral-600 italic pl-0.5">Sin responsable</span>
                      )}
                  </div>
                )}
              </div>
            </div>
          </td>

          <td className="py-3 px-2 md:px-4 text-right w-px whitespace-nowrap align-top">
            {depth > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-[10px] font-bold uppercase text-slate-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSeleccion({ id: nodo.id, nombre: nodo.nombre, jefe_id: nodo.jefe_id });
                }}
              >
                <UserPlus className="w-3.5 h-3.5 md:mr-1" /> 
                <span className="hidden md:inline">Asignar</span>
              </Button>
            )}
          </td>
        </tr>
        <AnimatePresence initial={false}>
          {abierto && tieneHijos && (
            <motion.tr
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <td colSpan={2} className="p-0 border-none">
                <table className="w-full">
                  <tbody>
                    {nodo.hijos.map((h: any) => <Fila key={h.id} nodo={h} depth={depth + 1} />)}
                  </tbody>
                </table>
              </td>
            </motion.tr>
          )}
        </AnimatePresence>
      </Fragment>
    );
  };

  return (
    <>
      <div className="overflow-x-hidden w-full">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-neutral-950/50 text-left border-b border-gray-100 dark:border-neutral-800">
            <tr>
              <th className="py-3 px-2 md:px-4 font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider w-full">Jerarquía / Oficina</th>
              <th className="py-3 px-2 md:px-4 w-px whitespace-nowrap text-right font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>{arbol.map((n: any) => <Fila key={n.id} nodo={n} />)}</tbody>
        </table>
      </div>
      <AsignarJefe 
        seleccion={seleccion} 
        usuarios={datos.usuarios} 
        onClose={() => setSeleccion(null)} 
        onSuccess={onReload} 
      />
    </>
  );
}