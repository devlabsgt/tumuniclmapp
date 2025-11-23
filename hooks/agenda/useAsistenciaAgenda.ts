'use client';

import { useState, useEffect, useCallback } from 'react';
import { obtenerRegistrosAgendaUsuario } from '@/components/concejo/agenda/lib/acciones';

export function useAsistenciaAgendaUsuario(userId?: string | null, agendaId?: string | null) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistros = useCallback(async () => {
    if (!userId || !agendaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await obtenerRegistrosAgendaUsuario(userId, agendaId);
      setRegistros(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId, agendaId]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  return { registros, loading, fetchRegistros };
}