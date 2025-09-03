import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let rpcOptions = {};
    if (userId) {
      rpcOptions = { user_id_filtro: userId };
    }

    const { data, error } = await supabaseAdmin.rpc('obtener_asistencias', rpcOptions);

    if (error) {
      console.error('Error al obtener asistencias:', error);
      return NextResponse.json({ error: 'No se pudieron obtener las asistencias' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Error inesperado:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}