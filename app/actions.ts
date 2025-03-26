"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/protected/sign-up",
      "El correo y la contraseña son requeridos"
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
      "/protected/sign-up",
      "No se pudo verificar si el usuario ya existe"
    );
  }

  if (yaExiste) {
    return encodedRedirect(
      "error",
      "/protected/sign-up",
      "El usuario ya está registrado. Intente iniciar sesión, si el error persiste, comuniquése con soporte técnico."
    );
  }

  // 🚀 Crear usuario
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/protected/sign-up", error.message);
  }

  if (!data?.user) {
    return encodedRedirect(
      "error",
      "/protected/sign-up",
      "No se pudo crear el usuario. Intente de nuevo."
    );
  }

  return encodedRedirect(
    "success",
    "/protected/sign-up",
    "Usuario creado. Pide al usuario que confirme su cuenta"
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/protected");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "El correo es requerido");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    return encodedRedirect("error", "/forgot-password", "No se pudo enviar el correo de recuperación");
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
