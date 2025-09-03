'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Asistencia } from '@/lib/asistencia/esquemas';

export function useObtenerAsistencias() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/asistencia');
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error al obtener asistencias:', errorText);
        toast.error('Error al cargar la lista de asistencias.');
        setError(errorText || 'Error al cargar las asistencias.');
        setAsistencias([]);
        return;
      }

      const { data, error: apiError } = await res.json();

      if (apiError) {
        console.error('Error de API:', apiError);
        toast.error('Error al cargar la lista de asistencias.');
        setError(apiError);
        setAsistencias([]);
        return;
      }

      setAsistencias(data ?? []);
    } catch (err: any) {
      console.error('Error inesperado al obtener asistencias:', err);
      toast.error('Error inesperado al cargar las asistencias.');
      setError(err.message || 'Error inesperado al cargar las asistencias.');
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  return { asistencias, loading, error, fetchAsistencias };
}