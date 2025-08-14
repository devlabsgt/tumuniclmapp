'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
}

interface MapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  registro: Registro | null;
  nombreUsuario: string;
}

export default function Mapa({ isOpen, onClose, registro, nombreUsuario }: MapaModalProps) {
  if (!isOpen || !registro?.ubicacion) return null;

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
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold">
                {registro.tipo_registro === 'Ubicación Actual'
                  ? `Ubicación Actual de ${nombreUsuario}`
                  : `Asistencia de ${nombreUsuario} - ${format(new Date(registro.created_at), 'PPP', { locale: es })}`
                }
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-2">
              <iframe
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_Maps_API_KEY}&q=${registro.ubicacion.lat},${registro.ubicacion.lng}&zoom=16&maptype=satellite`}
              >
              </iframe>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}