import { createClient } from '@/utils/supabase/client';

export const obtenerDestinatariosClave = async () => {
  const supabase = createClient();
  const rolesObjetivo = ['CONCEJAL', 'ALCALDE', 'SECRETARIO', 'SUPER'];
  
  const { data, error } = await supabase
    .rpc('obtener_ids_usuarios_por_rol', { roles_filtro: rolesObjetivo });

  if (error) {
    console.error('Error obteniendo destinatarios para notificación:', error);
    return [];
  }

  return data.map((u: { id: string }) => u.id);
};