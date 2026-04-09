'use server';

import supabaseAdmin from '@/lib/supabaseAdmin';

export async function actualizarInfoPersonal(userId: string, formData: any) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      telefono: formData.telefono,
      dpi: formData.dpi,
      nit: formData.nit,
      igss: formData.igss,
      cuenta_no: formData.cuenta_no,
      direccion: formData.direccion,
      nacimiento: formData.nacimiento || null,
    },
  });

  if (error) {
    console.error('Update error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function obtenerInfoUsuario(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    console.error('Error fetching user info:', error);
    return null;
  }

  const meta = data.user.user_metadata || {};
  return {
    telefono: meta.telefono || null,
    dpi: meta.dpi || null,
    nit: meta.nit || null,
    igss: meta.igss || null,
    cuenta_no: meta.cuenta_no || null,
    direccion: meta.direccion || null,
    nacimiento: meta.nacimiento || null,
  };
}