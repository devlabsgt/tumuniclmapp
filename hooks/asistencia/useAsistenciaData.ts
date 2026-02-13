'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { obtenerTodosLosRegistros, Registro, eliminarRegistroAsistencia, obtenerRegistrosHoy } from '@/lib/asistencia/acciones';

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  hoy: (userId?: string) => ['asistencia-hoy', userId],
  todos: (userId?: string) => ['asistencia-todos', userId],
};

export default function useAsistenciaData(userId: string | undefined) {
  const queryClient = useQueryClient();

  const hoyQuery = useQuery({
    queryKey: KEYS.hoy(userId),
    queryFn: () => obtenerRegistrosHoy(userId!),
    enabled: !!userId,
    refetchInterval: 60000, 
    staleTime: FIVE_MINUTES, 
  });

  const todosQuery = useQuery({
    queryKey: KEYS.todos(userId),
    queryFn: () => obtenerTodosLosRegistros(userId!),
    enabled: !!userId,
    staleTime: FIVE_MINUTES, 
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarRegistroAsistencia,
  });

  const setRegistrosHoy = (updater: any) => {
    queryClient.setQueryData(KEYS.hoy(userId), updater);
  };

  const setTodosLosRegistros = (updater: any) => {
    queryClient.setQueryData(KEYS.todos(userId), updater);
  };

  const handleEliminarRegistro = async (registro: Registro) => {
    if (!registro.id) return;
    
    const exito = await eliminarMutation.mutateAsync(registro.id);

    if (exito) {
      setRegistrosHoy((prev: Registro[] = []) => prev.filter((r) => r.id !== registro.id));
      setTodosLosRegistros((prev: Registro[] = []) => prev.filter((r) => r.id !== registro.id));
    }
  };

  return {
    registrosHoy: hoyQuery.data || [],
    todosLosRegistros: todosQuery.data || [],
    cargandoHoy: hoyQuery.isLoading,
    cargandoRegistros: todosQuery.isLoading,
    setRegistrosHoy,
    setTodosLosRegistros,
    handleEliminarRegistro
  };
}