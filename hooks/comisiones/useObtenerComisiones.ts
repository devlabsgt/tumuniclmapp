'use client';

import { useState, useEffect, useCallback } from 'react';
import { Usuario } from '@/lib/usuarios/esquemas';

// Se crea una nueva interfaz local que extiende Usuario
export interface Asistente extends Usuario {
  encargado: boolean;
}

// Se actualiza la interfaz Comision para usar la nueva interfaz Asistente
export interface Comision {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  comentarios?: string;
  asistentes: Asistente[] | null;
}

export function useObtenerComisiones() {
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComisiones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/comision');
      if (!response.ok) {
        throw new Error('Error en la respuesta de la red');
      }
      const { data } = await response.json();
      setComisiones(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error al obtener comisiones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComisiones();
  }, [fetchComisiones]);

  return { comisiones, loading, error, refetch: fetchComisiones };
}