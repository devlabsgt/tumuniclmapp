'use client';

import { useState } from 'react';
import { Usuario, ChecklistItem, AsignacionMiembro } from '../types';
import { X, Plus, Trash2, Calendar, User, AlignLeft, CheckSquare, Users, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTareaMutations } from '../hooks';

interface NuevoMiembro {
  userId: string;
  nombre: string;
  asignaciones: AsignacionMiembro[];
}

interface NewTareaProps {
  isOpen: boolean;
  onClose: () => void;
  usuarios: Usuario[];
  usuarioActual: string;
  esJefe: boolean;
}

export default function NewTarea({ isOpen, onClose, usuarios, usuarioActual, esJefe }: NewTareaProps) {
  const { crear } = useTareaMutations();

  const obtenerFechaPorDefecto = () => {
    const d = new Date();
    d.setHours(16, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(obtenerFechaPorDefecto);

  // Encargado
  const [assignedTo, setAssignedTo] = useState(usuarioActual);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Checklist del encargado
  const [checklistInput, setChecklistInput] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Miembros grupales
  const [esGrupal, setEsGrupal] = useState(false);
  const [miembros, setMiembros] = useState<NuevoMiembro[]>([]);
  // Tab seleccionado en el panel derecho: 'encargado' | userId de un miembro
  const [panelActivo, setPanelActivo] = useState<string>('encargado');
  // Input para agregar sub-tarea al panel activo
  const [panelInput, setPanelInput] = useState('');

  // Buscador de nuevo miembro
  const [miembroSearchTerm, setMiembroSearchTerm] = useState('');
  const [showMiembroDropdown, setShowMiembroDropdown] = useState(false);

  if (!isOpen) return null;
  const isSubmitting = crear.isPending;

  // ── Helpers encargado ────────────────────────────────────────────────────
  const filteredUsuarios = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEncargado = (userId: string, nombre: string) => {
    setAssignedTo(userId);
    setSearchTerm(nombre);
    setShowDropdown(false);
    // Si el encargado cambia y era miembro, quitarlo de la lista
    setMiembros(prev => prev.filter(m => m.userId !== userId));
    if (panelActivo === userId) setPanelActivo('encargado');
  };

  // ── Helpers miembros ─────────────────────────────────────────────────────
  const usuariosParaMiembro = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(miembroSearchTerm.toLowerCase()) &&
    u.user_id !== assignedTo &&
    !miembros.some(m => m.userId === u.user_id)
  );

  const agregarMiembro = (userId: string, nombre: string) => {
    setMiembros(prev => [...prev, { userId, nombre, asignaciones: [] }]);
    setMiembroSearchTerm('');
    setShowMiembroDropdown(false);
    // Cambiar el panel a este nuevo miembro
    setPanelActivo(userId);
    setPanelInput('');
  };

  const eliminarMiembro = (userId: string) => {
    setMiembros(prev => prev.filter(m => m.userId !== userId));
    if (panelActivo === userId) setPanelActivo('encargado');
  };

  // ── Panel derecho: agregar ítem ──────────────────────────────────────────
  const addPanelItem = () => {
    if (!panelInput.trim()) return;
    if (panelActivo === 'encargado') {
      setChecklist(prev => [...prev, { title: panelInput.trim(), is_completed: false }]);
    } else {
      setMiembros(prev => prev.map(m =>
        m.userId === panelActivo
          ? { ...m, asignaciones: [...m.asignaciones, { title: panelInput.trim(), is_complete: false }] }
          : m
      ));
    }
    setPanelInput('');
  };

  const removePanelItem = (idx: number) => {
    if (panelActivo === 'encargado') {
      setChecklist(prev => prev.filter((_, i) => i !== idx));
    } else {
      setMiembros(prev => prev.map(m =>
        m.userId === panelActivo
          ? { ...m, asignaciones: m.asignaciones.filter((_, i) => i !== idx) }
          : m
      ));
    }
  };

  // Items que muestra el panel derecho
  const panelItems: { title: string }[] =
    panelActivo === 'encargado'
      ? checklist
      : (miembros.find(m => m.userId === panelActivo)?.asignaciones ?? []);

  const panelNombre =
    panelActivo === 'encargado'
      ? 'del encargado'
      : miembros.find(m => m.userId === panelActivo)?.nombre ?? '';

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !dueDate) {
      setError('Por favor completa el título y la fecha.');
      toast.warning('Faltan datos obligatorios');
      return;
    }
    if (esGrupal && miembros.length === 0) {
      setError('Agrega al menos un miembro para una actividad grupal.');
      toast.warning('Agrega al menos un miembro');
      return;
    }
    try {
      await crear.mutateAsync({
        title: title.trim(),
        description,
        due_date: new Date(dueDate).toISOString(),
        assigned_to: esJefe ? assignedTo : usuarioActual,
        checklist,
        status: 'Asignado',
        miembros: esGrupal
          ? miembros.map(m => ({ userId: m.userId, asignaciones: m.asignaciones }))
          : undefined,
      });
      toast.success('¡Actividad creada correctamente!');
      // Reset
      setTitle(''); setDescription(''); setDueDate(obtenerFechaPorDefecto());
      setChecklist([]); setAssignedTo(usuarioActual); setSearchTerm('');
      setEsGrupal(false); setMiembros([]); setPanelActivo('encargado');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la actividad');
      toast.error(err.message || 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed -inset-[100vmax] bg-black/5 dark:bg-black/20 backdrop-blur-md -z-10 pointer-events-none" />
      <div className="bg-white dark:bg-neutral-900 w-full rounded-t-2xl sm:rounded-2xl shadow-2xl sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col transition-colors duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-500">Nueva Actividad</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── Columna Izquierda ─────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Título */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título de la actividad</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Revisar documentación..."
                  className="w-full p-3 sm:p-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  autoFocus
                />
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Calendar size={14} /> Fecha Límite
                </label>
                <input
                  type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base text-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
                />
              </div>

              {/* Encargado */}
              <div className="space-y-2 relative">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <User size={14} /> Encargado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={!esJefe ? '(Auto-asignado a mí)' : searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); if (!e.target.value.trim()) setAssignedTo(usuarioActual); }}
                    onFocus={() => esJefe && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    disabled={!esJefe}
                    placeholder={esJefe ? "Escribe un nombre..." : "(Auto-asignado a mí)"}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base transition-colors
                      ${esJefe ? 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-100 placeholder-gray-400' : 'bg-gray-100 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700 text-gray-400 cursor-not-allowed'}`}
                  />
                  {esJefe && showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      <button type="button" onClick={() => handleSelectEncargado(usuarioActual, '(A mí mismo)')}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm text-blue-600 dark:text-blue-400 font-medium border-b border-gray-50 dark:border-neutral-700">
                        Asignarme a mí
                      </button>
                      {filteredUsuarios.filter(u => u.user_id !== usuarioActual).map(u => (
                        <button key={u.user_id} type="button" onClick={() => handleSelectEncargado(u.user_id, u.nombre)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 text-sm transition-colors border-b border-gray-50 dark:border-neutral-700/50 last:border-0">
                          {u.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {esJefe && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                    {searchTerm.trim() === '' ? '* Vacío = Se te asigna a ti.' : 'Selecciona de la lista.'}
                  </p>
                )}
              </div>

              {/* ── Sección de Miembros (solo jefes) ─────────────────────── */}
              {esJefe && (
                <div className="space-y-3">
                  {/* Toggle */}
                  <button type="button" onClick={() => { setEsGrupal(!esGrupal); setMiembros([]); if (esGrupal) setPanelActivo('encargado'); }}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg w-full transition-all border ${
                      esGrupal
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                        : 'bg-gray-50 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-neutral-700 hover:border-purple-300 hover:text-purple-500'
                    }`}>
                    <Users size={13} />
                    {esGrupal ? 'Actividad Grupal — activa' : 'Agregar participantes grupales'}
                    {esGrupal && miembros.length > 0 && (
                      <span className="ml-auto bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {miembros.length}
                      </span>
                    )}
                  </button>

                  {esGrupal && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      {/* Buscador de miembro */}
                      <div className="relative">
                        <div className="relative">
                          <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            value={miembroSearchTerm}
                            onChange={(e) => { setMiembroSearchTerm(e.target.value); setShowMiembroDropdown(true); }}
                            onFocus={() => setShowMiembroDropdown(true)}
                            onBlur={() => setTimeout(() => setShowMiembroDropdown(false), 200)}
                            placeholder="Buscar y agregar participante..."
                            className="w-full pl-8 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none text-gray-700 dark:text-gray-100 placeholder-gray-400"
                          />
                        </div>
                        {showMiembroDropdown && usuariosParaMiembro.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl shadow-xl max-h-36 overflow-y-auto">
                            {usuariosParaMiembro.map(u => (
                              <button key={u.user_id} type="button"
                                onClick={() => agregarMiembro(u.user_id, u.nombre)}
                                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-200 text-sm border-b border-gray-50 dark:border-neutral-700/50 last:border-0">
                                {u.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Lista de miembros agregados (botones clickeables) */}
                      {miembros.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {miembros.map(m => {
                            const isActive = panelActivo === m.userId;
                            const count = m.asignaciones.length;
                            return (
                              <div key={m.userId}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                  isActive
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                                    : 'bg-white dark:bg-neutral-800/50 border-gray-100 dark:border-neutral-700 hover:border-purple-200 dark:hover:border-purple-800'
                                }`}
                                onClick={() => {
                                  setPanelActivo(panelActivo === m.userId ? 'encargado' : m.userId);
                                  setPanelInput('');
                                }}
                              >

                                {/* Nombre y conteo */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {m.nombre}
                                  </p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {count === 0 ? 'Sin sub-tareas' : `${count} sub-tarea${count !== 1 ? 's' : ''}`}
                                  </p>
                                </div>
                                {/* Borrar */}
                                <button type="button"
                                  onClick={(e) => { e.stopPropagation(); eliminarMiembro(m.userId); }}
                                  className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors shrink-0">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Descripción */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <AlignLeft size={14} /> Descripción
                </label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales..." rows={3}
                  className="w-full p-3 sm:p-4 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>
            </div>

            {/* ── Columna Derecha: Panel dinámico ─────────────────────── */}
            <div className="flex flex-col">
              <div className={`space-y-3 p-3 sm:p-4 rounded-xl border h-full flex flex-col min-h-[280px] transition-colors duration-200 ${
                panelActivo === 'encargado'
                  ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-800/50'
                  : 'bg-purple-50/30 dark:bg-purple-900/10 border-purple-100/50 dark:border-purple-800/50'
              }`}>
                {/* Header del panel */}
                <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                  panelActivo === 'encargado' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                }`}>
                  <CheckSquare size={14} />
                  {panelActivo === 'encargado' ? 'Mi lista de pendientes' : `Sub-tareas de ${panelNombre.split(' ')[0]}`}
                  <span className="text-[9px] font-normal normal-case opacity-70">({panelNombre})</span>
                </label>

                {/* Input para agregar ítem */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={panelInput}
                    onChange={(e) => setPanelInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPanelItem())}
                    placeholder="Escribe aquí..."
                    className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:outline-none text-base text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-neutral-900 transition-colors ${
                      panelActivo === 'encargado'
                        ? 'border-blue-100 dark:border-blue-900 focus:ring-blue-400'
                        : 'border-purple-100 dark:border-purple-900 focus:ring-purple-400'
                    }`}
                  />
                  <button type="button" onClick={addPanelItem}
                    className={`p-3 rounded-lg transition-colors flex items-center justify-center shrink-0 text-white ${
                      panelActivo === 'encargado' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                    }`}>
                    <Plus size={20} />
                  </button>
                </div>

                {/* Lista de ítems */}
                {panelItems.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {panelItems.map((item, idx) => (
                      <div key={idx}
                        className="flex items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-lg border border-gray-100 dark:border-neutral-800 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1 mr-2">• {item.title}</span>
                        <button type="button" onClick={() => removePanelItem(idx)}
                          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 dark:text-gray-500 text-sm italic my-auto py-10">
                    {panelActivo === 'encargado' ? 'Sin pendientes asignados' : 'Sin sub-tareas para este participante'}
                  </p>
                )}

                {/* Hint cuando es miembro */}
                {panelActivo !== 'encargado' && (
                  <p className="text-[10px] text-purple-400 dark:text-purple-500 text-center pb-1">
                    Clic en otro participante para editar sus sub-tareas
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 mt-2 border-t border-gray-100 dark:border-neutral-800">
            {error && (
              <div className="w-full max-w-md p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900 flex items-center justify-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            <div className="w-full sm:w-1/2 pb-2 sm:pb-0">
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 sm:py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
                {isSubmitting ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</>
                ) : (
                  <><Plus size={20} /> Crear Actividad</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}