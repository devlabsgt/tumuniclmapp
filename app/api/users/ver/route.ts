import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function POST(req: Request) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  // 1. Obtener datos del perfil
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('usuarios_perfil')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();

  // 2. Obtener relación roles/permisos/módulos
  const { data: relacion, error } = await supabaseAdmin
    .from('usuarios_roles')
    .select(`
      rol_id,
      roles (
        nombre,
        roles_permisos (
          permiso:permisos (nombre)
        ),
        modulos_roles (
          modulo:modulos (nombre)
        )
      )
    `)
    .eq('user_id', id)
    .maybeSingle();

  // 3. Obtener datos del usuario en auth
  const { data: userResult, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);

  if (error || !relacion?.roles || !userResult?.user || userError) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const user = userResult.user;
  const rol = Array.isArray(relacion.roles) ? relacion.roles[0] : relacion.roles;

  const permisos: string[] = Array.isArray(rol?.roles_permisos)
    ? rol.roles_permisos
        .map((rp: any) => rp.permiso?.nombre)
        .filter((nombre: string | undefined): nombre is string => !!nombre)
    : [];

  const modulos: string[] = Array.isArray(rol?.modulos_roles)
    ? rol.modulos_roles
        .map((mr: any) => mr.modulo?.nombre)
        .filter((nombre: string | undefined): nombre is string => !!nombre)
    : [];

  return NextResponse.json({
    usuario: {
      id: user.id,
      email: user.email,
      nombre: perfil?.nombre || '',
      rol: rol?.nombre || null,
      rol_id: relacion?.rol_id || null, // ← añadido aquí
      permisos,
      modulos,
      activo: perfil?.activo ?? true,
    },
  });
}
