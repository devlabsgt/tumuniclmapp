'use server'

import { createClient } from '@/utils/supabase/server';

export interface DatosFirmante {
  nombre: string;
  cargo: string;
}

export const getDatosFirmante = async (): Promise<DatosFirmante> => {
  const supabase = await createClient();

  // 1. Obtener usuario de la sesión
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { nombre: "Usuario Desconocido", cargo: "" };
  }

  try {
    // 2. Consulta optimizada
    // Usamos 'dependencia:dependencia_id' para ser explícitos en la relación.
    // Esto le dice a Supabase: "Únete a la tabla dependencias usando la columna dependencia_id"
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
      // Fallback usando metadata si falla la DB
      return { 
        nombre: user.user_metadata?.nombre || "FIRMA AUTORIZADA", 
        cargo: "ADMINISTRACIÓN" // Valor por defecto seguro
      };
    }

    // 3. Mapeo de datos directo
    // Al ser una relación "Uno a Uno" (un usuario tiene una dependencia padre),
    // Supabase devuelve un objeto, no un array.
    // Hacemos cast a 'any' temporalmente en el acceso para evitar errores de TS si no tienes los tipos generados.
    const dependenciaData = (datosUser as any).dependencia;

    // Extraemos el nombre de la dependencia como Cargo
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

// --- NUEVA FUNCIÓN PARA OBTENER NACIMIENTO ---
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