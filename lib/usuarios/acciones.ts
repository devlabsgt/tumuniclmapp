// lib/acciones.ts
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export const fetchUsuario = async (id: string) => {
  const res = await fetch('/api/users/ver', {
    method: 'POST',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!res.ok || !json?.usuario) {
    console.error('Respuesta del backend:', json);
    throw new Error(json.error || 'Error al obtener usuario');
  }
  return json.usuario;
};