'use client';

import { createClient } from "@/utils/supabase/client";
import { registrarLog } from "@/utils/registrarLog";
import { obtenerFechaYFormatoGT } from "@/utils/formatoFechaGT";

export async function logoutPorInactividad() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { fecha } = obtenerFechaYFormatoGT();

  await registrarLog({
    accion: 'INACTIVIDAD',
    descripcion: `Cierre de sesión automático por inactividad`,
    nombreModulo: 'SISTEMA',
    fecha,
    user_id: user.id,
  });


  await supabase.auth.signOut();
}
