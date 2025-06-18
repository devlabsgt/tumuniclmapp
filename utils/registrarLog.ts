'use client';

import { createClient } from '@/utils/supabase/client';

export async function registrarLog({
  accion,
  descripcion,
  nombreModulo,
}: {
  accion: string;
  descripcion: string;
  nombreModulo: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: modulo, error: modError } = await supabase
    .from('modulos')
    .select('id')
    .eq('nombre', nombreModulo)
    .maybeSingle();

  if (!modulo || modError) return;

  await supabase.from('logs').insert([
    {
      user_id: user.id,
      modulo_id: modulo.id,
      accion,
      descripcion,
    },
  ]);
}
