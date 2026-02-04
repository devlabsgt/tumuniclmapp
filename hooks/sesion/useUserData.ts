'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  userId: string | null;
  nombre: string;
  email: string;
  rol: string;
  esjefe: boolean;
  permisos: string[];
  modulos: string[];
  programas: string[];
  cargando: boolean;
  horario_nombre: string | null;
  horario_dias: number[] | null;
  horario_entrada: string | null;
  horario_salida: string | null;
  dependencia_id: string | null;
}

// Función fetcher separada (buena práctica)
async function fetchUserSession() {
  const supabase = createClient();
  
  // 1. Verificar sesión básica
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. Traer datos completos con el RPC
  const { data, error } = await supabase.rpc('usuario_sesion');
  
  if (error || !data || !data[0]) {
    // Si hay error en RPC pero hay usuario, retornamos info básica
    return {
      id: user.id,
      email: user.email,
      // Resto vacío
    };
  }

  return data[0];
}

export default function useUserData(): UserData {
  const { data, isLoading } = useQuery({
    queryKey: ['userSession'], // Clave única para el caché
    queryFn: fetchUserSession,
    staleTime: 1000 * 60 * 30, // 30 MINUTOS de vida útil (Esto es lo que te ahorra dinero)
    gcTime: 1000 * 60 * 60,    // 1 Hora en basura antes de borrar
    retry: false,              // No reintentar si falla (ahorra llamadas)
    refetchOnWindowFocus: false, // No recargar si cambias de ventana
  });

  // Mapear los datos para mantener la estructura que tu app espera
  return {
    userId: data?.id || null,
    nombre: data?.nombre || '',
    email: data?.email || '',
    rol: data?.rol || '',
    esjefe: data?.esjefe || false,
    permisos: data?.permisos || [],
    modulos: data?.modulos || [],
    programas: data?.programas || [],
    cargando: isLoading,
    horario_nombre: data?.horario_nombre || null,
    horario_dias: data?.horario_dias || null,
    horario_entrada: data?.horario_entrada || null,
    horario_salida: data?.horario_salida || null,
    dependencia_id: data?.dependencia_id || null,
  };
}