
'use client';

import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
  registro: Registro | null;
  nombreUsuario: string;
}

export default function Mapa({ isOpen, onClose, registro, nombreUsuario }: MapaModalProps) {
  if (!isOpen || !registro?.ubicacion) return null;

  const fecha = format(new Date(registro.created_at), 'PPPP', { locale: es });
  const hora = format(new Date(registro.created_at), 'hh:mm a', { locale: es });
  const tipoRegistro = registro.tipo_registro;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[70vh] flex flex-col m-auto"
          >
            <div className="flex flex-col p-4 border-b">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold">{nombreUsuario}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="h-5 w-5"/></button>
              </div>
              <p className="text-sm text-gray-600">{fecha} a las {hora}</p>
              <p className="text-sm text-gray-600 font-medium">Tipo de registro: {tipoRegistro}</p>
            </div>
            <div className="flex-grow p-4 overflow-y-auto flex flex-col">
              <div className="flex-grow">
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_Maps_API_KEY}&q=${registro.ubicacion.lat},${registro.ubicacion.lng}&zoom=16&maptype=satellite`}   >
                </iframe>
              </div>
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-2xl font-bold">Notas del registro:</h4>
                <p className="whitespace-pre-line text-2xl mt-1">{registro.notas || 'No hay notas'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}