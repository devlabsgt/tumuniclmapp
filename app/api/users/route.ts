import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { obtenerFechaYFormatoGT } from '@/utils/formatoFechaGT';
import { registrarLogServer } from '@/utils/registrarLogServer';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del usuario es obligatorio para eliminar' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user: usuarioEditor }, error: userError } = await supabase.auth.getUser();

    if (userError || !usuarioEditor) {
      return NextResponse.json({ error: 'No se pudo verificar la sesión del usuario editor.' }, { status: 401 });
    }

    if (usuarioEditor.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 403 });
    }

    const { error: errorAuth } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (errorAuth) {
      console.error('Error al eliminar usuario: ' + errorAuth.message, errorAuth);
      return NextResponse.json({ error: 'No se pudo eliminar el usuario.' }, { status: 500 });
    }

    const { fecha } = obtenerFechaYFormatoGT();
    await registrarLogServer({
      accion: 'ELIMINAR_USUARIO',
      descripcion: `Se eliminó al usuario con ID: ${id}`,
      nombreModulo: 'SISTEMA',
      fecha,
      user_id: usuarioEditor.id,
    });

    return NextResponse.json({ message: 'Usuario eliminado con éxito' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}