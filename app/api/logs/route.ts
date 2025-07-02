// app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accion, descripcion, nombreModulo, fecha } = body;

    if (!accion || !descripcion || !nombreModulo || !fecha) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('logs').insert({
      accion,
      descripcion,
      nombre_modulo: nombreModulo,
      fecha,
    });

    if (error) {
      return NextResponse.json({ error: 'Error al insertar log' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
