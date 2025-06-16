'use client';

import useSWR from 'swr';

interface UserData {
  rol: string;
  permisos: string[];
}

const fetcher = async (): Promise<UserData> => {
  const res = await fetch('/api/getuser');
  if (!res.ok) throw new Error('Error al obtener datos de usuario');
  const data = await res.json();

  if (!data.rol || !data.permisos) {
    throw new Error('Rol o permisos no encontrados en la respuesta');
  }

  return {
    rol: data.rol,
    permisos: data.permisos,
  };
};

export function useUserData() {
  const { data, error, isLoading } = useSWR('userData', fetcher);

  return {
    rol: data?.rol,
    permisos: data?.permisos || [],
    isLoading,
    isError: !!error,
  };
}
