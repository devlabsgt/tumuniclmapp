import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Primera consulta: Obtener rol, permisos y módulos
  const { data: relacion, error: relacionError } = await supabase
    .from('usuarios_roles')
    .select(`
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
    .eq('user_id', user.id)
    .maybeSingle();

  // Segunda consulta: Obtener programas asignados
  const { data: programasData, error: programasError } = await supabase
    .from('accesos_programas')
    .select('programa')
    .eq('user_id', user.id);

  if (relacionError || programasError) {
    console.error('Error al obtener datos del perfil:', relacionError || programasError);
    // Devuelve datos básicos incluso si las consultas de perfil fallan
    return NextResponse.json({
      id: user.id,
      email: user.email,
      rol: null,
      permisos: [],
      modulos: [],
      programas: [],
    });
  }

  const rol = Array.isArray(relacion?.roles) ? relacion.roles[0] : relacion?.roles;
  const rolNombre: string | null = rol?.nombre || null;

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
  
  // Extraer la lista de nombres de programas
  const programas: string[] = programasData?.map((p: { programa: string }) => p.programa) || [];

  const resultado = {
    id: user.id,
    email: user.email,
    rol: rolNombre,
    permisos,
    modulos,
    programas, // <-- Campo añadido con la lista de programas
  };

  return NextResponse.json(resultado);
}
