'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Asistencia } from '@/lib/asistencia/esquemas';
import { createClient } from '@/utils/supabase/client';

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  asistencias: (userId: string | null, start: any, end: any) => 
    ['asistencias-rango', userId, start, end],
};

export function useAsistencias(
  userId: string | null,
  fechaInicio: Date | string | null,
  fechaFinal: Date | string | null
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: KEYS.asistencias(userId, fechaInicio, fechaFinal),
    
    queryFn: async () => {
      const supabase = createClient();
      
      let supabaseError = null;

      try {
        const { data, error } = await supabase.rpc('obtener_asistencias', { 
          p_user_id_filtro: userId,
          p_fecha_inicio: fechaInicio,
          p_fecha_final: fechaFinal
        });
        
        supabaseError = error; 

        if (supabaseError) {
          console.error('Error en useAsistencias:', supabaseError);
          toast.error('Error al cargar las asistencias.');
          throw new Error(supabaseError.message);
        }

        return (data as Asistencia[]) ?? [];

      } catch (err: any) {
        if (!supabaseError) {
             console.error('Error inesperado en useAsistencias:', err);
             toast.error('Error inesperado al cargar asistencias.');
        }
        throw err; 
      }
    },
    
    staleTime: FIVE_MINUTES,
    retry: false, 
  });

  return { 
    asistencias: data || [], 
    loading: isLoading, 
    error: error ? (error as Error).message : null, 
    fetchAsistencias: refetch
  };
}