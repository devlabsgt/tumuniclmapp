'use client';

import { useQuery } from '@tanstack/react-query';
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

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  comisiones: (mes: number, anio: number, usuarioId?: string | null) => 
    ['comisiones-mensuales', mes, anio, usuarioId],
};

export function useObtenerComisiones(mes: number, anio: number, usuarioId?: string | null) {
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: KEYS.comisiones(mes, anio, usuarioId),
    
    queryFn: async () => {
      if (usuarioId === null) {
        return [];
      }

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
          return [];
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
        
        return (comisionesFormateadas as ComisionConFechaYHoraSeparada[]) || [];

      } catch (err: any) {
        console.error("Error al obtener comisiones:", err);
        throw err; 
      }
    },
    
    staleTime: FIVE_MINUTES, 
    retry: false,
  });

  return { 
    comisiones: data || [], 
    loading: isLoading, 
    error: error ? (error as Error).message : null, 
    refetch 
  };
}