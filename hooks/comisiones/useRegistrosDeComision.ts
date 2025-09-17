'use client';

import { useState, useEffect, useCallback } from 'react';

export function useRegistrosDeComision(comisionId?: string) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistros = useCallback(async () => {
    if (!comisionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/users/comision/registros?comisionId=${comisionId}`);
      if (!response.ok) throw new Error('Error al obtener los registros de la comisión.');
      const data = await response.json();
      setRegistros(data.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [comisionId]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  return { registros, loading, error, fetchRegistros };
}