'use client';

import { useState } from 'react';
import { ChecklistItem } from './types';
import { updateChecklist } from './actions'; 
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { Check, Edit2, Trash2, Plus } from 'lucide-react';

interface Props {
  tareaId: string;
  checklist: ChecklistItem[];
  isReadOnly: boolean; 
}

export default function TareaChecklist({ tareaId, checklist, isReadOnly }: Props) {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStepText, setEditingStepText] = useState('');

  // --- HANDLERS ---
  const toggleCheck = async (idx: number) => {
    if (editingStepIndex !== null || isReadOnly) return;
    const newChecklist = [...checklist];
    newChecklist[idx].is_completed = !newChecklist[idx].is_completed;
    try { await updateChecklist(tareaId, newChecklist); } catch (error) { toast.error('Error al actualizar'); }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim() || isReadOnly) return;
    setIsAdding(true);
    const newItem: ChecklistItem = { title: newItemText, is_completed: false };
    const newChecklist = [...checklist, newItem];
    try {
        await updateChecklist(tareaId, newChecklist);
        setNewItemText('');
        toast.success('Paso agregado');
    } catch (error) { toast.error('Error'); } finally { setIsAdding(false); }
  };

  const handleDeleteItem = async (idx: number) => {
    if (isReadOnly) return;
    const result = await Swal.fire({
        title: '¿Eliminar paso?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const newChecklist = checklist.filter((_, index) => index !== idx);
        try { 
            await updateChecklist(tareaId, newChecklist); 
            toast.info('Paso eliminado'); 
        } catch (error) { toast.error('Error al eliminar paso'); }
    }
  };

  const startEditingStep = (idx: number, currentText: string) => {
    if (isReadOnly) return;
    setEditingStepIndex(idx);
    setEditingStepText(currentText);
  };

  const saveStepEdit = async (idx: number) => {
    if (!editingStepText.trim()) return;
    const newChecklist = [...checklist];
    newChecklist[idx].title = editingStepText;
    try {
        await updateChecklist(tareaId, newChecklist);
        setEditingStepIndex(null);
        setEditingStepText('');
        toast.success('Paso modificado');
    } catch (error) { toast.error('Error al guardar paso'); }
  };

  return (
    <div className="
        max-h-[30vh] sm:max-h-[220px] 
        overflow-y-auto 
        pr-1 sm:pr-2 
        mb-5
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700
        [&::-webkit-scrollbar-thumb]:rounded-full
    ">
        <ul className="space-y-2 pb-2">
            {checklist.map((item, idx) => (
            <li key={idx} 
                className={`flex items-start sm:items-center justify-between text-sm p-2 rounded-lg transition-colors group border border-transparent
                ${item.is_completed 
                    ? 'bg-slate-50/50 dark:bg-neutral-800/30 text-slate-400 dark:text-gray-500' 
                    : 'hover:bg-slate-50 dark:hover:bg-neutral-800 hover:border-slate-100 dark:hover:border-neutral-700 text-slate-700 dark:text-gray-200'}`}
            >
                 <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div 
                        onClick={() => toggleCheck(idx)}
                        // Área táctil ligeramente más grande para el dedo (mt-0.5 para alinear con texto)
                        className={`mt-0.5 min-w-[20px] w-[20px] h-[20px] rounded flex items-center justify-center transition-all border shrink-0
                        ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} 
                        ${item.is_completed 
                            ? 'bg-green-500 border-green-500 shadow-sm' 
                            : 'bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
                    >
                        {item.is_completed && <Check size={14} className="text-white" strokeWidth={4} />}
                    </div>
                    
                    {editingStepIndex === idx ? (
                        <div className="flex-1 flex gap-2 animate-in fade-in duration-200 min-w-0">
                            <input 
                                type="text" 
                                value={editingStepText}
                                onChange={(e) => setEditingStepText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveStepEdit(idx)}
                                autoFocus
                                // text-base evita zoom en iOS
                                className="w-full text-base bg-white dark:bg-neutral-900 border border-blue-400 dark:border-blue-500 rounded px-2 py-1 focus:outline-none shadow-sm dark:text-gray-100"
                            />
                            <button onClick={() => saveStepEdit(idx)} className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 p-2 rounded shrink-0">
                                <Check size={18} />
                            </button>
                        </div>
                    ) : (
                        <span 
                            onClick={() => toggleCheck(idx)}
                            // break-words permite que textos largos no rompan el layout en móvil
                            className={`leading-tight select-none flex-1 transition-all break-words
                            ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}
                            ${item.is_completed ? 'line-through opacity-60' : ''}`}
                        >
                            {item.title}
                        </span>
                    )}
                </div>

                {editingStepIndex !== idx && !isReadOnly && (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button 
                            onClick={() => startEditingStep(idx, item.title)} 
                            // p-2 para mejor touch target
                            className="p-2 text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleDeleteItem(idx)} 
                            // p-2 para mejor touch target
                            className="p-2 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </li>
            ))}
        </ul>

        {!isReadOnly && (
            <div className="flex gap-2 mt-2 sticky bottom-0 bg-white dark:bg-neutral-900 pt-2 pb-1">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={newItemText} 
                        onChange={(e) => setNewItemText(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()} 
                        placeholder="Escribe un nuevo paso..."
                        disabled={isAdding} 
                        // text-base evita zoom en iOS
                        className="w-full text-base pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder-gray-500 text-slate-700 dark:text-gray-100" 
                    />
                    <Plus size={16} className="absolute left-3 top-3.5 text-slate-400 dark:text-gray-500" />
                </div>
                <button 
                    onClick={handleAddItem} 
                    disabled={!newItemText.trim() || isAdding} 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none"
                >
                    Añadir
                </button>
            </div>
        )}
    </div>
  );
}