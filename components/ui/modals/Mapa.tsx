'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin } from 'lucide-react';
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
}

export default function Mapa({ isOpen, onClose, registros, nombreUsuario }: MapaModalProps) {
  const [listaRegistros, setListaRegistros] = useState<Registro[]>([]);
  const [registroActivo, setRegistroActivo] = useState<Registro | null>(null);

  useEffect(() => {
    if (isOpen) {
      let nuevosRegistros: Registro[] = [];
      if (registros.multiple && registros.multiple.length > 0) {
        nuevosRegistros = [...registros.multiple];
      } else {
        if (registros.entrada) nuevosRegistros.push(registros.entrada);
        if (registros.salida) nuevosRegistros.push(registros.salida);
      }
      
      nuevosRegistros.sort((b, a) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      setListaRegistros(nuevosRegistros);
      if (nuevosRegistros.length > 0) {
        setRegistroActivo(nuevosRegistros[0]);
      } else {
        setRegistroActivo(null);
      }
    }
  }, [isOpen, registros]);

  const fechaRegistro = listaRegistros.length > 0 ? listaRegistros[0].created_at : null;
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* --- LISTA LATERAL --- */}
            <div className="w-full md:w-80 bg-slate-50 border-r flex flex-col h-1/3 md:h-full">
              <div className="p-4 border-b flex justify-between items-center bg-white">
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-gray-800 truncate" title={nombreUsuario}>{nombreUsuario}</h3>
                  <p className="text-xs text-gray-500 truncate">{fechaFormateada}</p>
                </div>
                <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-2 space-y-2 scrollbar-thin">
                {listaRegistros.map((registro, index) => {
                   // LÓGICA DE VISUALIZACIÓN
                   const esTipoEstandar = ['Entrada', 'Salida'].includes(registro.tipo_registro || '');
                   // Si NO es estándar (es Multiple), usamos la nota como título principal.
                   const tituloPrincipal = esTipoEstandar 
                        ? (registro.tipo_registro) 
                        : (registro.notas || 'Marca sin nota');

                   return (
                    <button
                        key={index}
                        onClick={() => setRegistroActivo(registro)}
                        className={`w-full text-left p-3 rounded-lg transition-all border ${
                        registroActivo === registro 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-white border-transparent hover:bg-gray-100'
                        }`}
                    >
                        {/* Fila Superior: Título (Tipo o Nota según el caso) y Hora */}
                        <div className="flex justify-between items-start mb-1 gap-2">
                            <span className={`font-semibold text-sm line-clamp-2 ${registroActivo === registro ? 'text-blue-700' : 'text-gray-700'}`}>
                                {tituloPrincipal}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                {formatTimeWithAMPM(registro.created_at)}
                            </span>
                        </div>

                        {/* Si es estándar y tiene notas, las mostramos debajo en texto normal */}
                        {esTipoEstandar && registro.notas && (
                            <p className="text-xs text-gray-600 mt-1 mb-2 line-clamp-3">
                                {registro.notas}
                            </p>
                        )}

                        {/* Fila Inferior: Ubicación */}
                        <div className="flex justify-between items-end mt-2">
                            {registro.ubicacion ? (
                                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                    <MapPin size={12} />
                                    <span>Ubicación registrada</span>
                                </div>
                            ) : <span className="text-[11px] text-gray-300 italic">Sin ubicación</span>}
                        </div>
                    </button>
                   );
                })}
                {listaRegistros.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No hay registros para mostrar.</p>
                )}
              </div>
            </div>

            {/* --- MAPA PRINCIPAL --- */}
            <div className="flex-grow flex flex-col h-2/3 md:h-full relative">
               <button 
                 onClick={onClose} 
                 className="hidden md:flex absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
               >
                  <X className="h-5 w-5 text-gray-600" />
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
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_Maps_API_KEY}&q=${registroActivo.ubicacion.lat},${registroActivo.ubicacion.lng}&zoom=17&maptype=satellite`}
                  ></iframe>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50">
                  <MapPin size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Sin ubicación</p>
                  <p className="text-gray-400 text-sm">Este registro no tiene datos de geolocalización.</p>
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