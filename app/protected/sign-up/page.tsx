"use client";

import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Signup() {
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
    <div className="flex flex-col w-full max-w-md mx-auto p-8 gap-6">
      <h1 className="text-3xl font-semibold mb-6">Nuevo Usuario</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 text-base rounded mb-4 border border-red-300">
          {traducirError(decodeURIComponent(error))}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-3 text-base rounded mb-4 border border-green-300">
          {decodeURIComponent(success)}
        </div>
      )}

      <form className="flex flex-col gap-4">
        <div>
          <Label htmlFor="nombre" className="text-lg mb-1 block">
            Nombre completo
          </Label>
          <Input
            name="nombre"
            placeholder="Nombres y Apellidos"
            required
            className="h-12 text-lg"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-lg mb-1 block">
            Correo electrónico
          </Label>
          <Input
            name="email"
            placeholder="tu@correo.com"
            required
            className="h-12 text-lg"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-lg mb-1 block">
            Contraseña
          </Label>
          <Input
            type="password"
            name="password"
            placeholder="Tu contraseña"
            minLength={6}
            required
            className="h-12 text-lg"
          />
        </div>

        <div>
          <Label htmlFor="rol" className="text-lg mb-1 block">
            Rol
          </Label>
          <select
            name="rol"
            required
            className="h-12 text-lg border border-input rounded px-3 w-full"
          >
            <option value="">Seleccione un rol</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="lector">Lector</option>
          </select>
        </div>

        <SubmitButton
          formAction={signUpAction}
          pendingText="Creando..."
          className="h-12 text-lg"
        >
          Crear Usuario
        </SubmitButton>
      </form>
    </div>
  );
}