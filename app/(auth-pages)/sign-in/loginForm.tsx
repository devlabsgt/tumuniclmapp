'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import BotonVolver from '@/components/ui/botones/BotonVolver';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const [verPassword, setVerPassword] = useState(false);

  function traducirError(mensaje: string) {
    const errores: Record<string, string> = {
      'email rate limit exceeded':
        'Demasiados intentos. Espere unos minutos antes de intentarlo de nuevo.',
      'user already registered':
        'El usuario ya está registrado. Intente iniciar sesión.',
      'invalid login credentials':
        'Credenciales incorrectas. Verifique su correo y contraseña.',
      'signup requires a valid password':
        'La contraseña no cumple con los requisitos.',
      'user not found': 'Usuario no encontrado.',
    };

    const mensajeNormalizado = mensaje.toLowerCase();
    return errores[mensajeNormalizado] || mensaje;
  }

  return (
    <form className="flex-1 flex flex-col max-w-xl mx-auto px-8 py-10 gap-8 text-2xl bg-white rounded-xl shadow-md mt-10">
      {/* Volver y Título */}
      <div className="flex items-center justify-between mb-4">
        <BotonVolver ruta="/" />
      </div>
        <h1 className="text-3xl font-bold text-center flex-1">Iniciar Sesión</h1>
        <h2 className="text-lg  text-blue-500  text-center">Ingresa tus credenciales para iniciar sesión</h2>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded border border-red-300 text-xl">
          {traducirError(decodeURIComponent(error))}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded border border-green-300 text-xl">
          {decodeURIComponent(success)}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <Label htmlFor="email" className="text-2xl mb-5 block">Email</Label>
          <Input
            name="email"
            placeholder="correo@ejemplo.com"
            required
            className="text-2xl py-8 px-4 mb-10"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-2xl mb-5 block">Contraseña</Label>
          <div className="relative">
            <Input
              type={verPassword ? 'text' : 'password'}
              name="password"
              placeholder="Tu Contraseña"
              required
              className="text-2xl py-8 px-4 pr-12 mb-10"
            />
            <button
              type="button"
              onClick={() => setVerPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label="Mostrar u ocultar contraseña"
            >
              {verPassword ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>
        </div>

        <SubmitButton
          pendingText="Iniciando..."
          formAction={signInAction}
          className="text-2xl py-8"
        >
          Iniciar Sesión
        </SubmitButton>
      </div>
    </form>
  );
}
