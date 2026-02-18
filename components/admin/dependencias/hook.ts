'use client'

import { useQuery } from '@tanstack/react-query';
import { getDatosFirmante, getNacimientoUsuario } from './actions';

export const KEYS_FIRMANTE = {
  firmante: ['firmante-sesion'],
  nacimiento: (id: string) => ['nacimiento-usuario', id], 
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

export const useNacimientoUsuario = (userId: string | null) => {
  const { data } = useQuery({
    queryKey: KEYS_FIRMANTE.nacimiento(userId || ''),
    queryFn: () => getNacimientoUsuario(userId!),
    enabled: !!userId, 
    staleTime: 1000 * 60 * 10, 
  });

  return { nacimiento: data };
};