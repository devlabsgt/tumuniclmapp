'use client';

import { useState } from 'react';
import { crearTarea } from '../actions';
import { Usuario, ChecklistItem } from '../types';
import { X, Plus, Trash2, Calendar, User, AlignLeft, CheckSquare } from 'lucide-react';
// 👇 1. IMPORTAMOS TOASTIFY
import { toast } from 'react-toastify'; 

interface NewTareaProps {
  isOpen: boolean;
  onClose: () => void;
  usuarios: Usuario[];
  usuarioActual: string;
  esJefe: boolean;
}

export default function NewTarea({ isOpen, onClose, usuarios, usuarioActual, esJefe }: NewTareaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Si no es jefe, siempre será usuarioActual, pero el estado inicial lo dejamos flexible
  const [assignedTo, setAssignedTo] = useState(usuarioActual); 
  
  // Estado del Checklist
  const [checklistInput, setChecklistInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  if (!isOpen) return null;

  // --- MANEJO DEL CHECKLIST ---
  const addChecklistItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!checklistInput.trim()) return;

    const newItem: ChecklistItem = {
      title: checklistInput.trim(),
      is_completed: false
    };

    setChecklist([...checklist, newItem]);
    setChecklistInput('');
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  // --- ENVIAR FORMULARIO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!title.trim() || !dueDate) {
      setError('Por favor completa el título y la fecha.');
      toast.warning('Faltan datos obligatorios'); 
      setIsSubmitting(false);
      return;
    }

    try {
      await crearTarea({
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
        assigned_to: esJefe ? assignedTo : usuarioActual,
        checklist: checklist,
        status: 'Asignado'
      });
      
      // 👇 2. NOTIFICACIÓN DE ÉXITO (VERDE)
      toast.success('¡Tarea creada correctamente!'); 

      // Limpiar y cerrar
      setTitle('');
      setDescription('');
      setDueDate('');
      setChecklist([]);
      setAssignedTo(usuarioActual);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al crear la tarea');
      
      // 👇 3. NOTIFICACIÓN DE ERROR (ROJA)
      toast.error(err.message || 'Error al guardar'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Contenedor principal: 
          - items-end en mobile: pega el modal abajo.
          - rounded-t-2xl en mobile: solo redondea arriba.
          - max-h-[90vh] y overflow-y-auto: Scroll seguro.
      */}
      <div className="bg-white dark:bg-neutral-900 w-full rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg max-h-[90vh] overflow-y-auto flex flex-col transition-colors duration-200">
        
        {/* HEADER */}
        {/* Padding reducido en mobile (p-4 vs sm:p-6) */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-500">Nueva Tarea</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        {/* Padding ajustado para no desperdiciar espacio en mobile */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          
          {/* TÍTULO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título de la tarea</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar documentación..."
              // text-base evita el zoom en iOS. p-3 es más compacto que p-4
              className="w-full p-3 sm:p-4 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-base text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* FECHA Y ASIGNACIÓN (GRID) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Calendar size={14} /> Fecha Límite
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                // text-base para iOS
                className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base text-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
              />
            </div>

            {/* ASIGNAR A */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User size={14} /> Asignar a
              </label>
              <div className="relative">
                <select
                    value={esJefe ? assignedTo : usuarioActual} 
                    onChange={(e) => setAssignedTo(e.target.value)}
                    disabled={!esJefe}
                    // text-base para evitar zoom
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base appearance-none
                    ${esJefe 
                        ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 cursor-pointer text-gray-700 dark:text-gray-200' 
                        : 'bg-gray-100 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <option value={usuarioActual}>(Auto-asignado a mí)</option>
                    {usuarios.filter(u => u.user_id !== usuarioActual).map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                        {user.nombre}
                    </option>
                    ))}
                </select>
                
                {!esJefe && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">
                        * Solo admin asigna a otros.
                    </p>
                )}
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlignLeft size={14} /> Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              // text-base y p-3 para mejor ajuste móvil
              className="w-full p-3 sm:p-4 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-base text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
            />
          </div>

          {/* CHECKLIST */}
          <div className="space-y-3 bg-blue-50/30 dark:bg-blue-900/10 p-3 sm:p-4 rounded-xl border border-blue-100/50 dark:border-blue-800/50">
            <label className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <CheckSquare size={14} /> Lista de verificación
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem(e)}
                placeholder="Escribe un paso..."
                // text-base para iOS
                className="flex-1 p-3 bg-white dark:bg-neutral-900 border border-blue-100 dark:border-blue-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-base text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => addChecklistItem()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center shrink-0"
              >
                <Plus size={20} />
              </button>
            </div>

            {checklist.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-lg border border-gray-100 dark:border-neutral-800 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1 mr-2">• {item.title}</span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(idx)}
                      // Área táctil mejorada (p-2)
                      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2 italic">Sin items todavía</p>
            )}
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* FOOTER BUTTONS */}
          <div className="pt-2 pb-2 sm:pb-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={20} /> Crear Tarea
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}