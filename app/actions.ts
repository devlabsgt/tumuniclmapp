"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import supabaseAdmin from '@/utils/supabase/admin';
import { registrarLogServer } from '@/utils/registrarLogServer';
import { obtenerFechaYFormatoGT } from '@/utils/formatoFechaGT';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const nombre = formData.get("nombre")?.toString();
  const roles = formData.getAll("rol").map((r) => r.toString());

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || roles.length === 0 || !nombre) {
    return encodedRedirect("error", "/protected/admin/sign-up", "Todos los campos son obligatorios.");
  }

  // Validación: correo ya registrado
  const { data: yaExiste, error: errorVerificacion } = await supabase.rpc(
    'correo_ya_registrado',
    { email_input: email }
  );

  if (errorVerificacion) {
    return encodedRedirect("error", "/protected/admin/sign-up", "Error al verificar el correo.");
  }

  if (yaExiste) {
    return encodedRedirect("error", "/protected/admin/sign-up", "Usuario ya registrado.");
  }

  // Crear usuario sin metadata
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data?.user) {
    return encodedRedirect("error", "/protected/admin/sign-up", error?.message || "No se pudo crear.");
  }
 
  const user_id = data.user.id;

  // Insertar perfil
  const { error: errorPerfil } = await supabase
    .from("usuarios_perfil")
    .insert({ user_id, nombre, activo: true });

  if (errorPerfil) {
    console.error('Error al insertar en usuarios_perfil:', errorPerfil); // 👈 log completo
    return encodedRedirect("error", "/protected/admin/sign-up", "Error al guardar perfil.");
  }


  // Relacionar roles en usuarios_roles
  for (const rol_id of roles) {
    await supabase
      .from("usuarios_roles")
      .insert({ user_id, rol_id });
  }
    const { fecha, formateada } = obtenerFechaYFormatoGT();

    const {
      data: { user: usuarioActual },
    } = await supabase.auth.getUser();

    const emailActual = usuarioActual?.email ?? 'correo_desconocido';
    
    await registrarLogServer({
      accion: 'CREAR_USUARIO',
      descripcion: `Creó al usuario ${email}`,
      nombreModulo: 'SISTEMA',
      fecha,
    });
  return encodedRedirect("success", "/protected/admin/sign-up", "Usuario creado con éxito.");
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const traduccionErrores: Record<string, string> = {
      'Invalid login credentials': 'Correo o contraseña incorrectos.',
      'Email not confirmed': 'Debe confirmar su correo antes de iniciar sesión.',
      'User is banned': 'Este usuario ha sido suspendido.',
    };

    const mensaje = traduccionErrores[error.message] || error.message;
    return encodedRedirect('error', '/sign-in', mensaje);
  }

  const user = data?.user;

  // Consultar el campo activo desde la tabla relacionada
  const { data: perfil, error: errorPerfil } = await supabase
    .from('usuarios_perfil')
    .select('activo')
    .eq('user_id', user?.id)
    .single();

  if (errorPerfil) {
    console.error('Error al verificar estado del usuario:', errorPerfil);
    await supabase.auth.signOut();
    return encodedRedirect('error', '/sign-in', 'Error al iniciar sesión, Intenta más tarde, si el problema persiste contacta con Soporte Técnico.');
  }

  if (!perfil?.activo) {
    await supabase.auth.signOut();
    return encodedRedirect('error', '/sign-in', 'Tu cuenta está desactivada. Contacta con Soporte Técnico.');
  }
  const { fecha, formateada } = obtenerFechaYFormatoGT();

    const {
      data: { user: usuarioActual },
    } = await supabase.auth.getUser();

    const emailActual = usuarioActual?.email ?? 'correo_desconocido';

    await registrarLogServer({
      accion: 'INICIO_SESION',
      descripcion: `${emailActual} Inició sesión`,
      nombreModulo: 'SISTEMA',
      fecha,
    });

  return redirect('/protected');
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect("error", "/reset-password", "La contraseña y la confirmación son requeridas");
  }

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/reset-password", "Las contraseñas no coinciden");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return encodedRedirect("error", "/reset-password", "La contraseña no pudo actualizarse");
  }

  return encodedRedirect("success", "/reset-password", "Contraseña restablecida");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  const { fecha, formateada } = obtenerFechaYFormatoGT();

const {
  data: { user: usuarioActual },
} = await supabase.auth.getUser();

const emailActual = usuarioActual?.email ?? 'correo_desconocido';

await registrarLogServer({
  accion: 'CERRAR_SESION',
  descripcion: `${emailActual} cerró sesión`,
  nombreModulo: 'SISTEMA',
  fecha,
});

  await supabase.auth.signOut();

  return redirect("/");
};
