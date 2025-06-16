import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { id, email, nombre, roles, password, activo } = await req.json();

    if (!id || !email || !nombre || !roles?.length) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Actualizar datos en auth
    const updateData: any = {
      email,
      user_metadata: {
        nombre,
        roles,
        activo,
      },
    };

    if (password) updateData.password = password;

    const { error: errorAuth } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (errorAuth) {
      console.error('Error al actualizar auth:', errorAuth);
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
    }

    // 2. Actualizar nombre y activo en usuarios_perfil
    const { error: errorPerfil } = await supabaseAdmin
      .from('usuarios_perfil')
      .update({ nombre, activo })
      .eq('user_id', id);

    if (errorPerfil) {
      console.error('Error al actualizar perfil:', errorPerfil);
      return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }

    // 3. Reemplazar roles en usuarios_roles
    // 3.1 Eliminar los anteriores
    const { error: errorDelete } = await supabaseAdmin
      .from('usuarios_roles')
      .delete()
      .eq('user_id', id);

    if (errorDelete) {
      console.error('Error al eliminar roles anteriores:', errorDelete);
      return NextResponse.json({ error: 'No se pudieron eliminar roles previos' }, { status: 500 });
    }

    // 3.2 Insertar nuevos
    const nuevosRoles = roles.map((rol_id: string) => ({ user_id: id, rol_id }));
    const { error: errorInsert } = await supabaseAdmin
      .from('usuarios_roles')
      .insert(nuevosRoles);

    if (errorInsert) {
      console.error('Error al insertar nuevos roles:', errorInsert);
      return NextResponse.json({ error: 'No se pudieron asignar nuevos roles' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
