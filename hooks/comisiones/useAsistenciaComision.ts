'use client';

import { useState, useEffect, useCallback } from 'react';

export function useAsistenciaComisionUsuario(userId?: string | null) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistros = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // --- ESTA ES LA LÍNEA A CORREGIR ---
      const response = await fetch(`/api/users/comision/asistencia?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los registros de asistencia.');
      }
      
      const data = await response.json();
      setRegistros(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  return { registros, loading, fetchRegistros };
}