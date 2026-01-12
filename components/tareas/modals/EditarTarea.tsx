'use client';

import { useState, useEffect } from 'react';
import { Tarea } from '../types';
import { actualizarTarea } from '../actions';
import { X, Save, Calendar, AlignLeft, Type } from 'lucide-react';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tarea: Tarea;
}

export default function EditarTarea({ isOpen, onClose, tarea }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // 👇 FUNCIÓN CLAVE: Convierte UTC a formato local "YYYY-MM-DDTHH:MM"
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Sincronizar estados cuando se abre el modal
  useEffect(() => {
    if (isOpen && tarea) {
      setTitle(tarea.title);
      setDescription(tarea.description || '');
      setDueDate(formatDateForInput(tarea.due_date));
    }
  }, [isOpen, tarea]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isoDate = dueDate ? new Date(dueDate).toISOString() : null;

      await actualizarTarea(tarea.id, {
        title,
        description,
        due_date: isoDate as string
      });

      toast.success('Tarea actualizada correctamente');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Error al actualizar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Contenedor principal: 
          - Adaptado para móviles: max-h-[90vh] y overflow-y-auto para evitar cortes si sale el teclado.
          - En móviles se pega abajo o centro (dependiendo del flex items-end/center arriba).
      */}
      <div className="bg-white dark:bg-neutral-900 w-full sm:rounded-2xl rounded-t-2xl shadow-2xl max-w-lg flex flex-col transition-colors duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        {/* Padding reducido en móvil (p-4) y normal en desktop (sm:p-6) */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
            Editar Tarea
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          
          {/* TÍTULO */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
               <Type size={14}/> Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              // text-base evita zoom en iOS. w-full asegura ancho completo.
              className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-base text-gray-700 dark:text-gray-100 font-medium"
              required
            />
          </div>

          {/* FECHA Y HORA */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar size={14} /> Fecha y Hora Límite
            </label>
            <input
              type="datetime-local" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base text-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
              required
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlignLeft size={14} /> Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-base text-gray-700 dark:text-gray-100 resize-none"
            />
          </div>

          {/* FOOTER BUTTONS */}
          {/* Flex column-reverse en móvil para apilar botones (cancelar abajo), row en desktop */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-center"
            >
                Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}