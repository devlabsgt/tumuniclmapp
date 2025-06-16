import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { id, nombre } = await request.json();

  const { error } = await supabase
    .from('modulos')
    .update({ nombre })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar módulo:', error.message);
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  }

  return NextResponse.json({ id, nombre });
}
