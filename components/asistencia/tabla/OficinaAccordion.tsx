'use client';

import React, { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, List, AlertCircle, LogIn, LogOut, FileCheck } from 'lucide-react';
import { format, parseISO, isAfter, isToday, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { PermisoEmpleado } from '@/components/permisos/types';

interface OficinaAccordionProps {
  nombreOficina: string;
  registros: any[];
  vistaAgrupada: 'nombre' | 'fecha';
  estaAbierta: boolean;
  onToggle: () => void;
  onAbrirModal: (reg: any, nombre?: string) => void;
  permisosMap?: Record<string, PermisoEmpleado[]>;
  onVerPermiso?: (permiso: PermisoEmpleado) => void;
}

export default function OficinaAccordion({
  nombreOficina,
  registros,
  vistaAgrupada,
  estaAbierta,
  onToggle,
  onAbrirModal,
  permisosMap = {},
  onVerPermiso,
}: OficinaAccordionProps) {

  let diaActual = "";

  const formatTime = (iso: string | null | undefined, hasPermiso: boolean) => {
    if (!iso) return <span className={`${hasPermiso ? 'text-blue-500' : 'text-red-500'} font-bold`}>--:--</span>;
    return format(parseISO(iso), 'hh:mm aa', { locale: es });
  };

  const getPermisoParaDia = (userId: string, diaString: string): PermisoEmpleado | null => {
    const permisos = permisosMap[userId] || [];
    return permisos.find(p => {
      const ini = p.inicio.substring(0, 10);
      const fin = p.fin.substring(0, 10);
      return diaString >= ini && diaString <= fin;
    }) || null;
  };

  const JustificacionBtn = ({ permiso, totalRegistros, fechaStr }: { permiso: PermisoEmpleado | null, totalRegistros: number, fechaStr: string }) => {
    if (permiso) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onVerPermiso?.(permiso); }}
          className="w-full py-1 px-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-center text-[9px] leading-tight border border-blue-100 dark:border-blue-900/30 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-sm"
        >
          Permiso
        </button>
      );
    }

    const fechaDia = parseISO(fechaStr + 'T00:00:00');
    const esHoyOFuturo = isToday(fechaDia) || isAfter(fechaDia, startOfToday());

    if (esHoyOFuturo && totalRegistros === 0) {
      return null;
    }

    if (totalRegistros < 2) {
      if (esHoyOFuturo) {
        return (
          <div className="w-full py-1 px-1 rounded bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 font-bold flex items-center justify-center text-center text-[9px] leading-tight border border-gray-200 dark:border-neutral-700 cursor-default transition-colors shadow-sm">
            Esperando Asistencia
          </div>
        );
      }
      return (
        <div className="w-full py-1 px-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-center text-[9px] leading-tight border border-red-100 dark:border-red-900/30 cursor-default transition-colors shadow-sm">
          Sin Permiso
        </div>
      );
    }

    return (
      <div className="w-full py-1 px-1 rounded bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 font-bold flex items-center justify-center text-center text-[9px] leading-tight border border-green-100 dark:border-green-900/30 cursor-default transition-colors shadow-sm">
        Correcto
      </div>
    );
  };

  const contarRegistrosReales = () => {
    if (vistaAgrupada === 'fecha') return registros.filter(r => !r.esDiaVacio).length;
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

                      const esVacio = registro.esDiaVacio || registro.esAusencia;
                      const permiso = getPermisoParaDia(registro.userId, registro.diaString);
                      const esMultiple = registro.multiple && registro.multiple.length > 0;
                      const totalRegistros = (registro.entrada ? 1 : 0) + (registro.salida ? 1 : 0) + (registro.multiple?.length || 0);
                      // Fecha futura sin datos: no mostrar
                      if (isAfter(parseISO(registro.diaString + 'T00:00:00'), startOfToday()) && totalRegistros === 0 && !permiso) return null;

                      return (
                        <Fragment key={`${registro.userId}-${registro.diaString}-${index}`}>
                          {mostrarEncabezadoDia && (
                            <tr>
                              <td colSpan={3} className="bg-slate-100 dark:bg-neutral-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 border-t border-b border-slate-200 dark:border-neutral-700 capitalize text-xs">
                                {format(parseISO(registro.diaString + 'T00:00:00'), "eeee, d 'de' LLLL", { locale: es })}
                              </td>
                            </tr>
                          )}

                          <tr
                            className="border-b border-slate-100 dark:border-neutral-800 transition-colors"
                          >
                              {/* Nombre */}
                              <td className="py-2 px-3 text-xs text-slate-700 dark:text-slate-300 w-[45%]">
                                {registro.nombre}
                              </td>
                              {/* Asistencia + Permiso */}
                              <td colSpan={2} className="py-2 px-3">
                                <div className="flex items-center gap-1">
                                  <div
                                    className={`w-3/4 ${!esVacio ? 'cursor-pointer' : ''}`}
                                    onClick={() => !esVacio && onAbrirModal(registro)}
                                  >
                                    {esMultiple || totalRegistros > 2 ? (
                                      <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[9px]">
                                        Ver Asistencia ({totalRegistros})
                                      </div>
                                    ) : esVacio ? (
                                      <div className="flex flex-row flex-wrap gap-x-2 gap-y-0.5 items-center">
                                        <span className={`text-[9px] md:text-sm font-medium italic whitespace-nowrap ${permiso ? 'text-blue-500 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                                          Sin registros de asistencia
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-row flex-wrap gap-x-2 gap-y-0.5 items-center">
                                        <span className="text-[9px] md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                          <span className="font-bold text-gray-700 dark:text-gray-300">Ent: </span>
                                          {formatTime(registro.entrada?.created_at || registro.entrada?.fecha_hora, !!permiso)}
                                        </span>
                                        <span className="text-gray-300 dark:text-neutral-700">|</span>
                                        <span className="text-[9px] md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                          <span className="font-bold text-gray-700 dark:text-gray-300">Sal: </span>
                                          {formatTime(registro.salida?.created_at || registro.salida?.fecha_hora, !!permiso)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-1/4 flex-shrink-0">
                                    <JustificacionBtn permiso={permiso} totalRegistros={totalRegistros} fechaStr={registro.diaString} />
                                  </div>
                                </div>
                              </td>
                            </tr>
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
                          {/* Encabezado usuario */}
                          <tr>
                            <td colSpan={3} className="bg-slate-50 dark:bg-neutral-900 py-1.5 px-4 font-medium text-slate-500 dark:text-slate-400 text-[11px] border-y border-slate-100 dark:border-neutral-800 tracking-wide">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="uppercase text-slate-700 dark:text-slate-300 font-bold">{usuario.nombre}</span>
                                <div className="flex items-center gap-3 text-[9px] md:text-sm">
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
                          {/* Filas de asistencia */}
                          {usuario.asistencias.map((asistencia: any, idx: number) => {
                             const esMultiple = asistencia.multiple && asistencia.multiple.length > 0;
                             const esAusencia = asistencia.esAusencia;
                             const totalRegistros = (asistencia.entrada ? 1 : 0) + (asistencia.salida ? 1 : 0) + (asistencia.multiple?.length || 0);
                             const permiso = getPermisoParaDia(usuario.userId, asistencia.diaString);
                             // Fecha futura sin datos: no mostrar
                             if (isAfter(parseISO(asistencia.diaString + 'T00:00:00'), startOfToday()) && totalRegistros === 0 && !permiso) return null;

                            return (
                              <tr
                                key={`${usuario.userId}-${asistencia.diaString}-${idx}`}
                                className="border-b border-slate-100 dark:border-neutral-800 transition-colors"
                              >
                                {/* Fecha */}
                                 <td className={`py-2 px-3 text-xs w-[45%] pl-8 capitalize ${esAusencia ? 'text-red-500 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {format(parseISO(asistencia.diaString + 'T00:00:00'), "eee d 'de' MMM", { locale: es })}
                                  {esAusencia && <span className={`ml-1 text-[9px] italic ${permiso ? 'text-blue-500' : 'text-red-500'}`}>— Sin registros</span>}
                                </td>

                                {/* Asistencia + Permiso */}
                                <td colSpan={2} className="py-2 px-3">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={`w-3/4 ${!esAusencia ? 'cursor-pointer' : ''}`}
                                      onClick={() => !esAusencia && onAbrirModal(asistencia, usuario.nombre)}
                                    >
                                      {esAusencia ? (
                                        <div className="flex flex-row flex-wrap gap-x-2 gap-y-0.5 items-center">
                                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">Ent: </span>
                                            <span className="text-red-400">--:--</span>
                                          </span>
                                          <span className="text-gray-300 dark:text-neutral-700">|</span>
                                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">Sal: </span>
                                            <span className="text-red-400">--:--</span>
                                          </span>
                                        </div>
                                      ) : esMultiple || totalRegistros > 2 ? (
                                        <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[9px]">
                                          Ver Asistencia ({totalRegistros})
                                        </div>
                                      ) : (
                                        <div className="flex flex-row flex-wrap gap-x-2 gap-y-0.5 items-center">
                                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">Ent: </span>
                                            {formatTime(asistencia.entrada?.created_at || asistencia.entrada?.fecha_hora, !!permiso)}
                                          </span>
                                          <span className="text-gray-300 dark:text-neutral-700">|</span>
                                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">Sal: </span>
                                            {formatTime(asistencia.salida?.created_at || asistencia.salida?.fecha_hora, !!permiso)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="w-1/4 flex-shrink-0">
                                      <JustificacionBtn permiso={permiso} totalRegistros={totalRegistros} fechaStr={asistencia.diaString} />
                                    </div>
                                  </div>
                                </td>
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