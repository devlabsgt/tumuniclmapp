"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  obtenerDatosGestor,
  crearTarea,
  actualizarTarea,
  updateChecklist,
  cambiarEstado,
  eliminarTarea,
  duplicarTarea,
  actualizarArchivosTarea,
  agregarMiembro,
  eliminarMiembro,
  actualizarAsignacionesMiembro,
  actualizarComentarioMiembro,
  marcarParteMiembroCompletada,
} from "./actions";
import { TipoVistaTareas, NewTaskState, ChecklistItem, ArchivoAdjunto, AsignacionMiembro } from "./types";
import { BLOQUEOS_GLOBALES_KEY, useBloqueosGlobales } from "@/components/layout/bloqueos/hooks";

export const TAREAS_KEYS = {
  gestor: (vista: string) => ["gestor-tareas", vista],
  all: ["gestor-tareas"],
  pendiente: ["bloqueo-actividad-pendiente"],
};

const KEYS = TAREAS_KEYS;

const FIVE_MINUTES = 1000 * 60 * 5;

export const useGestorData = (tipoVista: TipoVistaTareas, initialData: any) => {
  return useQuery({
    queryKey: KEYS.gestor(tipoVista),
    queryFn: () => obtenerDatosGestor(tipoVista),
    initialData, 
    staleTime: FIVE_MINUTES, 
  });
};

export const useTareaMutations = () => {
  const queryClient = useQueryClient();

  const invalidar = () => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: TAREAS_KEYS.all }),
      queryClient.invalidateQueries({ queryKey: BLOQUEOS_GLOBALES_KEY })
    ]);
  };

  const crear = useMutation({
    mutationFn: (data: NewTaskState) => crearTarea(data),
    onSuccess: invalidar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => actualizarTarea(id, updates),
    onSuccess: invalidar,
  });

  const actualizarChecklist = useMutation({
    mutationFn: ({ id, items }: { id: string; items: ChecklistItem[] }) => updateChecklist(id, items),
    onSuccess: invalidar,
  });

  const cambiarStatus = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => cambiarEstado(id, estado),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => eliminarTarea(id),
    onSuccess: invalidar,
  });

  const duplicar = useMutation({
    mutationFn: (data: NewTaskState) => duplicarTarea(data),
    onSuccess: invalidar,
  });

  const actualizarArchivos = useMutation({
    mutationFn: ({ id, archivos }: { id: string; archivos: ArchivoAdjunto[] }) => actualizarArchivosTarea(id, archivos),
    onSuccess: invalidar,
  });

  // ── Miembros grupales ──────────────────────────────────────────────────────

  const addMiembro = useMutation({
    mutationFn: ({ taskId, userId, asignaciones, tituloTarea }: {
      taskId: string;
      userId: string;
      asignaciones: AsignacionMiembro[];
      tituloTarea: string;
    }) => agregarMiembro(taskId, userId, asignaciones, tituloTarea),
    onSuccess: invalidar,
  });

  const removeMiembro = useMutation({
    mutationFn: (miembroId: string) => eliminarMiembro(miembroId),
    onSuccess: invalidar,
  });

  const actualizarAsignaciones = useMutation({
    mutationFn: ({ miembroId, asignaciones }: {
      miembroId: string;
      asignaciones: AsignacionMiembro[];
    }) => actualizarAsignacionesMiembro(miembroId, asignaciones),
    onSuccess: invalidar,
  });

  const actualizarComentario = useMutation({
    mutationFn: ({ miembroId, comentario }: { miembroId: string; comentario: string }) =>
      actualizarComentarioMiembro(miembroId, comentario),
    onSuccess: invalidar,
  });

  const completarParteMiembro = useMutation({
    mutationFn: (miembroId: string) => marcarParteMiembroCompletada(miembroId),
    onSuccess: invalidar,
  });

  return {
    crear,
    actualizar,
    actualizarChecklist,
    cambiarStatus,
    eliminar,
    duplicar,
    actualizarArchivos,
    addMiembro,
    removeMiembro,
    actualizarAsignaciones,
    actualizarComentario,
    completarParteMiembro,
  };
};

export function useActividadPendiente() {
  const { data, isLoading, refetch } = useBloqueosGlobales();

  return {
    data: data?.actividad ?? null,
    isLoading,
    refetch,
  };
}