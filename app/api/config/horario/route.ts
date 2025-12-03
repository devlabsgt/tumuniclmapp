import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get('nombre');

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('obtener_horario', { _nombre: nombre });

    if (error) {
      console.error('Error al obtener horarios:', error);
      return NextResponse.json({ message: 'Error al obtener horarios.' }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (err) {
    console.error('Error en la solicitud GET:', err);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dias, entrada, salida } = await request.json();

    const supabase = await createClient();

    const { error } = await supabase
      .from('horarios')
      .update({ dias, entrada, salida })
      .eq('nombre', 'Sistema'); 

    if (error) {
      console.error('Error al actualizar el horario:', error);
      return NextResponse.json({ message: 'Error al actualizar el horario.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Horario del sistema actualizado con éxito.' }, { status: 200 });

  } catch (err) {
    console.error('Error en la solicitud POST:', err);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}