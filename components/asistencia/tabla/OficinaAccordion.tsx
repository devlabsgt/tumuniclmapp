'use client';

import React, { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, List, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface OficinaAccordionProps {
  nombreOficina: string;
  registros: any[]; 
  vistaAgrupada: 'nombre' | 'fecha';
  estaAbierta: boolean;
  onToggle: () => void;
  onAbrirModal: (reg: any, nombre?: string) => void;
}

export default function OficinaAccordion({
  nombreOficina,
  registros,
  vistaAgrupada,
  estaAbierta,
  onToggle,
  onAbrirModal
}: OficinaAccordionProps) {
  
  let diaActual = "";

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return <span className="text-red-500 font-bold tracking-wider">--:--</span>;
    return format(parseISO(iso), 'hh:mm a', { locale: es });
  };

  const contarRegistrosReales = () => {
    if (vistaAgrupada === 'fecha') {
      return registros.filter(r => !r.esDiaVacio).length;
    }
    return registros.length; 
  };

  return (
    <Fragment>
      <tr className="border-b border-slate-100 dark:border-neutral-800">
        <td colSpan={3} className="p-1">
          <div
            onClick={onToggle}
            className="bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors py-2.5 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between rounded-sm"
          >
            <span>{nombreOficina} ({contarRegistrosReales()})</span>
            <motion.div
              initial={false}
              animate={{ rotate: estaAbierta ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </motion.div>
          </div>
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {estaAbierta && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: 'hidden' }}
          >
            <td colSpan={3} className="p-0">
              <table className="w-full">
                <tbody>
                  {vistaAgrupada === 'fecha' ? (
                    registros.map((registro: any, index: number) => {
                      const mostrarEncabezadoDia = registro.diaString !== diaActual;
                      if (mostrarEncabezadoDia) diaActual = registro.diaString;
                      
                      const esDiaVacio = registro.esDiaVacio;
                      const esMultiple = registro.multiple && registro.multiple.length > 0;

                      return (
                        <Fragment key={`${registro.userId}-${registro.diaString}-${index}`}>
                          {mostrarEncabezadoDia && (
                            <tr>
                              <td colSpan={3} className="bg-slate-50 dark:bg-neutral-900 py-1.5 px-4 font-medium text-slate-500 dark:text-slate-400 text-[11px] border-y border-slate-100 dark:border-neutral-800 uppercase tracking-wide">
                                {format(parseISO(registro.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                              </td>
                            </tr>
                          )}
                          
                          {esDiaVacio ? (
                             <tr className="border-b border-slate-100 dark:border-neutral-800">
                               <td colSpan={3} className="py-3 px-4 text-[11px] xl:text-xs text-red-500 font-medium italic pl-8">
                                 Sin registros de asistencia
                               </td>
                             </tr>
                          ) : (
                            <tr
                              className="border-b border-slate-100 dark:border-neutral-800 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 group cursor-pointer"
                              onClick={() => onAbrirModal(registro)}
                            >
                              <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[40%]">
                                {registro.nombre}
                              </td>
                              {esMultiple ? (
                                <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                  <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm font-medium text-[10px]">
                                    <List size={12} /> Ver Asistencia ({registro.multiple.length})
                                  </div>
                                </td>
                              ) : (
                                <>
                                  <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-400">
                                    {formatTime(registro.entrada?.created_at || registro.entrada?.fecha_hora)}
                                  </td>
                                  <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-400">
                                    {formatTime(registro.salida?.created_at || registro.salida?.fecha_hora)}
                                  </td>
                                </>
                              )}
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    registros.map((usuario: any) => {
                      const totalAusencias = usuario.asistencias.filter((a: any) => a.esAusencia).length;
                      const totalSinEntrada = usuario.asistencias.filter((a: any) => !a.esAusencia && !a.entrada && (!a.multiple || a.multiple.length === 0)).length;
                      const totalSinSalida = usuario.asistencias.filter((a: any) => !a.esAusencia && !a.salida && (!a.multiple || a.multiple.length === 0)).length;

                      return (
                        <Fragment key={usuario.userId}>
                          <tr>
                            <td colSpan={3} className="bg-slate-50 dark:bg-neutral-900 py-1.5 px-4 font-medium text-slate-500 dark:text-slate-400 text-[11px] border-y border-slate-100 dark:border-neutral-800 tracking-wide">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="uppercase text-slate-700 dark:text-slate-300 font-bold">{usuario.nombre}</span>
                                <div className="flex items-center gap-3 text-[10px]">
                                  {totalAusencias > 0 && (
                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                      <AlertCircle size={10} /> {totalAusencias} Inasistencias
                                    </span>
                                  )}
                                  {totalSinEntrada > 0 && (
                                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                                      <LogIn size={10} /> {totalSinEntrada} Sin Entrada
                                    </span>
                                  )}
                                  {totalSinSalida > 0 && (
                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                      <LogOut size={10} /> {totalSinSalida} Sin Salida
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                          {usuario.asistencias.map((asistencia: any, idx: number) => {
                            const esMultiple = asistencia.multiple && asistencia.multiple.length > 0;
                            const esAusencia = asistencia.esAusencia;

                            return (
                              <tr
                                key={`${usuario.userId}-${asistencia.diaString}-${idx}`}
                                className="border-b border-slate-100 dark:border-neutral-800 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 group cursor-pointer"
                                onClick={() => !esAusencia && onAbrirModal(asistencia, usuario.nombre)}
                              >
                                <td className={`py-3 px-4 text-[11px] xl:text-xs w-[40%] pl-8 ${esAusencia ? 'text-red-500 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {esAusencia 
                                    ? `${format(parseISO(asistencia.diaString + 'T00:00:00'), 'EEEE, d', { locale: es })} - Sin registros`
                                    : format(parseISO(asistencia.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })
                                  }
                                </td>
                                
                                {esAusencia ? (
                                  <>
                                    <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-red-500 font-bold tracking-wider">--:--</td>
                                    <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-red-500 font-bold tracking-wider">--:--</td>
                                  </>
                                ) : esMultiple ? (
                                  <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                    <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm font-medium text-[10px]">
                                      <List size={12} /> Ver Asistencia ({asistencia.multiple.length})
                                    </div>
                                  </td>
                                ) : (
                                  <>
                                    <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-400">
                                      {formatTime(asistencia.entrada?.created_at || asistencia.entrada?.fecha_hora)}
                                    </td>
                                    <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-400">
                                      {formatTime(asistencia.salida?.created_at || asistencia.salida?.fecha_hora)}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </Fragment>
  );
}