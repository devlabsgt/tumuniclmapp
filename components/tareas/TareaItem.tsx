'use client';

import { useState } from 'react';
import { Tarea, ChecklistItem, Usuario } from './types'; 
import { cambiarEstado, eliminarTarea } from './actions';
import EditarTarea from './modals/EditarTarea';
import DuplicateTarea from './modals/DuplicateTarea'; 
import TareaChecklist from './TareaChecklist'; 
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { 
  Edit2, Trash2, ChevronDown, MoreHorizontal, Calendar, 
  User, Clock, AlertCircle, Copy, ArrowRight
} from 'lucide-react';

interface Props {
  tarea: Tarea;
  isExpanded?: boolean;
  onToggle?: () => void;
  isJefe: boolean;
  usuarioActual: string;
  usuarios: Usuario[]; 
}

const getNombreCorto = (nombreCompleto: string | undefined | null) => {
  if (!nombreCompleto) return 'Sin nombre';
  
  const partes = nombreCompleto.trim().split(/\s+/);
  const total = partes.length;

  if (total === 1) return partes[0];

  const primerNombre = partes[0];
  let indexApellido = 1;

  const p1 = partes[1] ? partes[1].toLowerCase() : '';
  const p2 = partes[2] ? partes[2].toLowerCase() : '';

  const conectores = ['de', 'del', 'la', 'las', 'los', 'san', 'da', 'di', 'van', 'von', 'y'];
  const sufijosNombreCompuesto = ['jesús', 'jesus', 'carmen', 'pilar', 'rocío', 'rocio', 'luz', 'maría', 'maria', 'ángeles', 'angeles', 'fatima', 'fátima'];
  
  if (total > 3 && (p1 === 'de' || p1 === 'del') && sufijosNombreCompuesto.includes(p2)) {
      indexApellido = 3; 
  } 
  else if (total >= 3) {
      if (!conectores.includes(p1)) {
          indexApellido = 2; 
      }
  }

  const partesApellido = [];
  for (let i = indexApellido; i < total; i++) {
      const palabra = partes[i];
      partesApellido.push(palabra);
      if (!conectores.includes(palabra.toLowerCase())) {
          break;
      }
  }

  return `${primerNombre} ${partesApellido.join(' ')}`;
};

export default function TareaItem({ tarea, isExpanded = false, onToggle, isJefe, usuarioActual, usuarios }: Props) { 
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false); 

  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-ES', {
        timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatearHora = (fechaISO: string) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const renderDescripcionConLinks = (texto: string) => {
    if (!texto) return null;

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(\/[^\s]*)?)/g;
    const partes = texto.split(urlRegex);

    return partes.map((parte, i) => {
      if (!parte) return null;
      if (parte.match(urlRegex)) {
        const href = parte.startsWith('http') ? parte : parte.startsWith('www.') ? `https://${parte}` : `https://${parte}`;
        return (
          <a 
            key={i} 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {parte}
          </a>
        );
      }
      return <span key={i}>{parte}</span>;
    });
  };

  const esAutoAsignado = tarea.created_by === tarea.assigned_to;
  const esAsignadoAMi = tarea.assigned_to === usuarioActual;
  const esCreadoPorMi = tarea.created_by === usuarioActual;
  
  const nombreCreador = getNombreCorto(tarea.creator?.nombre || 'Desconocido');
  const nombreAsignado = getNombreCorto(tarea.assignee?.nombre || 'Sin asignar');
  
  const checklist = (tarea.checklist as unknown as ChecklistItem[]) || [];
  const completados = checklist.filter(c => c.is_completed).length;
  const total = checklist.length;
  const porcentaje = total === 0 ? 0 : Math.round((completados / total) * 100);

  const fechaLimite = new Date(tarea.due_date);
  const esVencida = new Date() > fechaLimite && tarea.status !== 'Completado';
  const isReadOnly = esVencida || tarea.status === 'Completado';

  const puedeEditar = isJefe || (!isReadOnly && (esAsignadoAMi || esCreadoPorMi));

  const handleTerminar = async () => {
    if (checklist.some(i => !i.is_completed)) {
        Swal.fire({ icon: 'warning', title: 'Falta poco...', text: 'Completa el checklist primero.', confirmButtonColor: '#4f46e5' });
        return;
    }
    setLoading(true);
    try {
      await cambiarEstado(tarea.id, 'Completado');
      Swal.fire({ icon: 'success', title: '¡Completada!', timer: 1500, showConfirmButton: false });
      
      // Cierra el acordeón al completar
      if (isExpanded && onToggle) {
        onToggle(); 
      }
      
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  const handleEliminar = async (e?: React.MouseEvent) => {
    if(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const result = await Swal.fire({
        title: '¿Eliminar?', icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        setLoading(true);
        try { 
            await eliminarTarea(tarea.id); 
            toast.info('Tarea eliminada'); 
        } 
        catch { 
            toast.error('Error al eliminar'); 
        } finally { 
            setLoading(false); 
        }
    }
  };

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
      
      return {
          badge: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
          border: 'border-purple-500',
          label: (tarea.status === 'En Proceso' || !tarea.status) ? 'Asignado' : tarea.status
      };
  };

  const { badge, border, label } = getStatusStyles();
  
  let colorBarra = 'bg-slate-200 dark:bg-neutral-600';
  if (porcentaje === 100) colorBarra = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
  else if (porcentaje > 75) colorBarra = 'bg-yellow-300';
  else if (porcentaje > 50) colorBarra = 'bg-yellow-500';
  else if (porcentaje > 25) colorBarra = 'bg-orange-500';
  else if (porcentaje > 0) colorBarra = 'bg-red-600';

  return (
    <>
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
      
      <div onClick={onToggle} className="p-4 sm:p-5 cursor-pointer flex flex-col gap-1 sm:gap-0">
        
        <div className="flex justify-between items-start gap-3 sm:gap-4 w-full">
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${badge}`}>
                        {esVencida && <AlertCircle size={12} strokeWidth={3} />}
                        {label}
                    </span>
                </div>
                
                <h3 className="font-bold text-base text-slate-800 dark:text-gray-100 leading-snug break-words">
                    {tarea.title}
                </h3>
            </div>

            <div className="flex items-center gap-0 sm:gap-1 shrink-0" 
                 onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                 }}>
                
                {isJefe && (
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDuplicateModalOpen(true);
                    }}
                    className="p-2 text-slate-400 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                    title="Duplicar Tarea"
                    >
                        <Copy size={18} />
                    </button>
                )}

                {puedeEditar && (
                    <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setIsEditModalOpen(true);
                    }}
                    className="p-2 text-slate-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-blue-900/30 transition-all"
                    title="Editar Tarea"
                    >
                    <Edit2 size={18} />
                    </button>
                )}
                
                {isJefe && (
                    <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                        handleEliminar(e);
                    }}
                    
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

        {!isExpanded && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-gray-400 font-medium w-full border-t pt-3 sm:border-t-0 sm:pt-0 border-slate-100 dark:border-neutral-800 sm:mt-2">
                <span className="flex items-center gap-1.5 shrink-0 text-slate-600 dark:text-gray-300">
                    <Clock size={13} className="text-slate-400 dark:text-gray-500"/> 
                    {formatearHora(tarea.due_date)}
                </span>
                
                {total > 0 && (
                    <>
                        <span className="text-slate-300 dark:text-gray-600 hidden sm:inline">•</span>
                        
                        <div className="flex items-center gap-2 mr-2 sm:mr-0">
                            <span className={`text-xs font-bold shrink-0 ${porcentaje === 100 ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-gray-400'}`}>
                                {porcentaje}%
                            </span>
                            <div className="w-24 sm:w-32 md:w-52 bg-slate-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden flex-shrink-0">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${colorBarra}`} 
                                    style={{ width: `${porcentaje}%` }}
                                />
                            </div>
                        </div>
                    </>
                )}

                <span className="text-slate-300 dark:text-gray-600 hidden sm:inline">•</span>
                
                <div className="w-full mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-neutral-700 sm:w-auto sm:mt-0 sm:pt-0 sm:border-t-0 sm:border-none sm:flex-1">
                    {esAutoAsignado ? (
                        <div className="flex items-center gap-1.5 text-xs">
                             <div className="bg-slate-100 dark:bg-neutral-800 p-1 rounded-full"><User size={10} className={esAsignadoAMi ? 'text-blue-500' : 'text-slate-400'}/></div>
                             <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Creado y asignado por:</span>
                             <span className={`truncate max-w-[200px] ${esAsignadoAMi ? 'text-blue-600 font-bold' : 'font-medium text-slate-700 dark:text-gray-300'}`}>
                                {esAsignadoAMi ? `${nombreAsignado} (Yo)` : nombreAsignado}
                             </span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-xs w-full">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300 w-full sm:w-auto">
                                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0 sm:w-auto">Creado por: </span>
                                <span className="font-medium truncate block w-full sm:w-auto">{nombreCreador}</span>
                            </div>

                            <ArrowRight size={12} className="hidden sm:block text-slate-300 dark:text-gray-600 shrink-0" />

                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300 w-full sm:w-auto">
                                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0 sm:w-auto">Asignado a: </span>
                                <span className={`truncate block w-full sm:w-auto ${esAsignadoAMi ? 'text-blue-600 font-semibold' : ''}`}>
                                    {esAsignadoAMi ? `${nombreAsignado} (Yo)` : nombreAsignado}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-slate-100 dark:border-neutral-800 mt-1">
            
            <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8 gap-6 mt-5">
                
                <div className="flex flex-col gap-5 lg:col-span-2">
                      
                    <div className="bg-slate-50 dark:bg-neutral-800 p-4 rounded-xl border border-slate-100 dark:border-neutral-700 h-fit">
                        <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-gray-500 mb-2 block">Descripción</label>
                        <div className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-line leading-relaxed break-words">
                            {tarea.description ? renderDescripcionConLinks(tarea.description) : <span className="italic text-slate-400 dark:text-gray-500 flex items-center gap-2"><MoreHorizontal size={16}/> Sin descripción...</span>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`inline-flex items-center flex-wrap gap-2 px-3 py-2 rounded-lg text-xs font-medium border w-full sm:w-auto
                            ${esVencida 
                                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' 
                                : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'}`}>
                            <Calendar size={14} />
                            <span>Vence: {new Date(tarea.due_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                            <span className="border-l pl-2 ml-1 border-current opacity-50"><Clock size={14} className="inline mr-1"/>{new Date(tarea.due_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {checklist.length > 0 && (
                            <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wide">Progreso Total</span>
                                    <span className={`text-xs font-bold ${porcentaje === 100 ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-gray-300'}`}>{porcentaje}%</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorBarra}`} style={{ width: `${porcentaje}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {tarea.status !== 'Completado' && (
                        <div className="mt-auto pt-2">
                            <button onClick={handleTerminar} disabled={loading || esVencida}
                            className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex justify-center items-center gap-2 text-white transform active:scale-[0.98]
                                ${esVencida 
                                    ? 'bg-red-50 text-red-400 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 cursor-not-allowed shadow-none' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 dark:shadow-none'}`}>
                            {loading ? <Clock size={18} className="animate-spin" /> : esVencida ? 'Tarea Vencida' : 'Completar Tarea'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col h-full lg:col-span-3">
                      <div className="bg-slate-50/50 dark:bg-neutral-800/30 rounded-xl border border-slate-100 dark:border-neutral-800 p-4 h-full min-h-[300px]">
                        <TareaChecklist 
                            tareaId={tarea.id}
                            checklist={checklist}
                            isReadOnly={isReadOnly}
                        />
                      </div>
                </div>
            
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-3 text-xs text-slate-500 dark:text-gray-400 flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-neutral-700">
                        <span className="font-bold text-slate-400 dark:text-gray-500 uppercase text-[10px]">Detalles del Registro</span>
                        <span className="text-[10px] text-slate-400 dark:text-gray-500">Creado: {formatearFecha(tarea.created_at)}</span>
                      </div>
                      
                      {esAutoAsignado ? (
                        <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                                {nombreCreador.charAt(0)}
                            </div>
                            <span className="text-slate-600 dark:text-gray-400">
                                    Creado y asignado por: <span className="font-semibold text-slate-800 dark:text-gray-200">{esAsignadoAMi ? `${nombreAsignado} (Yo)` : nombreAsignado}</span>
                            </span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-600 dark:text-gray-200 flex items-center justify-center text-[10px] font-bold">
                                    {nombreCreador.charAt(0)}
                                </div>
                                <span className="truncate" title={tarea.creator?.nombre}>
                                    Creado por: <span className="font-medium text-slate-700 dark:text-gray-300">{nombreCreador}</span>
                                </span>
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-neutral-700 w-full sm:hidden"></div>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold border border-orange-200 dark:border-orange-800">
                                    {nombreAsignado.charAt(0)}
                                </div>
                                <span className="truncate" title={tarea.assignee?.nombre}>
                                    Asignado a: <span className="font-medium text-slate-700 dark:text-gray-300">{esAsignadoAMi ? `${nombreAsignado} (Yo)` : nombreAsignado}</span>
                                </span>
                            </div>
                        </div>
                      )}
                </div>
            </div>

        </div>
      </div>
    </div>
    
    {isEditModalOpen && (
        <EditarTarea 
            isOpen={isEditModalOpen}
            onClose={() => {
                setIsEditModalOpen(false);
                // LÓGICA CORREGIDA:
                // Solo cerramos (toggle) si estaba expandida previamente.
                if (isExpanded && onToggle) {
                    onToggle(); 
                }
            }}
            tarea={tarea}
            esJefe={isJefe} 
        />
    )}

    {isDuplicateModalOpen && (
        <DuplicateTarea
            isOpen={isDuplicateModalOpen}
            onClose={() => setIsDuplicateModalOpen(false)}
            tareaOriginal={tarea}
            usuarios={usuarios}
            esJefe={isJefe}
        />
    )}
    </>
    
  );
}