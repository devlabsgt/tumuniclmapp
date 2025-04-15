// File: app/api/empleados/editar/route.ts

import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { id, data } = await req.json();

    if (!id || !data) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const { error, data: updated } = await supabaseAdmin
      .from('empleados_municipales')
      .update(data)
      .eq('id', id) // ✅ Aquí solo usamos id
      .select();

    if (error) {
      console.error('Error Supabase:', error);
      return NextResponse.json({ error: 'No se pudo actualizar empleado' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'No se encontró el registro para actualizar' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error interno:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
