import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const comisionId = searchParams.get('comisionId');

  if (!comisionId) {
    return NextResponse.json({ error: 'comisionId es requerido' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('registros_comision')
      .select('*')
      .eq('comision_id', comisionId);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching commission records:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}