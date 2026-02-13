'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createClient } from '@/utils/supabase/client';

export interface AsistenciaEnriquecida {
  id: number;
  created_at: string;
  tipo_registro: "Entrada" | "Salida" | null;
  ubicacion: any;
  notas: string | null;
  user_id: string;
  nombre: string | null;
  email: string | null;
  rol: string | null;
  programas: string[] | null;
  puesto_nombre: string | null;
  oficina_nombre: string | null;
  oficina_path_orden: string | null;
}

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  asistenciasUsuarios: (oficinaId: string | null, start: any, end: any) => 
    ['asistencias-usuarios', oficinaId, start, end],
};

export function useObtenerAsistencias(
  oficinaId: string | null,
  fechaInicio: Date | string | null,
  fechaFinal: Date | string | null
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: KEYS.asistenciasUsuarios(oficinaId, fechaInicio, fechaFinal),
    
    queryFn: async () => {
      const supabase = createClient();
      let supabaseError = null;

      try {
        const { data, error } = await supabase.rpc('asistencias_usuarios', { 
          p_oficina_id: oficinaId,
          p_fecha_inicio: fechaInicio,
          p_fecha_final: fechaFinal
        });

        supabaseError = error;

        if (supabaseError) {
          console.error('Error en useObtenerAsistencias:', supabaseError);
          toast.error('Error al cargar las asistencias de la oficina.');
          throw new Error(supabaseError.message);
        }

        return (data as AsistenciaEnriquecida[]) ?? [];

      } catch (err: any) {
        if (!supabaseError) {
             console.error('Error inesperado en useObtenerAsistencias:', err);
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