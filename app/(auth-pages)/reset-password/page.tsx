'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/submit-button';

export default function ResetPassword() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1️⃣ Intercambiar el código si viene por query param ?code=
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setErrorMsg('No se pudo validar el enlace de recuperación.');
        }
      });
    }

    // 2️⃣ Capturar errores desde el hash como #error=...
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        if (errorCode === 'otp_expired') {
          setErrorMsg('El enlace ya expiró. Solicite uno nuevo para restablecer su contraseña.');
        } else if (errorDescription) {
          setErrorMsg(decodeURIComponent(errorDescription));
        }
      }
    }
  }, [searchParams, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password || !confirmPassword) {
      setErrorMsg('Debe llenar ambos campos de contraseña.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Contraseña actualizada correctamente. Ahora puede iniciar sesión.');
      setTimeout(() => router.push('/sign-in'), 2500);
    }

    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-md mx-auto p-4 gap-2 [&>input]:mb-4"
    >
      <h1 className="text-2xl font-medium">Restablecer contraseña</h1>
      <p className="text-sm text-foreground/60 mb-4">
        Ingrese su nueva contraseña abajo.
      </p>

      {errorMsg && (
        <div className="bg-red-100 text-red-800 p-3 rounded border border-red-300">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-100 text-green-800 p-3 rounded border border-green-300">
          {successMsg}
        </div>
      )}

      <Label htmlFor="password">Nueva contraseña</Label>
      <Input
        type="password"
        name="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <SubmitButton pendingText="Guardando..." disabled={submitting}>
        Cambiar contraseña
      </SubmitButton>
    </form>
  );
}
