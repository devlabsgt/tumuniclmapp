'use server';

import { createClient } from '@/utils/supabase/server';

export async function crearCitacion(
  id_usuario: string, 
  motivo: string, 
  fecha_cita: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('citaciones')
    .insert({
      id_usuario,
      motivo,
      fecha_cita,
      estado: 'Pendiente'
    });

  if (error) {
    console.error('Insert error citaciones:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function obtenerCitacionesUsuario(id_usuario: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('citaciones')
    .select('*')
    .eq('id_usuario', id_usuario)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch error citaciones:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data };
}

export async function obtenerCitacionPendienteActual() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { success: false, data: null };
  }

  const userId = userData.user.id;

  const { data, error } = await supabase
    .from('citaciones')
    .select('*')
    .eq('id_usuario', userId)
    .eq('estado', 'Pendiente')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned, which is fine
    console.error('Fetch pending citacion error:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data || null };
}

export async function confirmarCitacion(id: string) {
  const supabase = await createClient();

  // We do not need to update leido_por_nombre because we removed it from the schema.
  // We just update estado and fecha_confirmado.
  const { error } = await supabase
    .from('citaciones')
    .update({ 
      estado: 'Confirmada',
      fecha_confirmado: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Update citacion error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function actualizarCitacion(
  id: string, 
  motivo: string, 
  fecha_cita: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('citaciones')
    .update({ 
      motivo,
      fecha_cita
    })
    .eq('id', id);

  if (error) {
    console.error('Update error citaciones:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function eliminarCitacion(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('citaciones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete error citaciones:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
