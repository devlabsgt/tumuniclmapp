import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { obtenerFechaYFormatoGT } from '@/utils/formatoFechaGT';
import { registrarLogServer } from '@/utils/registrarLogServer';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, nombre, rol, password, activo, direccion, telefono, dpi, nit, igss, cuenta_no } = await req.json();

    const supabase = await createClient();
    const { data: { user: usuarioEditor } } = await supabase.auth.getUser();
    const user_id_log = usuarioEditor?.id;

    if (!email || !password || !rol || !nombre) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const { data: yaExiste, error: errorVerificacion } = await supabaseAdmin.rpc(
      'correo_ya_registrado',
      { email_input: email }
    );

    if (errorVerificacion) {
      return NextResponse.json({ error: 'Error al verificar el correo.' }, { status: 500 });
    }

    if (yaExiste) {
      return NextResponse.json({ error: 'Usuario ya registrado.' }, { status: 409 });
    }

    const { data: userData, error: errorCreacion } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (errorCreacion || !userData?.user) {
      return NextResponse.json({ error: errorCreacion?.message || 'No se pudo crear el usuario.' }, { status: 500 });
    }

    const user_id = userData.user.id;

    await supabaseAdmin
      .from('info_usuario')
      .insert({ user_id, nombre, activo: true, direccion, telefono, dpi, nit, igss, cuenta_no });

    await supabaseAdmin
      .from('usuarios_roles')
      .insert({ user_id, rol_id: rol });

    const { fecha } = obtenerFechaYFormatoGT();

    await registrarLogServer({
      accion: 'CREAR_USUARIO',
      descripcion: `Creó al usuario ${email}`,
      nombreModulo: 'SISTEMA',
      fecha,
      user_id: user_id_log,
    });

    return NextResponse.json({ message: 'Usuario creado con éxito.' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}