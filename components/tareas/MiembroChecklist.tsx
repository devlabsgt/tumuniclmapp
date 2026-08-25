'use client';

import { useState } from 'react';
import { AsignacionMiembro } from './types';
import { toast } from 'react-toastify';
import { Check, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useTareaMutations } from './hooks';

interface Props {
  miembroId: string;
  asignaciones: AsignacionMiembro[];
  isReadOnly: boolean;
  comentario?: string | null;
  completedAt?: string | null;
}

export default function MiembroChecklist({
  miembroId,
  asignaciones,
  isReadOnly,
  comentario,
  completedAt,
}: Props) {
  const { actualizarAsignaciones, actualizarComentario } = useTareaMutations();

  const [pendingIndices, setPendingIndices] = useState<number[]>([]);
  const [comentarioLocal, setComentarioLocal] = useState(comentario || '');
  const [guardandoComentario, setGuardandoComentario] = useState(false);

  const total = asignaciones.length;
  const completados = asignaciones.filter(a => a.is_complete).length;
  const porcentaje = total === 0 ? 0 : Math.round((completados / total) * 100);

  // Orden: fijo (como se crearon)
  const sortedAsignaciones = asignaciones
    .map((item, index) => ({ ...item, originalIndex: index }));

  let colorBarra = 'bg-slate-200 dark:bg-neutral-600';
  if (porcentaje === 100) colorBarra = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
  else if (porcentaje > 75) colorBarra = 'bg-yellow-300';
  else if (porcentaje > 50) colorBarra = 'bg-yellow-500';
  else if (porcentaje > 25) colorBarra = 'bg-orange-500';
  else if (porcentaje > 0) colorBarra = 'bg-red-600';

  const toggleCheck = async (idx: number) => {
    if (isReadOnly || pendingIndices.includes(idx)) return;

    setPendingIndices(prev => [...prev, idx]);

    const nuevasAsignaciones = [...asignaciones];
    nuevasAsignaciones[idx] = {
      ...nuevasAsignaciones[idx],
      is_complete: !nuevasAsignaciones[idx].is_complete,
    };

    try {
      await actualizarAsignaciones.mutateAsync({
        miembroId,
        asignaciones: nuevasAsignaciones,
      });
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setPendingIndices(prev => prev.filter(i => i !== idx));
    }
  };

  const handleGuardarComentario = async () => {
    if (guardandoComentario) return;
    setGuardandoComentario(true);
    try {
      await actualizarComentario.mutateAsync({ miembroId, comentario: comentarioLocal });
      toast.success('Comentario guardado');
    } catch {
      toast.error('Error al guardar comentario');
    } finally {
      setGuardandoComentario(false);
    }
  };

  if (total === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-gray-500 italic py-6 text-center">
        Sin sub-tareas asignadas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Indicador de completado */}
      {completedAt && (
        <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 size={14} />
          Parte completada el {new Date(completedAt).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
      )}

      {/* Lista de sub-tareas */}
      <ul className="space-y-2">
        {sortedAsignaciones.map((item) => {
          const idx = item.originalIndex;
          const isPending = pendingIndices.includes(idx);

          return (
            <li
              key={idx}
              className={`
                flex items-center gap-3 text-sm p-2.5 rounded-lg transition-all duration-300 border
                ${isPending
                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                  : item.is_complete && !isPending
                    ? 'bg-slate-50/50 dark:bg-neutral-800/30 border-transparent'
                    : !isPending
                      ? 'hover:bg-slate-50 dark:hover:bg-neutral-800 border-transparent hover:border-slate-100 dark:hover:border-neutral-700'
                      : 'border-transparent'
                }
              `}
            >
              {/* Checkbox */}
              <div
                onClick={() => toggleCheck(idx)}
                className={`
                  min-w-[20px] w-[20px] h-[20px] rounded flex items-center justify-center border shrink-0
                  transition-all duration-200 ease-in-out
                  ${!isReadOnly && !isPending ? 'cursor-pointer active:scale-75' : ''}
                  ${isReadOnly ? 'cursor-default opacity-60' : ''}
                  ${isPending
                    ? 'bg-white dark:bg-neutral-800 border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900 shadow-md scale-105'
                    : item.is_complete
                      ? 'bg-green-500 border-green-500 shadow-sm'
                      : 'bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-600 hover:border-blue-400'
                  }
                `}
              >
                {isPending ? (
                  <Loader2 size={12} className="animate-spin text-blue-500" />
                ) : (
                  <Check
                    size={14}
                    className={`text-white transition-all duration-200 ${item.is_complete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                    strokeWidth={4}
                  />
                )}
              </div>

              {/* Título */}
              <span
                onClick={() => toggleCheck(idx)}
                className={`
                  leading-tight select-none flex-1 break-words transition-all duration-200
                  ${isReadOnly || isPending ? 'cursor-default' : 'cursor-pointer'}
                  ${item.is_complete
                    ? 'line-through text-slate-400 dark:text-gray-500'
                    : 'text-slate-700 dark:text-gray-200'
                  }
                  ${isPending ? 'opacity-80 font-medium text-blue-700 dark:text-blue-300' : ''}
                `}
              >
                {item.title}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Campo de comentario (solo editable si no es lectura) */}
      {!isReadOnly && (
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400 dark:text-gray-500 tracking-wider">
            <MessageSquare size={11} />
            Comentario final
          </label>
          <textarea
            value={comentarioLocal}
            onChange={(e) => setComentarioLocal(e.target.value)}
            placeholder="Agrega un comentario sobre tu parte (opcional)..."
            rows={3}
            className="w-full text-sm p-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder-gray-500 text-slate-700 dark:text-gray-100 resize-none"
          />
          <button
            onClick={handleGuardarComentario}
            disabled={guardandoComentario || comentarioLocal === (comentario || '')}
            className="self-end text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {guardandoComentario ? <Loader2 size={13} className="animate-spin" /> : null}
            Guardar comentario
          </button>
        </div>
      )}

      {/* Comentario en modo lectura */}
      {isReadOnly && comentario && (
        <div className="mt-1 bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
          <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-gray-500 tracking-wider mb-1.5 flex items-center gap-1">
            <MessageSquare size={10} /> Comentario
          </p>
          <p className="text-sm text-slate-600 dark:text-gray-300 whitespace-pre-line">{comentario}</p>
        </div>
      )}
    </div>
  );
}
