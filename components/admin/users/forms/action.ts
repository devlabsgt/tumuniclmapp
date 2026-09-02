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
      domicilio: formData.domicilio || null,
      vecindad: formData.vecindad || null,
      estado_civil: formData.estado_civil || null,
      genero: formData.genero || null,
      profesion: formData.profesion || null,
      fecha_antiguedad: formData.fecha_antiguedad || null,
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
    .select('telefono, dpi, nit, igss, cuenta_no, direccion, nacimiento, domicilio, vecindad, estado_civil, genero, profesion, fecha_antiguedad')
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
    domicilio: data.domicilio || null,
    vecindad: data.vecindad || null,
    estado_civil: data.estado_civil || null,
    genero: data.genero || null,
    profesion: data.profesion || null,
    fecha_antiguedad: data.fecha_antiguedad || null,
  };
}

export async function obtenerProfesionesUnicas() {
  const supabase = await createClient();

  // Fetches all professions, excluding nulls.
  // Using a single large query is fine since info_usuario is generally small
  // relative to database capabilities.
  const { data, error } = await supabase
    .from('info_usuario')
    .select('profesion')
    .not('profesion', 'is', null);

  if (error || !data) {
    console.error('Error fetching professions:', error);
    return [];
  }

  const profesionesSet = new Set<string>();
  data.forEach((row) => {
    if (row.profesion) {
      profesionesSet.add(row.profesion.trim());
    }
  });

  return Array.from(profesionesSet).sort((a, b) => a.localeCompare(b));
}