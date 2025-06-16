import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient(); // 👈 aquí estaba el error, faltaba el await
  const { id, nombre } = await request.json();

  const { error } = await supabase
    .from('roles')
    .update({ nombre })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar rol:', error.message);
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
