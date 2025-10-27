'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Asistencia } from '@/lib/asistencia/esquemas';
import { createClient } from '@/utils/supabase/client';

export function useAsistencias(
  userId: string | null,
  fechaInicio: Date | string | null,
  fechaFinal: Date | string | null
) {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data, error: rpcError } = await supabase.rpc('obtener_asistencias', { 
        p_user_id_filtro: userId,
        p_fecha_inicio: fechaInicio,
        p_fecha_final: fechaFinal
      });

      if (rpcError) {
        console.error('Error en useAsistencias:', rpcError);
        toast.error('Error al cargar las asistencias.');
        setError(rpcError.message);
        setAsistencias([]);
      } else {
        setAsistencias(data ?? []);
      }
    } catch (err: any) {
      console.error('Error inesperado en useAsistencias:', err);
      toast.error('Error inesperado al cargar asistencias.');
      setError(err.message);
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  }, [userId, fechaInicio, fechaFinal]);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  return { asistencias, loading, error, fetchAsistencias };
}