// File: app/api/empleados/editar/route.ts

import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { user_id, data } = await req.json();

    if (!user_id || !data) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('empleados_municipales')
      .update(data)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error Supabase:', error);
      return NextResponse.json({ error: 'No se pudo actualizar empleado' }, { status: 500 });
    }

    // 🔥🔥🔥 AQUI le devolvemos algo aunque sea un mensaje para que no truene el res.json()
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error interno:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
