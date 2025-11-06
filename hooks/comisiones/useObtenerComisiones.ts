'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Usuario } from '@/lib/usuarios/esquemas';

export interface Asistente extends Usuario {
  encargado: boolean;
}

export interface Comision {
  id: string;
  titulo: string;
  fecha_hora: string;
  comentarios?: string[];
  asistentes: Asistente[] | null;
  aprobado: boolean;
  creado_por?: string;
  creador_nombre?: string;
  aprobado_por?: string;
  aprobador_nombre?: string;
}

export interface ComisionConFechaYHoraSeparada extends Comision {
  fecha: string;
  hora: string;
}

export function useObtenerComisiones(mes: number, anio: number, usuarioId?: string | null) {
  const [comisiones, setComisiones] = useState<ComisionConFechaYHoraSeparada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComisiones = useCallback(async () => {

    if (usuarioId === null) {
      setComisiones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fechaInicio = format(startOfMonth(new Date(anio, mes)), 'yyyy-MM-dd');
      const fechaFin = format(endOfMonth(new Date(anio, mes)), 'yyyy-MM-dd');

      let url = `/api/users/comision?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
      
      if (usuarioId) {
        url += `&userId=${usuarioId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error en la respuesta de la red');
      }
      
      const responseData = await response.json();
      if (!responseData.data) {
        setComisiones([]);
        return;
      }
      
      const comisionesFormateadas = responseData.data.map((comision: Comision) => {
        const date = new Date(comision.fecha_hora);
        const fecha = date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const hora = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return {
          ...comision,
          fecha,
          hora,
        };
      });
      
      setComisiones(comisionesFormateadas || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error al obtener comisiones:", err);
    } finally {
      setLoading(false);
    }
  }, [mes, anio, usuarioId]);

  useEffect(() => {
    fetchComisiones();
  }, [fetchComisiones]);

  return { comisiones, loading, error, refetch: fetchComisiones };
}