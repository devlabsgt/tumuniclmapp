"use client";

import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Login() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  function traducirError(mensaje: string) {
    const errores: Record<string, string> = {
      "email rate limit exceeded":
        "Demasiados intentos. Espere unos minutos antes de intentarlo de nuevo.",
      "user already registered":
        "El usuario ya está registrado. Intente iniciar sesión.",
      "invalid login credentials":
        "Credenciales incorrectas. Verifique su correo y contraseña.",
      "signup requires a valid password":
        "La contraseña no cumple con los requisitos.",
      "user not found": "Usuario no encontrado.",
    };

    const mensajeNormalizado = mensaje.toLowerCase();
    return errores[mensajeNormalizado] || mensaje;
  }

  return (
    <form className="flex-1 flex flex-col min-w-64 max-w-md mx-auto p-8 gap-6">
      <h1 className="text-2xl font-medium">Iniciar Sesión</h1>

      {/* ⛔ Mostrar mensaje de error si viene por URL */}
      {error && (
        <div className="bg-red-100 text-red-800 p-3 text-base rounded mb-4 border border-red-300">
          {traducirError(decodeURIComponent(error))}
        </div>
      )}

      {/* ✅ Mostrar mensaje de éxito si viene por URL */}
      {success && (
        <div className="bg-green-100 text-green-800 p-3 text-base rounded mb-4 border border-green-300">
          {decodeURIComponent(success)}
        </div>
      )}

      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-2">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="correo@ejemplo.com" required />

        <div className="flex justify-between items-center">
          <Label htmlFor="password">Contraseña&nbsp;</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
          ¿Se te olvidó la contraseña?
          </Link>
        </div>

        <Input
          type="password"
          name="password"
          placeholder="Tu Contraseña"
          required
        />

        <SubmitButton pendingText="Iniciando..." formAction={signInAction}>
          Iniciar Sesión
        </SubmitButton>
      </div>
    </form>
  );
}
