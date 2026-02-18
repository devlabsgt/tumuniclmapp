'use server'

import { createClient } from '@/utils/supabase/server';

export interface DatosFirmante {
  nombre: string;
  cargo: string;
}

export const getDatosFirmante = async (): Promise<DatosFirmante> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { nombre: "Usuario Desconocido", cargo: "" };
  }

  try {
    const { data: datosUser, error } = await supabase
      .from('info_usuario')
      .select(`
        nombre,
        dependencia:dependencia_id (
          nombre
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error || !datosUser) {
      console.error("Error obteniendo firmante:", error?.message);
      return { 
        nombre: user.user_metadata?.nombre || "FIRMA AUTORIZADA", 
        cargo: "ADMINISTRACIÓN" 
      };
    }

    const dependenciaData = (datosUser as any).dependencia;

    const cargoReal = dependenciaData?.nombre || "Encargado"; 

    return {
      nombre: datosUser.nombre || "Usuario del Sistema",
      cargo: cargoReal
    };

  } catch (err) {
    console.error("Excepción crítica en getDatosFirmante:", err);
    return { nombre: "Error de Datos", cargo: "---" };
  }
};

export const getNacimientoUsuario = async (userId: string): Promise<string | null> => {
  if (!userId) return null;
  
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('info_usuario')
      .select('nacimiento')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    
    return data?.nacimiento || null;
  } catch (error) {
    console.error("Error al obtener nacimiento:", error);
    return null;
  }
};