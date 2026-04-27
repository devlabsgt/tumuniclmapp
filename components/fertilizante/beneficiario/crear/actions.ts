'use server';

import { createClient } from "@/utils/supabase/server";

export async function buscarHistorialDPI(dpi: string, anioActual: string) {
  const supabase = await createClient();
  const anioNum = Number(anioActual);

  try {
    // Verificar si ya recibió el beneficio este año
    const { data: existeActual, error: errActual } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .eq('dpi', dpi)
      .eq('anio', anioNum)
      .maybeSingle();

    if (errActual) {
      console.error('Error al verificar DPI actual:', errActual);
      return { success: false, error: 'Error al verificar el DPI actual.' };
    }

    if (existeActual) {
      return { success: true, existeActual: true, data: existeActual };
    }

    // Buscar en otros años para jalar datos del más reciente
    const { data: historiales, error: errHistorial } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .eq('dpi', dpi)
      .neq('anio', anioNum)
      .order('anio', { ascending: false })
      .limit(1);

    if (errHistorial) {
      console.error('Error al buscar historial:', errHistorial);
      return { success: false, error: 'Error al buscar en el historial.' };
    }

    if (historiales && historiales.length > 0) {
      return { success: true, existeActual: false, data: historiales[0] };
    }

    // No existe en ningún año
    return { success: true, existeActual: false, data: null };
  } catch (error: any) {
    console.error('Error inesperado en buscarHistorialDPI:', error);
    return { success: false, error: error.message || 'Error inesperado del servidor.' };
  }
}
