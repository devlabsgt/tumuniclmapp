'use client';

import { useQuery } from '@tanstack/react-query';

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  registrosComision: (comisionId?: string) => ['registros-comision', comisionId],
};

export function useRegistrosDeComision(comisionId?: string) {
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: KEYS.registrosComision(comisionId),
    
    queryFn: async () => {
      const response = await fetch(`/api/users/comision/registros?comisionId=${comisionId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los registros de la comisión.');
      }
      
      const json = await response.json();
      return json.data || [];
    },
    
    enabled: !!comisionId,
    
    staleTime: FIVE_MINUTES,
    retry: false,
  });

  return { 
    registros: data || [], 
    loading: isLoading,    
    error: error ? (error as Error).message : null, 
    fetchRegistros: refetch 
  };
}