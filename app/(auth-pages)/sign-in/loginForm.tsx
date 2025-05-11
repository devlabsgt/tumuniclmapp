'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

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
    <form className="flex-1 flex flex-col min-w-64 max-w-md mx-auto p-8 gap-6">


      {/* Volver y Título alineados */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="link"
          onClick={() => router.back()}
          className="text-blue-600 text-base px-0 underline"
        >
          Volver
        </Button>
        <h1 className="text-2xl font-medium text-right flex-1">Iniciar Sesión</h1>
      </div>

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

      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-2">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="correo@ejemplo.com" required />

        <div className="flex justify-between items-center">
          <Label htmlFor="password">Contraseña&nbsp;</Label>
        </div>

        <div className="relative">
          <Input
            type={verPassword ? 'text' : 'password'}
            name="password"
            placeholder="Tu Contraseña"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVerPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Mostrar u ocultar contraseña"
          >
            {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <SubmitButton pendingText="Iniciando..." formAction={signInAction}>
          Iniciar Sesión
        </SubmitButton>
      </div>
    </form>
  );
}
