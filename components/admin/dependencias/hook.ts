'use client'

import { useQuery } from '@tanstack/react-query';
import { getDatosFirmante } from './actions';

// Agregamos la key al objeto KEYS existente (asumiendo que este objeto crece)
export const KEYS_FIRMANTE = {
  firmante: ['firmante-sesion'],
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
    // Si hay error o está cargando, podemos devolver un estado de carga visual
    loading: isLoading,
    error: isError
  };
};