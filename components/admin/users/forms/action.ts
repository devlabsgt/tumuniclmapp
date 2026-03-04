'use server';

import { createClient } from '@/utils/supabase/server';

export async function actualizarInfoPersonal(userId: string, formData: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('info_usuario')
    .update({
      nombre: formData.nombre,
      telefono: formData.telefono,
      dpi: formData.dpi,
      nit: formData.nit,
      igss: formData.igss,
      cuenta_no: formData.cuenta_no,
      direccion: formData.direccion,
      nacimiento: formData.nacimiento || null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Update error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function obtenerInfoUsuario(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('info_usuario')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user info:', error);
    return null;
  }

  return data;
}