import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modulo = searchParams.get('modulo');

  if (!modulo) {
    return NextResponse.json({ error: 'El parámetro "modulo" es requerido' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('obtener_usuarios_por_modulo', {
      nombre_modulo: modulo,
    });

    if (error) {
      console.error('Error al obtener usuarios por módulo:', error);
      return NextResponse.json({ error: 'No se pudieron obtener los usuarios' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
