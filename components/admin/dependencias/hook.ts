'use client'

import { useQuery } from '@tanstack/react-query';
import { getDatosFirmante, getNacimientoUsuario } from './actions';

// Corrección: Agregamos la definición de 'nacimiento' aquí
export const KEYS_FIRMANTE = {
  firmante: ['firmante-sesion'],
  nacimiento: (id: string) => ['nacimiento-usuario', id], // <--- ESTO FALTABA
};

export const useFirmante = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: KEYS_FIRMANTE.firmante,
    queryFn: () => getDatosFirmante(),
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false,
  });

  return {
    nombre: data?.nombre || "", 
    cargo: data?.cargo || "",
    loading: isLoading,
    error: isError
  };
};

// Hook para obtener nacimiento
export const useNacimientoUsuario = (userId: string | null) => {
  const { data } = useQuery({
    // Ahora sí existe KEYS_FIRMANTE.nacimiento
    queryKey: KEYS_FIRMANTE.nacimiento(userId || ''),
    queryFn: () => getNacimientoUsuario(userId!),
    enabled: !!userId, // Solo ejecuta si hay ID
    staleTime: 1000 * 60 * 10, // Cache de 10 minutos
  });

  return { nacimiento: data };
};