import { createClient } from '@/utils/supabase/server';
export const registrarLogServer = async ({
  accion,
  descripcion,
  nombreModulo,
  fecha,
  user_id,
}: {
  accion: string;
  descripcion: string;
  nombreModulo: string;
  fecha: Date;
  user_id?: string;
}) => {
  const supabase = await createClient();

  const finalUserId = user_id
    ?? (await supabase.auth.getUser()).data.user?.id;

  if (!finalUserId) return;

  const { data: modulo } = await supabase
    .from('modulos')
    .select('id')
    .eq('nombre', nombreModulo)
    .maybeSingle();

  if (!modulo) return;

  await supabase.from('logs').insert({
    user_id: finalUserId,
    modulo_id: modulo.id,
    accion,
    descripcion,
    fecha,
  });
};
