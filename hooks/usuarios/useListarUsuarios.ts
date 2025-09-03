'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Usuario } from '@/lib/usuarios/esquemas';

export function useListaUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/listar');
      const json = await res.json();

      if (!res.ok) {
        console.error('Error al obtener usuarios:', json.error);
        toast.error('Error al cargar la lista de usuarios.');
        setUsuarios([]);
        setError(json.error || 'Error al cargar la lista de usuarios.');
        return;
      }
      setUsuarios(json.data ?? []);
    } catch (err: any) {
      console.error('Error inesperado al obtener usuarios:', err);
      toast.error('Error inesperado al cargar los usuarios.');
      setUsuarios([]);
      setError(err.message || 'Error inesperado al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return { usuarios, loading, error, fetchUsuarios };
}