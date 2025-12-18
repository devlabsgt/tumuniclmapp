'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, ArrowUpDown, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
}

interface MapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  registros: { entrada: Registro | null, salida: Registro | null, multiple?: Registro[] };
  nombreUsuario: string;
  titulo?: string;
}

type SortOrder = 'asc' | 'desc';

export default function Mapa({ isOpen, onClose, registros, nombreUsuario, titulo }: MapaModalProps) {
  const [rawRegistros, setRawRegistros] = useState<Registro[]>([]);
  const [registroActivo, setRegistroActivo] = useState<Registro | null>(null);
  const [mapaVisible, setMapaVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    if (isOpen) {
      let nuevosRegistros: Registro[] = [];
      if (registros.multiple && registros.multiple.length > 0) {
        nuevosRegistros = [...registros.multiple];
      } else {
        if (registros.entrada) nuevosRegistros.push(registros.entrada);
        if (registros.salida) nuevosRegistros.push(registros.salida);
      }
      
      setRawRegistros(nuevosRegistros);
      setMapaVisible(true);
      setSortOrder('asc');
    }
  }, [isOpen, registros]);

  const listaRegistros = useMemo(() => {
    const sorted = [...rawRegistros];
    if (sortOrder === 'asc') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [rawRegistros, sortOrder]);

  useEffect(() => {
    if (isOpen && listaRegistros.length > 0) {
      setRegistroActivo(listaRegistros[0]);
    } else if (isOpen) {
      setRegistroActivo(null);
    }
  }, [isOpen, listaRegistros]);


  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const fechaRegistro = rawRegistros.length > 0 ? rawRegistros[0].created_at : null;
  const fechaFormateada = fechaRegistro ? format(new Date(fechaRegistro), 'PPPP', { locale: es }) : '';

  const formatTimeWithAMPM = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${format(date, 'hh:mm', { locale: es })} ${format(date, 'a', { locale: es }).replace(/\./g, '').toUpperCase()}`;
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl dark:shadow-black/50 dark:border dark:border-neutral-800 w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Sidebar / Lista */}
            <div className={`
              w-full md:w-80 bg-slate-50 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col
              ${mapaVisible ? 'h-1/2' : 'h-full'}
              md:h-full
            `}>
              {/* Header Sidebar */}
              <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">
                    {titulo || 'Asistencia'}
                  </span>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm md:text-base" title={nombreUsuario}>
                    {nombreUsuario}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{fechaFormateada}</p>
                </div>
                <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0">
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Controles */}
              <div className="p-2 bg-gray-100 dark:bg-neutral-950/50 border-b border-gray-200 dark:border-neutral-800 grid grid-cols-2 gap-2">
                 <button
                    type="button"
                    onClick={toggleSortOrder}
                    className="w-full text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 p-2 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-sm border border-gray-200 dark:border-neutral-700"
                  >
                    <ArrowUpDown size={14} />
                    {sortOrder === 'asc' ? 'Recientes' : 'Antiguos'}
                  </button>
                
                 <button
                    type="button"
                    onClick={() => setMapaVisible(p => !p)}
                    className="w-full text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-2 rounded-md flex items-center justify-center gap-1.5 transition-colors shadow-sm border border-blue-100 dark:border-blue-900/30 md:hidden"
                  >
                    {mapaVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    {mapaVisible ? 'Ocultar Mapa' : 'Mostrar Mapa'}
                  </button>
              </div>
              
              {/* Lista de registros */}
              <div className="flex-grow overflow-y-auto p-2 space-y-2 scrollbar-thin dark:scrollbar-track-neutral-900 dark:scrollbar-thumb-neutral-700">
                {listaRegistros.map((registro, index) => {
                   const esTipoEstandar = ['Entrada', 'Salida'].includes(registro.tipo_registro || '');
                   const tituloPrincipal = esTipoEstandar 
                        ? (registro.tipo_registro) 
                        : (registro.notas || 'Marca sin nota');

                   return (
                    <button
                        key={index}
                        onClick={() => setRegistroActivo(registro)}
                        className={`w-full text-left p-3 rounded-lg transition-all border ${
                        registroActivo === registro 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                            : 'bg-white dark:bg-neutral-900/50 border-transparent hover:bg-gray-100 dark:hover:bg-neutral-800'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-1 gap-2">
                            <span className={`font-semibold text-sm line-clamp-2 ${registroActivo === registro ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                {tituloPrincipal}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                {formatTimeWithAMPM(registro.created_at)}
                            </span>
                        </div>

                        {esTipoEstandar && registro.notas && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2 line-clamp-3">
                                {registro.notas}
                            </p>
                        )}

                        <div className="flex justify-between items-end mt-2">
                            {registro.ubicacion ? (
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                                    <MapPin size={12} />
                                    <span>Ubicación registrada</span>
                                </div>
                            ) : <span className="text-[11px] text-gray-300 dark:text-neutral-600 italic">Sin ubicación</span>}
                        </div>
                    </button>
                   );
                })}
                {listaRegistros.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">No hay registros para mostrar.</p>
                )}
              </div>
            </div>

            {/* Area del Mapa */}
            <div className={`
              flex-grow flex flex-col relative bg-gray-50 dark:bg-neutral-950
              ${mapaVisible ? 'h-1/2' : 'hidden'}
              md:flex md:h-full
            `}>
               <button 
                 onClick={onClose} 
                 className="hidden md:flex absolute top-4 right-4 z-10 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-neutral-700 transition-colors border border-transparent dark:border-neutral-700"
               >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
               </button>

              {registroActivo && registroActivo.ubicacion ? (
                <div className="flex-grow relative min-h-0">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${registroActivo.ubicacion.lat},${registroActivo.ubicacion.lng}&z=17&output=embed&t=k`}
                  ></iframe>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950">
                  <MapPin size={48} className="text-gray-300 dark:text-neutral-700 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Sin ubicación</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Este registro no tiene datos de geolocalización.</p>
                </div>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}