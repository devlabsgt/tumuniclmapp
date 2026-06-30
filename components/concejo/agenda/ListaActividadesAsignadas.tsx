'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerTodasActividadesConcejo } from './tareas/lib/actividades';
import { ActividadConcejoConContexto } from './lib/esquemas';
import { User, Calendar, CheckCircle2, Clock, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CargandoAnimacion from '@/components/ui/animations/Cargando';

const formatearFecha = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  let hora = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, '0');
  const period = hora >= 12 ? 'PM' : 'AM';
  hora = hora % 12;
  hora = hora ? hora : 12;
  const horaStr = String(hora).padStart(2, '0');
  return `${day}/${month}/${year} a las ${horaStr}:${minutos} ${period}`;
};

const estadoBadge = (actividad: ActividadConcejoConContexto) => {
  if (actividad.status === 'Completado') {
    return { label: 'Completado', clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  }
  if (!actividad.confirmed_at) {
    return { label: 'Sin confirmar', clase: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  }
  const vencida = new Date(actividad.due_date) < new Date();
  if (vencida) {
    return { label: 'Vencida', clase: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
  }
  return { label: 'Asignada', clase: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
};

export default function ListaActividadesAsignadas() {
  const { data, isLoading } = useQuery({
    queryKey: ['actividades-concejo-todas'],
    queryFn: obtenerTodasActividadesConcejo,
    staleTime: 1000 * 60,
  });

  const [expandidas, setExpandidas] = useState<Record<string, boolean>>({});

  const actividades = useMemo(() => data || [], [data]);

  const grupos = useMemo(() => {
    const map = new Map<string, { agendaId: string; agendaTitulo: string; agendaFecha: string; agendaEstado: string; items: ActividadConcejoConContexto[] }>();
    actividades.forEach((a) => {
      const key = a.agenda_id || 'sin-sesion';
      if (!map.has(key)) {
        map.set(key, {
          agendaId: a.agenda_id,
          agendaTitulo: a.agenda_titulo,
          agendaFecha: a.agenda_fecha,
          agendaEstado: a.agenda_estado,
          items: [],
        });
      }
      map.get(key)!.items.push(a);
    });
    return Array.from(map.values());
  }, [actividades]);

  const toggle = (key: string) => setExpandidas((prev) => ({ ...prev, [key]: !prev[key] }));

  if (isLoading) {
    return <CargandoAnimacion texto="Cargando actividades..." />;
  }

  if (actividades.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-neutral-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">El Concejo aún no ha asignado actividades.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {grupos.map((grupo) => {
        const abierto = expandidas[grupo.agendaId] ?? true;
        return (
          <div
            key={grupo.agendaId || 'sin-sesion'}
            className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm border-l-4 border-l-purple-500 overflow-hidden"
          >
            <button
              onClick={() => toggle(grupo.agendaId)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base truncate">
                  {grupo.agendaTitulo}
                  {grupo.agendaFecha && (
                    <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                      {formatearFecha(grupo.agendaFecha)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                  {grupo.items.length} {grupo.items.length === 1 ? 'actividad asignada' : 'actividades asignadas'}
                </p>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {abierto && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-t border-gray-100 dark:border-neutral-800">
                    {grupo.items.map((actividad, index) => {
                      const badge = estadoBadge(actividad);
                      return (
                        <li key={actividad.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-600 dark:text-purple-400">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 min-w-0">{actividad.title}</p>
                                <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.clase}`}>
                                  {actividad.confirmed_at || actividad.status === 'Completado' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                  {badge.label}
                                </span>
                              </div>

                              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                <FileText size={12} className="shrink-0 mt-0.5" />
                                <span><span className="text-gray-400">Punto:</span> {actividad.punto_titulo}</span>
                              </p>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <User size={12} /> {actividad.assignee_nombre}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} /> {formatearFecha(actividad.due_date)}
                                </span>
                              </div>

                              {actividad.confirmed_at && (
                                <p className="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-800 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  Confirmada el: {formatearFecha(actividad.confirmed_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
