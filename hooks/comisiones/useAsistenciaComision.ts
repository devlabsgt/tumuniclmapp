'use client';

import { useQuery } from '@tanstack/react-query';

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  asistenciaComision: (userId?: string | null) => ['asistencia-comision-usuario', userId],
};

export function useAsistenciaComisionUsuario(userId?: string | null) {
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: KEYS.asistenciaComision(userId),
    
    queryFn: async () => {
      const response = await fetch(`/api/users/comision/asistencia?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los registros de asistencia.');
      }
      
      const json = await response.json();
      return json.data || [];
    },
    
    enabled: !!userId,
    staleTime: FIVE_MINUTES,
  });

  return { 
    registros: data || [], 
    loading: isLoading,    
    fetchRegistros: refetch 
  };
}