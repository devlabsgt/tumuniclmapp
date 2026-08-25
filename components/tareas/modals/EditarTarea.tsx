'use client';

import { useState, useEffect } from 'react';
import { Tarea, ActMiembro, AsignacionMiembro, Usuario } from '../types';
import { X, Save, Calendar, AlignLeft, Type, Lock, Users, Plus, Trash2, ChevronDown } from 'lucide-react'; 
import { toast } from 'react-toastify';
import { useTareaMutations } from '../hooks'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tarea: Tarea;
  esJefe: boolean;
  usuarios: Usuario[];
}

export default function EditarTarea({ isOpen, onClose, tarea, esJefe, usuarios }: Props) {
  const { actualizar, addMiembro, removeMiembro } = useTareaMutations(); 
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // ── Estado de miembros ─────────────────────────────────────────────────────
  const [miembrosActuales, setMiembrosActuales] = useState<ActMiembro[]>([]);
  const [mostrarPanelMiembros, setMostrarPanelMiembros] = useState(false);
  const [miembroSearchTerm, setMiembroSearchTerm] = useState('');
  const [showMiembroDropdown, setShowMiembroDropdown] = useState(false);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<{ userId: string; nombre: string } | null>(null);
  const [miembroAsignacionInput, setMiembroAsignacionInput] = useState('');
  const [miembroAsignaciones, setMiembroAsignaciones] = useState<AsignacionMiembro[]>([]);
  const [agregandoMiembro, setAgregandoMiembro] = useState(false);

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

  useEffect(() => {
    if (isOpen && tarea) {
      setTitle(tarea.title);
      setDescription(tarea.description || '');
      setDueDate(formatDateForInput(tarea.due_date));
      setMiembrosActuales(tarea.miembros || []);
      // Abrir panel si ya es grupal
      setMostrarPanelMiembros((tarea.miembros || []).length > 0);
    }
  }, [isOpen, tarea]);

  if (!isOpen) return null;

  const isSubmitting = actualizar.isPending;

  // Usuarios disponibles para agregar como miembro
  const usuariosParaMiembro = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(miembroSearchTerm.toLowerCase()) &&
    u.user_id !== tarea.assigned_to &&
    !miembrosActuales.some(m => m.id_user === u.user_id)
  );

  const handleSelectMiembro = (userId: string, nombre: string) => {
    setMiembroSeleccionado({ userId, nombre });
    setMiembroSearchTerm(nombre);
    setShowMiembroDropdown(false);
    setMiembroAsignaciones([]);
    setMiembroAsignacionInput('');
  };

  const addAsignacionMiembro = () => {
    if (!miembroAsignacionInput.trim()) return;
    setMiembroAsignaciones(prev => [...prev, { title: miembroAsignacionInput.trim(), is_complete: false }]);
    setMiembroAsignacionInput('');
  };

  const removeAsignacionMiembro = (idx: number) => {
    setMiembroAsignaciones(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAgregarMiembro = async () => {
    if (!miembroSeleccionado) return;
    setAgregandoMiembro(true);
    try {
      await addMiembro.mutateAsync({
        taskId: tarea.id,
        userId: miembroSeleccionado.userId,
        asignaciones: miembroAsignaciones,
        tituloTarea: tarea.title,
      });
      // Actualizar lista local
      setMiembrosActuales(prev => [...prev, {
        id: crypto.randomUUID(),
        id_act: tarea.id,
        id_user: miembroSeleccionado.userId,
        nombre_usuario: miembroSeleccionado.nombre,
        asignaciones: miembroAsignaciones,
        completed_at: null,
        comentario: null,
        created_at: new Date().toISOString(),
      }]);
      // Resetear
      setMiembroSeleccionado(null);
      setMiembroSearchTerm('');
      setMiembroAsignaciones([]);
      setMiembroAsignacionInput('');
      toast.success(`${miembroSeleccionado.nombre} agregado y notificado`);
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar miembro');
    } finally {
      setAgregandoMiembro(false);
    }
  };

  const handleEliminarMiembro = async (miembro: ActMiembro) => {
    try {
      await removeMiembro.mutateAsync(miembro.id);
      setMiembrosActuales(prev => prev.filter(m => m.id !== miembro.id));
      toast.info(`${miembro.nombre_usuario || 'Miembro'} eliminado`);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar miembro');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const isoDate = dueDate ? new Date(dueDate).toISOString() : null;
      const fechaOriginal = formatDateForInput(tarea.due_date);
      const fechaCambio = dueDate !== fechaOriginal;
      const estabaCompletada = tarea.status === 'Completado';
      const estabaVencida = new Date(tarea.due_date) < new Date();

      const datosActualizados: any = {
        title,
        description,
        due_date: isoDate
      };

      if (fechaCambio && (estabaCompletada || estabaVencida)) {
        datosActualizados.status = 'Asignado';
        if (estabaCompletada) {
          datosActualizados.updated_at = null;
        }
      }

      await actualizar.mutateAsync({ id: tarea.id, updates: datosActualizados });

      toast.success('Actividad actualizada correctamente');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Error al actualizar la actividad');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed -inset-[100vmax] bg-black/5 dark:bg-black/20 backdrop-blur-md -z-10 pointer-events-none" />
      <div className="bg-white dark:bg-neutral-900 w-full sm:rounded-2xl rounded-t-2xl shadow-2xl sm:max-w-2xl lg:max-w-3xl flex flex-col transition-colors duration-200 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-gray-100">
            Editar Actividad
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          
          {/* Título */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
               <span className="flex items-center gap-2"><Type size={14}/> Título</span>
               {!esJefe && <span className="text-[10px] text-orange-500 flex items-center gap-1"><Lock size={10}/> Solo lectura</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!esJefe} 
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-base font-medium
                ${!esJefe 
                  ? 'bg-gray-100 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700 text-gray-500 cursor-not-allowed opacity-70' 
                  : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-700 dark:text-gray-100'
                }`}
              required
            />
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span className="flex items-center gap-2"><Calendar size={14} /> Fecha y Hora Límite</span>
              {!esJefe && <span className="text-[10px] text-orange-500 flex items-center gap-1"><Lock size={10}/> Solo lectura</span>}
            </label>
            <input
              type="datetime-local" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!esJefe} 
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base dark:[color-scheme:dark]
                ${!esJefe 
                  ? 'bg-gray-100 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700 text-gray-500 cursor-not-allowed opacity-70' 
                  : 'bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-700 dark:text-gray-100'
                }`}
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlignLeft size={14} /> Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Añade detalles o actualizaciones..."
              className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-base text-gray-700 dark:text-gray-100 resize-none"
            />
          </div>

          {/* ── Sección de miembros (solo jefe) ───────────────────────────── */}
          {esJefe && (
            <div className="border-t border-gray-100 dark:border-neutral-800 pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setMostrarPanelMiembros(!mostrarPanelMiembros)}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl w-full transition-all border ${
                  mostrarPanelMiembros
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700 hover:border-purple-300'
                }`}
              >
                <Users size={16} />
                Participantes grupales {miembrosActuales.length > 0 && `(${miembrosActuales.length})`}
                <ChevronDown size={14} className={`ml-auto transition-transform ${mostrarPanelMiembros ? 'rotate-180' : ''}`} />
              </button>

              {mostrarPanelMiembros && (
                <div className="space-y-3 bg-purple-50/30 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50 animate-in fade-in duration-200">
                  
                  {/* Lista de miembros actuales */}
                  {miembrosActuales.length > 0 && (
                    <div className="space-y-2">
                      {miembrosActuales.map((m) => (
                        <div key={m.id} className="flex items-start justify-between bg-white dark:bg-neutral-900 p-3 rounded-xl border border-purple-100 dark:border-purple-900/40">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800 dark:text-gray-100">
                                {m.nombre_usuario || 'Usuario'}
                              </span>
                              {m.completed_at && (
                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                  ✓ Completó
                                </span>
                              )}
                            </div>
                            {m.asignaciones.length > 0 ? (
                              <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                                {m.asignaciones.length} sub-tarea(s) · {m.asignaciones.filter(a => a.is_complete).length} completadas
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-gray-500 italic mt-0.5">Sin sub-tareas</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEliminarMiembro(m)}
                            disabled={removeMiembro.isPending}
                            className="ml-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar nuevo miembro */}
                  <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-3">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      + Agregar participante
                    </p>
                    <div className="relative">
                      <input
                        type="text"
                        value={miembroSearchTerm}
                        onChange={(e) => { setMiembroSearchTerm(e.target.value); setShowMiembroDropdown(true); setMiembroSeleccionado(null); }}
                        onFocus={() => setShowMiembroDropdown(true)}
                        onBlur={() => setTimeout(() => setShowMiembroDropdown(false), 200)}
                        placeholder="Buscar participante..."
                        className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-sm text-gray-700 dark:text-gray-100 placeholder-gray-400"
                      />
                      {showMiembroDropdown && usuariosParaMiembro.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                          {usuariosParaMiembro.map(u => (
                            <button
                              key={u.user_id}
                              type="button"
                              onClick={() => handleSelectMiembro(u.user_id, u.nombre)}
                              className="w-full text-left px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-200 text-sm border-b border-gray-50 dark:border-neutral-700/50 last:border-0"
                            >
                              {u.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {miembroSeleccionado && (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          Sub-tareas para <span className="font-bold">{miembroSeleccionado.nombre}</span>:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={miembroAsignacionInput}
                            onChange={(e) => setMiembroAsignacionInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAsignacionMiembro())}
                            placeholder="Escribe una sub-tarea..."
                            className="flex-1 p-2.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400"
                          />
                          <button type="button" onClick={addAsignacionMiembro} className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-lg transition-colors">
                            <Plus size={18} />
                          </button>
                        </div>
                        {miembroAsignaciones.map((a, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 p-2.5 rounded-lg border border-gray-100 dark:border-neutral-700 text-sm">
                            <span className="text-gray-600 dark:text-gray-300 truncate flex-1 mr-2">• {a.title}</span>
                            <button type="button" onClick={() => removeAsignacionMiembro(idx)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAgregarMiembro}
                          disabled={agregandoMiembro}
                          className="w-full py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {agregandoMiembro ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                          Confirmar y notificar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
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