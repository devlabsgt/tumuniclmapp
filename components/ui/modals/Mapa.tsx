'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, NotebookText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Registro {
  created_at: string;
  tipo_registro: 'Entrada' | 'Salida' | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
}

interface MapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  registros: {
    entrada: Registro | null;
    salida: Registro | null;
  };
  nombreUsuario: string;
}

export default function Mapa({ isOpen, onClose, registros, nombreUsuario }: MapaModalProps) {
  const [activeTab, setActiveTab] = useState<'Entrada' | 'Salida'>('Entrada');
  const [notasAbiertas, setNotasAbiertas] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (registros.entrada) {
        setActiveTab('Entrada');
      } else if (registros.salida) {
        setActiveTab('Salida');
      }
      setNotasAbiertas(false);
    }
  }, [isOpen, registros]);

  const registroActivo = activeTab === 'Entrada' ? registros.entrada : registros.salida;
  const fechaRegistro = registros.entrada?.created_at || registros.salida?.created_at;
  const fechaFormateada = fechaRegistro ? format(new Date(fechaRegistro), 'PPPP', { locale: es }) : '';

  const formatTimeWithAMPM = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hora = format(date, 'hh:mm', { locale: es });
    const periodo = format(date, 'a', { locale: es }).replace(/\./g, '').toUpperCase();
    return `${hora} ${periodo}`;
  };

  const horaEntrada = formatTimeWithAMPM(registros.entrada?.created_at);
  const horaSalida = formatTimeWithAMPM(registros.salida?.created_at);
  
  if (!isOpen || !fechaRegistro) {
    return null;
  }

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
            className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col m-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border-b flex-shrink-0 gap-2 md:gap-4">
              <div className="flex-shrink-0">
                <h3 className="text-lg md:text-xl font-semibold">{nombreUsuario}</h3>
                <p className="text-xs md:text-sm text-gray-600">{fechaFormateada}</p>
              </div>

              <div className="flex items-center gap-2 md:ml-auto">
                <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('Entrada')}
                    disabled={!registros.entrada}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'Entrada' ? 'bg-white shadow-sm text-blue-600' : 'bg-transparent text-gray-600'}`}
                  >
                    Entrada {horaEntrada && <span className="font-normal text-xs md:text-sm">{horaEntrada}</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('Salida')}
                    disabled={!registros.salida}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'Salida' ? 'bg-white shadow-sm text-blue-600' : 'bg-transparent text-gray-600'}`}
                  >
                    Salida {horaSalida && <span className="font-normal text-xs md:text-sm">{horaSalida}</span>}
                  </button>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>
            
            {registroActivo && registroActivo.ubicacion ? (
              <div className="flex-grow relative min-h-0">
                
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_Maps_API_KEY}&q=${registroActivo.ubicacion.lat},${registroActivo.ubicacion.lng}&zoom=16&maptype=satellite`}
                ></iframe>

                <div className="absolute top-3 left-3 right-3 flex flex-col-reverse gap-2 pointer-events-none">
                  <AnimatePresence>
                    {notasAbiertas && registroActivo.notas && (
                      <motion.div
                        className="w-full bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg pointer-events-auto"
                        initial={{ x: "110%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "110%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      >
                        <h4 className="text-sm font-semibold text-gray-600 mb-1">NOTAS DEL REGISTRO</h4>
                        <p className="whitespace-pre-wrap text-gray-800 text-sm max-h-32 overflow-y-auto">
                            {registroActivo.notas}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                      layout
                      onClick={() => setNotasAbiertas(prev => !prev)}
                      disabled={!registroActivo.notas}
                      className="flex items-center justify-end gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg pointer-events-auto disabled:opacity-70 disabled:cursor-not-allowed hover:bg-white transition-colors self-end"
                    >
                      <NotebookText size={18} className="text-gray-600" />
                      <span className="text-sm font-semibold text-gray-800">
                          {registroActivo.notas ? (notasAbiertas ? 'Ocultar' : 'Ver Notas') : 'No hay notas'}
                      </span>
                  </motion.button>
                </div>

              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500 p-8 text-center">No hay datos de ubicación para este registro.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}