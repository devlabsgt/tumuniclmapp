'use server';

import { createClient } from '@/utils/supabase/server';

const CAMPOS_PERMITIDOS = new Set(['img_url']);

/**
 * Server action: actualiza el campo de imagen en beneficiarios_fertilizante.
 */
export async function actualizarImgBeneficiarioAction(
  beneficiarioId: string,
  campo: string,
  path: string | null
) {
  if (!CAMPOS_PERMITIDOS.has(campo)) {
    throw new Error(`Campo no permitido: ${campo}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('beneficiarios_fertilizante')
    .update({ [campo]: path })
    .eq('id', beneficiarioId);

  if (error) {
    throw new Error(`Error al actualizar imagen: ${error.message}`);
  }

  return { campo, path };
}
