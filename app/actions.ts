"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import supabaseAdmin from '@/utils/supabase/admin';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const rol = formData.get("rol")?.toString(); // ✅ NUEVO
  const nombre = formData.get("nombre")?.toString();

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !rol) {
    return encodedRedirect(
      "error",
      "/protected/admin/sign-up",
      "El correo, la contraseña y el rol son requeridos"
    );
  }

  // ✅ Verificar si ya existe ese correo usando la función RPC
  const { data: yaExiste, error: errorVerificacion } = await supabase.rpc(
    "correo_ya_registrado",
    { email_input: email }
  );

  if (errorVerificacion) {
    return encodedRedirect(
      "error",
      "/protected/admin/sign-up",
      "No se pudo verificar si el usuario ya existe"
    );
  }

  if (yaExiste) {
    return encodedRedirect(
      "error",
      "/protected/admin/sign-up",
      "El usuario ya está registrado. Intente iniciar sesión, si el error persiste, comuniquése con soporte técnico."
    );
  }

  // 🚀 Crear usuario
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ✅ Se salta el correo
      user_metadata: {
        nombre,
        rol,
        activo: true,
      },
    });


  if (error) {
    return encodedRedirect("error", "/protected/admin/sign-up", error.message);
  }

  if (!data?.user) {
    return encodedRedirect(
      "error",
      "/protected/admin/sign-up",
      "No se pudo crear el usuario. Intente de nuevo."
    );
  }

  return encodedRedirect(
    "success",
    "/protected/admin/sign-up",
    "Usuario creado. Pide al usuario que confirme su cuenta"
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const traduccionErrores: Record<string, string> = {
      "Invalid login credentials": "Correo o contraseña incorrectos.",
      "Email not confirmed": "Debe confirmar su correo antes de iniciar sesión.",
      "User is banned": "Este usuario ha sido suspendido.",
    };

    const mensaje = traduccionErrores[error.message] || error.message;
    return encodedRedirect("error", "/sign-in", mensaje);
  }

  const user = data?.user;
  const meta = user?.user_metadata;

  // ✅ Verificar si el usuario está activo
  if (!meta?.activo) {
    await supabase.auth.signOut(); // Cerrar sesión si fue creado pero inactivo
    return encodedRedirect("error", "/sign-in", "Tu cuenta está desactivada. Contacta con Soporte Técnico.");
  }

  // ✅ Redirigir según rol
  if (meta?.rol === "admin") {
    return redirect("/protected/admin");
  } else {
    return redirect("/protected/user");
  }
};


export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "El correo es requerido");
  }

  // 🔁 AQUÍ VA LA MODIFICACIÓN
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    console.error("Error al enviar correo de recuperación:", error); // 👈 añade esto para depurar
    return encodedRedirect("error", "/forgot-password", error.message || "No se pudo enviar el correo de recuperación");
  }


  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Revisa tu correo electrónico para cambiar tu contraseña"
  );
};


export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "La contraseña y la confirmación son requeridas"
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Las contraseñas no coinciden"
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "La contraseña no pudo actualizarse"
    );
  }

  return encodedRedirect("success", "/reset-password", "Contraseña restablecida");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};