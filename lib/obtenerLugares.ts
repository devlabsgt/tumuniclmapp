import { createClient } from '@/utils/supabase/client';

export async function obtenerLugares(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lugares_clm')
    .select('nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener lugares:', error.message);
    return [];
  }

  return data?.map((l) => l.nombre) ?? [];
}
