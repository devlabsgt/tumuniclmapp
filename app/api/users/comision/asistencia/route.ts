import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

// OBTIENE los registros de asistencia
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID es requerido' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('registros_comision')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching commission attendance:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// CREA un nuevo registro de asistencia
export async function POST(request: Request) {
  try {
    const { userId, comisionId, tipo, ubicacion, notas } = await request.json();
    
    if (!userId || !comisionId || !tipo || !ubicacion) {
      return NextResponse.json({ error: 'Faltan datos para marcar la asistencia' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('registros_comision')
      .insert({
        user_id: userId,
        comision_id: comisionId,
        tipo_registro: tipo,
        ubicacion: ubicacion,
        notas: notas,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear registro de asistencia:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

// ELIMINA un registro de asistencia
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json(); // Se necesita el ID del registro a eliminar
    if (!id) {
      return NextResponse.json({ error: 'El ID del registro es obligatorio' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('registros_comision')
      .delete()
      .match({ id });

    if (error) throw error;

    return NextResponse.json({ message: 'Registro eliminado con éxito' }, { status: 200 });
  } catch (error: any) {
    console.error('Error al eliminar registro de asistencia:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}