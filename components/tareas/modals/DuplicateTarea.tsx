'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Calendar, User, AlignLeft, CheckSquare, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { Tarea, Usuario, ChecklistItem } from '../types'; 
import { duplicarTarea } from '../actions'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tareaOriginal: Tarea | null | undefined; 
  usuarios: Usuario[];
  esJefe: boolean;
}

export default function DuplicateTarea({ isOpen, onClose, tareaOriginal, usuarios, esJefe }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  
  // Estados para añadir nuevo item
  const [newItemText, setNewItemText] = useState('');
  
  // Estados para editar item existente
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Dropdown de usuarios
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!isOpen || !tareaOriginal) return;

    setTitle(`${tareaOriginal.title || ''} (Copia)`);
    setDescription(tareaOriginal.description || '');
    setAssignedTo(tareaOriginal.assigned_to || '');

    let fechaInput = '';
    if (tareaOriginal.due_date) {
        try {
            const d = new Date(tareaOriginal.due_date);
            const offset = d.getTimezoneOffset() * 60000;
            const localDate = new Date(d.getTime() - offset);
            fechaInput = localDate.toISOString().slice(0, 16);
        } catch(e) { 
           // Fallback silencioso
        }
    }
    setDueDate(fechaInput);

    const chk = Array.isArray(tareaOriginal.checklist) 
        ? tareaOriginal.checklist.map(c => ({ title: c.title || '', is_completed: false }))
        : [];
    setChecklist(chk);
    
    // Resetear estados de edición al abrir
    setEditingIndex(null);
    setEditingText('');
    setNewItemText('');

  }, [isOpen, tareaOriginal]);

  // --- LOGICA ITEMS ---
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setChecklist([...checklist, { title: newItemText, is_completed: false }]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
    // Si borramos el que se estaba editando, cancelamos edición
    if (editingIndex === index) {
        cancelEditing();
    }
  };

  // Funciones de Edición
  const startEditing = (index: number, currentTitle: string) => {
    setEditingIndex(index);
    setEditingText(currentTitle);
  };

  const saveEditing = () => {
    if (editingIndex === null || !editingText.trim()) return;
    
    const updatedChecklist = [...checklist];
    updatedChecklist[editingIndex].title = editingText.trim();
    setChecklist(updatedChecklist);
    
    cancelEditing();
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) { toast.warning('Falta el título'); return; }
    if (!dueDate) { toast.warning('Falta la fecha'); return; }

    setIsSubmitting(true);
    
    try {
        const fechaISO = new Date(dueDate).toISOString();
        
        const datosAEnviar = {
            title: title.trim(),
            description: description.trim(),
            due_date: fechaISO,
            assigned_to: assignedTo,
            checklist: checklist
        };

        await duplicarTarea(datosAEnviar);

        toast.success('¡Tarea duplicada correctamente!');
        onClose();

    } catch (error: any) {
        toast.error(`Error: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsuarios = usuarios.filter(u => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedUser = usuarios.find(u => u.user_id === assignedTo);
  const nombreAsignado = selectedUser?.nombre || 'Seleccionar...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Copy size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Duplicar Actividad</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                <X size={20} />
            </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            
            {/* Título */}
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Título</label>
                <input 
                    className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Título de la tarea"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Fecha */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <Calendar size={14} /> Fecha
                    </label>
                    <input 
                        type="datetime-local"
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                    />
                </div>

                {/* Asignado */}
                <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                        <User size={14} /> Asignado
                     </label>
                     <div className="relative">
                        <button 
                            type="button" 
                            disabled={!esJefe}
                            onClick={() => setShowDropdown(!showDropdown)} 
                            className={`w-full px-4 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800 text-left flex justify-between items-center text-sm ${!esJefe ? 'opacity-70 cursor-not-allowed' : 'hover:border-indigo-300 dark:hover:border-neutral-600'}`}
                        >
                            <span className="text-gray-800 dark:text-white truncate">{nombreAsignado}</span>
                            {esJefe && <span className="text-gray-400 text-xs">▼</span>}
                        </button>

                        {showDropdown && esJefe && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#252525] border border-gray-100 dark:border-neutral-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                                <div className="p-2 sticky top-0 bg-white dark:bg-[#252525] border-b dark:border-neutral-700">
                                    <input
                                      type="text"
                                      placeholder="Buscar..."
                                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      autoFocus
                                    />
                                </div>
                                {filteredUsuarios.map(u => (
                                    <div 
                                        key={u.user_id} 
                                        onClick={() => { setAssignedTo(u.user_id); setShowDropdown(false);}} 
                                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-2 ${assignedTo === u.user_id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        {u.nombre}
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <AlignLeft size={14} /> Descripción
                </label>
                <textarea 
                    className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                    rows={3}
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Detalles de la tarea..."
                />
            </div>

             {/* Checklist */}
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckSquare size={14} /> Pendientes ({checklist.length})
                </label>
                <div className="border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800/50 overflow-hidden">
                    {checklist.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                            {checklist.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center p-3 hover:bg-white dark:hover:bg-neutral-800 transition-colors group">
                                    <span className="text-gray-400 dark:text-gray-600 self-center">•</span>
                                    
                                    {/* MODO EDICIÓN vs MODO VISUALIZACIÓN */}
                                    {editingIndex === idx ? (
                                        <div className="flex-1 flex gap-2 items-center animate-in fade-in duration-200">
                                            <input 
                                                type="text"
                                                className="flex-1 px-2 py-1 bg-white dark:bg-neutral-900 border border-indigo-300 dark:border-indigo-700 rounded-md outline-none text-sm text-gray-800 dark:text-white"
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if(e.key === 'Enter') { e.preventDefault(); saveEditing(); }
                                                    if(e.key === 'Escape') cancelEditing();
                                                }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={saveEditing}
                                                className="p-1.5 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg"
                                                title="Guardar"
                                            >
                                                <Check size={16}/>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={cancelEditing}
                                                className="p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                                                title="Cancelar"
                                            >
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span 
                                                className="flex-1 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                                                onClick={() => startEditing(idx, item.title)}
                                                title="Clic para editar"
                                            >
                                                {item.title}
                                            </span>
                                            
                                            <div className="flex items-center gap-1">
                                                {/* Botón Editar */}
                                                <button 
                                                    type="button" 
                                                    onClick={() => startEditing(idx, item.title)}
                                                    className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="Editar item"
                                                >
                                                    <Edit2 size={16}/>
                                                </button>
                                                
                                                {/* Botón Eliminar */}
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar item"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-400 text-sm italic">Sin pendientes</div>
                    )}
                    
                    <div className="p-2 flex gap-2 border-t border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                        <input 
                            className="flex-1 px-3 py-2 bg-transparent text-sm text-gray-700 dark:text-white outline-none placeholder:text-gray-400"
                            placeholder="Añadir..."
                            value={newItemText} 
                            onChange={e => setNewItemText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                        />
                        <button 
                            type="button" 
                            onClick={handleAddItem} 
                            disabled={!newItemText.trim()}
                            className="p-2 bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Plus size={18}/>
                        </button>
                    </div>
                </div>
            </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 flex justify-end gap-3">
            <button 
                onClick={onClose} 
                className="px-5 py-2.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors text-sm"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
                {isSubmitting ? 'Duplicando...' : 'Crear Duplicado'}
            </button>
        </div>

      </div>
    </div>
  );
}