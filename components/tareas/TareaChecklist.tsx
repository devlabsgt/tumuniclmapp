'use client';

import { useState } from 'react';
import { ChecklistItem } from './types';
import { updateChecklist } from './actions'; 
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { Check, Edit2, Trash2, Plus, Loader2 } from 'lucide-react';

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

  // Estado para rastrear qué items específicos están cargando
  const [pendingIndices, setPendingIndices] = useState<number[]>([]);

  const sortedChecklist = checklist
    .map((item, index) => ({ ...item, originalIndex: index }))
    .sort((a, b) => {
        return Number(a.is_completed) - Number(b.is_completed);
    });

  const toggleCheck = async (idx: number) => {
    if (editingStepIndex !== null || isReadOnly || pendingIndices.includes(idx)) return;

    setPendingIndices(prev => [...prev, idx]);

    const newChecklist = [...checklist];
    newChecklist[idx].is_completed = !newChecklist[idx].is_completed;

    try { 
        await updateChecklist(tareaId, newChecklist); 
    } catch (error) { 
        toast.error('Error al actualizar'); 
    } finally {
        setPendingIndices(prev => prev.filter(i => i !== idx));
    }
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
        max-h-[70vh] sm:max-h-[450px] 
        overflow-y-auto 
        pr-1 sm:pr-2 
        mb-5
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700
        [&::-webkit-scrollbar-thumb]:rounded-full
    ">
        <ul className="space-y-2 pb-2">
            {sortedChecklist.map((item) => {
                const idx = item.originalIndex; 
                const isPending = pendingIndices.includes(idx);
                
                return (
                <li key={idx} 
                    className={`
                        flex items-start sm:items-center justify-between text-sm p-2 rounded-lg transition-all duration-300 group border
                        ${isPending 
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                            : 'border-transparent'
                        }
                        ${item.is_completed && !isPending
                            ? 'bg-slate-50/50 dark:bg-neutral-800/30' 
                            : !isPending && 'hover:bg-slate-50 dark:hover:bg-neutral-800 hover:border-slate-100 dark:hover:border-neutral-700'}
                    `}
                >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* CHECKBOX ANIMADO */}
                        <div 
                            onClick={() => toggleCheck(idx)}
                            className={`
                                mt-0.5 min-w-[20px] w-[20px] h-[20px] rounded flex items-center justify-center border shrink-0
                                transition-all duration-200 ease-in-out transform
                                ${!isReadOnly && !isPending ? 'active:scale-75 active:bg-slate-200 cursor-pointer' : ''}
                                ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}
                                ${isPending
                                    ? 'bg-white dark:bg-neutral-800 border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900 shadow-md scale-105' 
                                    : item.is_completed 
                                        ? 'bg-green-500 border-green-500 shadow-sm rotate-0' 
                                        : 'bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 hover:border-blue-400 dark:hover:border-blue-500 rotate-0'
                                }
                            `}
                        >
                            {isPending ? (
                                <Loader2 size={12} className="animate-spin text-blue-500" />
                            ) : (
                                <Check 
                                    size={14} 
                                    className={`text-white transition-all duration-200 ${item.is_completed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} 
                                    strokeWidth={4} 
                                />
                            )}
                        </div>
                        
                        {editingStepIndex === idx ? (
                            <div className="flex-1 flex gap-2 animate-in fade-in duration-200 min-w-0">
                                <input 
                                    type="text" 
                                    value={editingStepText}
                                    onChange={(e) => setEditingStepText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveStepEdit(idx)}
                                    autoFocus
                                    className="w-full text-base bg-white dark:bg-neutral-900 border border-blue-400 dark:border-blue-500 rounded px-2 py-1 focus:outline-none shadow-sm dark:text-gray-100"
                                />
                                <button onClick={() => saveStepEdit(idx)} className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 p-2 rounded shrink-0">
                                    <Check size={18} />
                                </button>
                            </div>
                        ) : (
                            <span 
                                onClick={() => toggleCheck(idx)}
                                className={`
                                    leading-tight select-none flex-1 transition-all break-words duration-200
                                    ${(isReadOnly || isPending) ? 'cursor-default' : 'cursor-pointer'}
                                    text-slate-700 dark:text-gray-200
                                    ${isPending ? 'opacity-80 font-medium text-blue-700 dark:text-blue-300' : ''} 
                                `}
                            >
                                {item.title}
                            </span>
                        )}
                    </div>

                    {/* --- BOTONES DE ACCIÓN (SIEMPRE VISIBLES) --- */}
                    {editingStepIndex !== idx && !isReadOnly && !isPending && (
                        <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button 
                                onClick={() => startEditingStep(idx, item.title)} 
                                className="p-2 text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDeleteItem(idx)} 
                                className="p-2 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </li>
            )})}
        </ul>

        {!isReadOnly && (
            <div className="flex gap-2 mt-2 sticky bottom-0 pt-2 pb-1">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={newItemText} 
                        onChange={(e) => setNewItemText(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()} 
                        placeholder="Escribe un nuevo paso..."
                        disabled={isAdding} 
                        className="w-full text-base pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder-gray-500 text-slate-700 dark:text-gray-100" 
                    />
                    <Plus size={16} className="absolute left-3 top-3.5 text-slate-400 dark:text-gray-500" />
                </div>
                <button 
                    onClick={handleAddItem} 
                    disabled={!newItemText.trim() || isAdding} 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none active:scale-95"
                >
                    {isAdding ? <Loader2 size={18} className="animate-spin"/> : "Añadir"}
                </button>
            </div>
        )}
    </div>
  );
}