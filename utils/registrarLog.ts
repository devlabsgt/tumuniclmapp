'use client';

import { createClient } from '@/utils/supabase/client';

export async function registrarLog({
  accion,
  descripcion,
  nombreModulo,
  fecha,
  user_id,
}: {
  accion: string;
  descripcion: string;
  nombreModulo: string;
  fecha?: Date;
  user_id?: string;
}) {
  const supabase = createClient();

  const fechaFinal = fecha ?? new Date();

  const finalUserId = user_id ?? (await supabase.auth.getUser()).data.user?.id;
  if (!finalUserId) return;

  const { data: modulo, error: modError } = await supabase
    .from('modulos')
    .select('id')
    .eq('nombre', nombreModulo)
    .maybeSingle();

  if (!modulo || modError) return;

  await supabase.from('logs').insert({
    user_id: finalUserId,
    modulo_id: modulo.id,
    accion,
    descripcion,
    fecha: fechaFinal,
  });

  // ⏳ Breve pausa para asegurar escritura antes de redirigir o cerrar sesión
  await new Promise((resolve) => setTimeout(resolve, 150));
}
