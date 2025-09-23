import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { obtenerFechaYFormatoGT } from '@/utils/formatoFechaGT';
import { registrarLogServer } from '@/utils/registrarLogServer';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const { id, email, nombre, rol, password, activo, direccion, telefono, dpi, nit, igss, cuenta_no } = await req.json();

    if (!id || !email || !nombre || !rol) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Obtener datos actuales
    const { data: perfilActual, error: errorPerfilActual } = await supabaseAdmin
      .from('info_usuario')
      .select('nombre, activo, direccion, telefono, dpi, nit, igss, cuenta_no')
      .eq('user_id', id)
      .single();

    const { data: rolActualRow, error: errorRolActual } = await supabaseAdmin
      .from('usuarios_roles')
      .select('rol_id')
      .eq('user_id', id)
      .single();

    const { data: authActual, error: errorAuthActual } = await supabaseAdmin.auth.admin.getUserById(id);

    if (
      errorPerfilActual ||
      errorRolActual ||
      errorAuthActual ||
      !authActual?.user ||
      !rolActualRow
    ) {
      return NextResponse.json({ error: 'No se pudieron obtener datos actuales' }, { status: 500 });
    }

    const nombreAnterior = perfilActual.nombre ?? '—';
    const activoAnterior = perfilActual.activo;
    const direccionAnterior = perfilActual.direccion ?? '—';
    const telefonoAnterior = perfilActual.telefono ?? '—';
    const dpiAnterior = perfilActual.dpi ?? '—';
    const nitAnterior = perfilActual.nit ?? '—';
    const igssAnterior = perfilActual.igss ?? '—';
    const cuentaNoAnterior = perfilActual.cuenta_no ?? '—';

    const rolAnterior = rolActualRow.rol_id;
    const emailAnterior = authActual.user.email ?? '—';

    // 2. Actualizar en auth
    const updateData: any = { email };
    if (password) updateData.password = password;

    const { error: errorAuth } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (errorAuth) {
      console.error('Error al actualizar auth:', errorAuth);
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
    }

    // 3. Actualizar perfil
    const { error: errorPerfil } = await supabaseAdmin
      .from('info_usuario')
      .update({ nombre, activo, direccion, telefono, dpi, nit, igss, cuenta_no })
      .eq('user_id', id);

    if (errorPerfil) {
      console.error('Error al actualizar perfil:', errorPerfil);
      return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }

    // 4. Actualizar rol si cambió
    if (rol !== rolAnterior) {
      const { error: errorRol } = await supabaseAdmin
        .from('usuarios_roles')
        .update({ rol_id: rol })
        .eq('user_id', id);

      if (errorRol) {
        console.error('Error al actualizar rol:', errorRol);
        return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 });
      }
    }

    // 5. Construir log de cambios
    const cambios: string[] = [];

    if (email !== emailAnterior) {
      cambios.push(`Correo: "${emailAnterior}" → "${email}"`);
    }

    if (nombre !== nombreAnterior) {
      cambios.push(`Nombre: "${nombreAnterior}" → "${nombre}"`);
    }

    if (activo !== activoAnterior) {
      const estadoAnterior = activoAnterior ? 'activo' : 'inactivo';
      const estadoNuevo = activo ? 'activo' : 'inactivo';
      cambios.push(`Estado: "${estadoAnterior}" → "${estadoNuevo}"`);
    }
    
    if (direccion !== direccionAnterior) {
      cambios.push(`Dirección: "${direccionAnterior}" → "${direccion}"`);
    }

    if (telefono !== telefonoAnterior) {
      cambios.push(`Teléfono: "${telefonoAnterior}" → "${telefono}"`);
    }
    
    if (dpi !== dpiAnterior) {
      cambios.push(`DPI: "${dpiAnterior}" → "${dpi}"`);
    }

    if (nit !== nitAnterior) {
      cambios.push(`NIT: "${nitAnterior}" → "${nit}"`);
    }
    
    if (igss !== igssAnterior) {
      cambios.push(`IGSS: "${igssAnterior}" → "${igss}"`);
    }
    
    if (cuenta_no !== cuentaNoAnterior) {
      cambios.push(`No. de Cuenta: "${cuentaNoAnterior}" → "${cuenta_no}"`);
    }


    // Obtener nombres de roles
    const { data: rolAnteriorData } = await supabaseAdmin
      .from('roles')
    .select('nombre')
      .eq('id', rolAnterior)
      .maybeSingle();

    const { data: rolNuevoData } = await supabaseAdmin
      .from('roles')
      .select('nombre')
      .eq('id', rol)
      .maybeSingle();

    const nombreRolAnterior = rolAnteriorData?.nombre ?? rolAnterior;
    const nombreRolNuevo = rolNuevoData?.nombre ?? rol;

    if (rol !== rolAnterior) {
      cambios.push(`Rol: "${nombreRolAnterior}" → "${nombreRolNuevo}"`);
    }

    if (password) {
      cambios.push(`Contraseña: actualizada`);
    }

    // 6. Registrar log con usuario en sesión real
    const { fecha } = obtenerFechaYFormatoGT();
    const supabase = await createClient();

    const {
      data: { user: usuarioEditor },
    } = await supabase.auth.getUser();

    const user_id_editor = usuarioEditor?.id;
    const emailEditor = usuarioEditor?.email ?? 'correo_desconocido';

    await registrarLogServer({
      accion: 'EDITAR_USUARIO',
      descripcion: `<br> Se editó al usuario ${email}:<br><br>${cambios.join('<br><br>')}<br><br>`,
      nombreModulo: 'SISTEMA',
      fecha,
      user_id: user_id_editor,
    });

    return NextResponse.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}