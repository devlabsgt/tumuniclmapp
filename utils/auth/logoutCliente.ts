// utils/auth/logoutCliente.ts
'use client';

import { createClient } from "@/utils/supabase/client";
import { registrarLog } from "@/utils/registrarLog";
import { obtenerFechaYFormatoGT } from "@/utils/formatoFechaGT";

export async function logoutPorInactividad() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { fecha, formateada } = obtenerFechaYFormatoGT();

  await registrarLog({
    accion: 'INACTIVIDAD',
    descripcion: `${user.email} cerró sesión automático por inactividad`,
    nombreModulo: 'SISTEMA',
  });
  await supabase.auth.signOut();
}