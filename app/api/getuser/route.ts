// /api/getuser/route.ts (Modificado)
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 💡 Llama a la nueva función de la base de datos
  const { data: userData, error: dataError } = await supabaseAdmin.rpc('usuario_sesion', { p_user_id: user.id });

  if (dataError || !userData || userData.length === 0) {
    console.error('Error al obtener datos del usuario:', dataError);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nombre: null,
      rol: null,
      permisos: [],
      modulos: [],
      programas: [],
    });
  }

  const resultado = userData[0];

  return NextResponse.json(resultado);
}