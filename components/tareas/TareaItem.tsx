'use client';

import { useState } from 'react';
import { Tarea, ChecklistItem } from './types';
import { cambiarEstado, eliminarTarea } from './actions';
import EditarTarea from './modals/EditarTarea';
import TareaChecklist from './TareaChecklist'; 
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { 
  Edit2, Trash2, ChevronDown, MoreHorizontal, Calendar, 
  User, Clock, ListTodo, AlertCircle
} from 'lucide-react';

interface Props {
  tarea: Tarea;
  isExpanded?: boolean;
  onToggle?: () => void;
  isJefe: boolean; // <--- PROPIEDAD AGREGADA
}

export default function TareaItem({ tarea, isExpanded = false, onToggle, isJefe }: Props) {
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- LÓGICA DE METADATOS ---
  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-ES', {
        timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const esAutoAsignado = tarea.created_by === tarea.assigned_to;
  const nombreCreador = tarea.creator?.nombre || 'Desconocido';
  const nombreAsignado = tarea.assignee?.nombre || 'Sin asignar';
  
  // --- CÁLCULOS VISUALES ---
  const checklist = (tarea.checklist as unknown as ChecklistItem[]) || [];
  const completados = checklist.filter(c => c.is_completed).length;
  const total = checklist.length;
  const porcentaje = total === 0 ? 0 : Math.round((completados / total) * 100);

  const fechaLimite = new Date(tarea.due_date);
  const esVencida = new Date() > fechaLimite && tarea.status !== 'Completado';
  const isReadOnly = esVencida || tarea.status === 'Completado';

  // --- HANDLERS ---
  const handleTerminar = async () => {
    if (checklist.some(i => !i.is_completed)) {
        Swal.fire({ icon: 'warning', title: 'Falta poco...', text: 'Completa el checklist primero.', confirmButtonColor: '#4f46e5' });
        return;
    }
    setLoading(true);
    try {
      await cambiarEstado(tarea.id, 'Completado');
      Swal.fire({ icon: 'success', title: '¡Completada!', timer: 1500, showConfirmButton: false });
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
        title: '¿Eliminar?', icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
        setLoading(true);
        try { await eliminarTarea(tarea.id); toast.info('Tarea eliminada'); } 
        catch { toast.error('Error al eliminar'); } finally { setLoading(false); }
    }
  };

  // Configuración de colores basada en estado
  const getStatusStyles = () => {
      if (tarea.status === 'Completado') {
          return {
              badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
              border: 'border-green-500',
              label: 'Completado'
          };
      }
      if (esVencida) {
          return {
              badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
              border: 'border-red-500',
              label: 'Vencido'
          };
      }
      if (tarea.status === 'En Proceso') {
          return {
              badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
              border: 'border-purple-500',
              label: 'En Proceso'
          };
      }
      return {
          badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
          border: 'border-blue-500',
          label: tarea.status
      };
  };

  const { badge, border, label } = getStatusStyles();
  
  // Color de barra de progreso
  let colorBarra = 'bg-slate-200 dark:bg-neutral-600';
  if (porcentaje === 100) colorBarra = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
  else if (porcentaje > 50) colorBarra = 'bg-yellow-400';
  else if (porcentaje > 25) colorBarra = 'bg-orange-500';
  else if (porcentaje > 0) colorBarra = 'bg-red-500';

  return (
    <>
    {/* Contenedor Principal */}
    <div className={`
        bg-white dark:bg-neutral-900 
        rounded-2xl 
        shadow-sm hover:shadow-md
        transition-all duration-300 
        border-l-[6px] ${border} 
        border-t border-r border-b border-slate-200 dark:border-neutral-800 
        overflow-hidden 
        ${isExpanded ? 'ring-2 ring-blue-400/50 dark:ring-blue-900/40 shadow-xl z-10' : 'hover:-translate-y-0.5'}
    `}>
      
      {/* --- CABECERA (Header) --- */}
      {/* Cambiamos a flex-col en el contenedor padre para manejar filas internas */}
      <div onClick={onToggle} className="p-4 sm:p-5 cursor-pointer flex flex-col gap-1 sm:gap-0">
        
        {/* FILA 1: Título y Botones (Siempre alineados arriba) */}
        <div className="flex justify-between items-start gap-3 sm:gap-4 w-full">
            
            {/* Columna Izquierda: Badge y Título */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${badge}`}>
                        {esVencida && <AlertCircle size={12} strokeWidth={3} />}
                        {label}
                    </span>
                </div>
                
                <h3 className={`font-bold text-base text-slate-800 dark:text-gray-100 leading-snug break-words ${tarea.status === 'Completado' && 'line-through text-slate-400 dark:text-gray-500'}`}>
                    {tarea.title}
                </h3>
            </div>

            {/* Columna Derecha: Botones */}
            <div className="flex items-center gap-0 sm:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {!isReadOnly && (
                    <button 
                    onClick={() => setIsEditModalOpen(true)} 
                    className="p-2 text-slate-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-blue-900/30 transition-all"
                    >
                    <Edit2 size={18} />
                    </button>
                )}
                
                {/* AQUI ESTA EL CAMBIO: SOLO SE MUESTRA SI ES JEFE */}
                {isJefe && (
                    <button 
                    onClick={handleEliminar} 
                    className="p-2 text-slate-400 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-red-900/30 transition-all"
                    title="Eliminar tarea (Solo Jefe)"
                    >
                    <Trash2 size={18} />
                    </button>
                )}

                <div className={`p-2 text-slate-400 dark:text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''}`}>
                <ChevronDown size={20} />
                </div>
            </div>
        </div>

        {/* FILA 2: Metadatos (Siempre abajo, ocupando todo el ancho) */}
        {!isExpanded && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-gray-400 font-medium w-full border-t pt-3 sm:border-t-0 sm:pt-0 border-slate-100 dark:border-neutral-800 sm:mt-2">
                    <span className="flex items-center gap-1.5 shrink-0">
                        <Calendar size={13} className="text-slate-400 dark:text-gray-500"/> {formatearFecha(tarea.due_date)}
                    </span>
                    
                    {total > 0 && (
                    <>
                        <span className="text-slate-300 dark:text-gray-600 hidden sm:inline">•</span>
                        <div className="flex items-center gap-3 sm:gap-0">
                             <span className={`shrink-0 mr-3 sm:mr-0 ${porcentaje === 100 ? 'text-green-600 dark:text-green-400' : ''}`}>
                                {porcentaje}%
                             </span>
                             <span className="text-slate-300 dark:text-gray-600 hidden sm:inline sm:mx-2">•</span>
                             <span className="flex items-center gap-1 shrink-0"><ListTodo size={13}/> {completados}/{total}</span>
                        </div>
                    </>
                    )}

                    <span className="text-slate-300 dark:text-gray-600 hidden sm:inline">•</span>
                    
                    {/* Usuario - Ahora tiene espacio completo si lo necesita */}
                    <span className="flex items-center gap-1.5 shrink-0 text-slate-600 dark:text-gray-400 w-full sm:w-auto mt-1 sm:mt-0" 
                        title={esAutoAsignado ? 'Asignado a ti' : `Asignado a ${nombreAsignado}`}>
                        <User size={13} className={esAutoAsignado ? 'text-blue-500' : 'text-slate-400'}/>
                        {/* Quitamos truncate agresivo para que se vea el nombre completo */}
                        <span className="truncate sm:max-w-[150px]">
                        {esAutoAsignado ? 'Mí mismo' : nombreAsignado}
                        </span>
                    </span>
            </div>
        )}

      </div>

      

      {/* --- CUERPO DESPLEGABLE --- */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-slate-100 dark:border-neutral-800 mt-1">
            
            {/* Descripción */}
            <div className="bg-slate-50 dark:bg-neutral-800 p-4 rounded-xl mb-4 mt-4 border border-slate-100 dark:border-neutral-700">
                <p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-line leading-relaxed break-words">
                    {tarea.description || <span className="italic text-slate-400 dark:text-gray-500 flex items-center gap-2"><MoreHorizontal size={16}/> Sin descripción...</span>}
                </p>
            </div>

            {/* Fecha Vencimiento + Progreso */}
            <div className="mb-5 space-y-3">
                 <div className={`inline-flex items-center flex-wrap gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border 
                    ${esVencida 
                        ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
                        : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'}`}>
                    <Calendar size={14} />
                    <span>Vence: {new Date(tarea.due_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                    <span className="border-l pl-2 ml-1 border-current opacity-50"><Clock size={14} className="inline mr-1"/>{new Date(tarea.due_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {checklist.length > 0 && (
                    <div>
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wide">Progreso</span>
                            <span className={`text-xs font-bold ${porcentaje === 100 ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-gray-300'}`}>{porcentaje}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-neutral-600">
                            <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorBarra}`} style={{ width: `${porcentaje}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* CHECKLIST COMPONENT */}
            <div className="mb-6">
                <TareaChecklist 
                    tareaId={tarea.id}
                    checklist={checklist}
                    isReadOnly={isReadOnly}
                />
            </div>

            {/* Botón Finalizar */}
            {tarea.status !== 'Completado' && (
                <div className="flex justify-center mb-6">
                    <button onClick={handleTerminar} disabled={loading || esVencida}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2 text-white transform active:scale-[0.98]
                        ${esVencida 
                            ? 'bg-red-50 text-red-400 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 dark:shadow-none'}`}>
                    {loading ? <Clock size={18} className="animate-spin" /> : esVencida ? 'Tarea Vencida' : 'Completar Tarea'}
                    </button>
                </div>
            )}

            {/* --- FOOTER INFO --- */}
            <div className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 text-xs text-slate-500 dark:text-gray-400">
                 <div className="flex justify-between items-center border-b pb-2 mb-2 border-slate-200 dark:border-neutral-700">
                    <span className="font-bold text-slate-400 dark:text-gray-500 uppercase text-[10px]">Información</span>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500">{formatearFecha(tarea.created_at)}</span>
                 </div>
                 
                 {esAutoAsignado ? (
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                            {nombreCreador.charAt(0)}
                        </div>
                        <span className="text-slate-600 dark:text-gray-400">
                             Creado y Asignado: <span className="font-semibold text-slate-800 dark:text-gray-200">{nombreCreador}</span>
                        </span>
                    </div>
                 ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-600 dark:text-gray-200 flex items-center justify-center text-[10px] font-bold">
                                {nombreCreador.charAt(0)}
                            </div>
                            <span className="truncate" title={nombreCreador}>
                                Creado: <span className="font-medium text-slate-700 dark:text-gray-300">{nombreCreador}</span>
                            </span>
                        </div>
                        
                        <div className="h-px bg-slate-200 dark:bg-neutral-700 w-full sm:hidden"></div>

                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold border border-orange-200 dark:border-orange-800">
                                {nombreAsignado.charAt(0)}
                            </div>
                            <span className="truncate" title={nombreAsignado}>
                                Asignado: <span className="font-medium text-slate-700 dark:text-gray-300">{nombreAsignado}</span>
                            </span>
                        </div>
                    </div>
                 )}
            </div>

        </div>
      </div>
    </div>
    
    <EditarTarea 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tarea={tarea}
    />
    </>
  );
}