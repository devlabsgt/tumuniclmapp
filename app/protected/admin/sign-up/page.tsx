"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const success = searchParams.get("success");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rol, setRol] = useState("");

  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

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

  const cumpleRequisitos =
    /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);
  const contraseñasCoinciden = password === confirmar;
  const camposCompletos =
    nombre && email && password && confirmar && rol;
  const formularioValido =
    camposCompletos && contraseñasCoinciden && cumpleRequisitos;

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
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-lg"
          />
        </div>

        {/* Campo contraseña */}
        <div>
          <Label htmlFor="password" className="text-lg mb-1 block">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              type={mostrarPass ? "text" : "password"}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              className="h-12 text-lg pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrarPass(!mostrarPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {mostrarPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Campo confirmar contraseña */}
        <div>
          <Label htmlFor="confirmar" className="text-lg mb-1 block">
            Confirmar contraseña
          </Label>
          <div className="relative">
            <Input
              type={mostrarConfirm ? "text" : "password"}
              name="confirmar"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className="h-12 text-lg pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrarConfirm(!mostrarConfirm)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {mostrarConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {confirmar && !contraseñasCoinciden && (
            <p className="text-red-600 text-sm mt-1">
              Las contraseñas no coinciden.
            </p>
          )}
        </div>

        {/* Requisitos visuales */}
        <ul className="text-sm text-gray-600 space-y-1 mt-1">
          <li className={password.length >= 8 ? "text-green-600" : "text-red-600"}>
            • Al menos 8 caracteres
          </li>
          <li className={/[A-Z]/.test(password) ? "text-green-600" : "text-red-600"}>
            • Una letra mayúscula
          </li>
          <li className={/[a-z]/.test(password) ? "text-green-600" : "text-red-600"}>
            • Una letra minúscula
          </li>
          <li className={/\d/.test(password) ? "text-green-600" : "text-red-600"}>
            • Un número
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-red-600"}>
            • Un símbolo (ej. !@#$%)
          </li>
        </ul>

        <div>
          <Label htmlFor="rol" className="text-lg mb-1 block">
            Rol
          </Label>
          <select
            name="rol"
            required
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="h-12 text-lg border border-input rounded px-3 w-full"
          >
            <option value="">Seleccione un rol</option>
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
          </select>
        </div>

        <SubmitButton
          formAction={signUpAction}
          pendingText="Creando..."
          className="h-12 text-lg"
          disabled={!formularioValido}
        >
          Crear Usuario
        </SubmitButton>
      </form>
    </div>
  );
}
