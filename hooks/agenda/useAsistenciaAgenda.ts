'use client';

import { useQuery } from '@tanstack/react-query';
import { obtenerRegistrosAgendaUsuario } from '@/components/concejo/agenda/lib/acciones';

const KEYS = {
  asistencia: (userId?: string | null, agendaId?: string | null) => 
    ['asistencia-agenda-usuario', userId, agendaId],
};

const FIVE_MINUTES = 1000 * 60 * 5;

export function useAsistenciaAgendaUsuario(userId?: string | null, agendaId?: string | null) {
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: KEYS.asistencia(userId, agendaId),
    
    queryFn: async () => {
      const res = await obtenerRegistrosAgendaUsuario(userId!, agendaId!);
      return res || [];
    },
    
    enabled: !!userId && !!agendaId,
    
    staleTime: FIVE_MINUTES, 
  });

  return { 
    registros: data || [], 
    loading: isLoading,    
    fetchRegistros: refetch 
  };
}