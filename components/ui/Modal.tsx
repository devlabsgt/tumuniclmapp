'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, className = "max-w-lg" }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Overlay para cerrar al hacer click fuera */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      {/* Contenido del Modal */}
      <div className={`relative bg-white dark:bg-neutral-900 w-full ${className} sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 dark:border-neutral-800 transition-all z-10 overflow-hidden`}>
        
        {/* HEADER: Siempre visible para mostrar la X */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
            {/* Si hay título lo mostramos, si no, un div vacío para mantener el espacio */}
            {title ? (
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                {title}
              </h2>
            ) : <div />}
            
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
        </div>
      </div>
    </div>,
    document.body
  );
}