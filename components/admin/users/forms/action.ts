'use server';

import { createClient } from '@/utils/supabase/server';

export async function actualizarInfoPersonal(userId: string, formData: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('info_usuario')
    .update({
      telefono: formData.telefono || null,
      dpi: formData.dpi || null,
      nit: formData.nit || null,
      igss: formData.igss || null,
      cuenta_no: formData.cuenta_no || null,
      direccion: formData.direccion || null,
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
    .select('telefono, dpi, nit, igss, cuenta_no, direccion, nacimiento')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user info:', error);
    return null;
  }

  return {
    telefono: data.telefono || null,
    dpi: data.dpi || null,
    nit: data.nit || null,
    igss: data.igss || null,
    cuenta_no: data.cuenta_no || null,
    direccion: data.direccion || null,
    nacimiento: data.nacimiento || null,
  };
}