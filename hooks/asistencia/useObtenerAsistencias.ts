'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function useObtenerAsistencias(
  oficinaId: string | null,
  fechaInicio: Date | string | null,
  fechaFinal: Date | string | null
) {
  const [asistencias, setAsistencias] = useState<AsistenciaEnriquecida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data, error: rpcError } = await supabase.rpc('asistencias_usuarios', { 
        p_oficina_id: oficinaId,
        p_fecha_inicio: fechaInicio,
        p_fecha_final: fechaFinal
      });

      if (rpcError) {
        console.error('Error en useObtenerAsistencias:', rpcError);
        toast.error('Error al cargar las asistencias de la oficina.');
        setError(rpcError.message);
        setAsistencias([]);
      } else {
        setAsistencias(data as AsistenciaEnriquecida[] ?? []);
      }
    } catch (err: any) {
      console.error('Error inesperado en useObtenerAsistencias:', err);
      toast.error('Error inesperado al cargar asistencias.');
      setError(err.message);
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  }, [oficinaId, fechaInicio, fechaFinal]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  return { asistencias, loading, error, fetchAsistencias };
}