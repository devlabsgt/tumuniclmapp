import { createClient } from '@/utils/supabase/server';

export const registrarLogServer = async ({
  accion,
  descripcion,
  nombreModulo,
  fecha, // 👈 se le pasa la fecha directamente
}: {
  accion: string;
  descripcion: string;
  nombreModulo: string;
  fecha: Date;
}) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: modulo } = await supabase
    .from('modulos')
    .select('id')
    .eq('nombre', nombreModulo)
    .maybeSingle();

  if (!modulo) return;

  await supabase.from('logs').insert({
    user_id: user.id,
    modulo_id: modulo.id,
    accion,
    descripcion,
    fecha, // 👈 se guarda exactamente la misma
  });
};
