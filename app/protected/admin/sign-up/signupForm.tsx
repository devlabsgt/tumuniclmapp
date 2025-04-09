'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signUpAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@headlessui/react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import RolSelector from '@/components/ui/RolSelector';
import PasswordSection from '@/components/admin/sign-up/PasswordSection';

export function SignupForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [rol, setRol] = useState('');

  const cumpleRequisitos = /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);
  const contraseñasCoinciden = password === confirmar;
  const camposCompletos = nombre && email && password && confirmar && rol;
  const formularioValido = camposCompletos && contraseñasCoinciden && cumpleRequisitos;

  function traducirError(mensaje: string) {
    const errores: Record<string, string> = {
      'email rate limit exceeded': 'Demasiados intentos. Espere unos minutos.',
      'user already registered': 'El usuario ya está registrado.',
      'invalid login credentials': 'Credenciales incorrectas.',
      'signup requires a valid password': 'Contraseña inválida.',
      'user not found': 'Usuario no encontrado.',
    };
    return errores[mensaje.toLowerCase()] || mensaje;
  }

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al crear usuario',
        text: traducirError(decodeURIComponent(error)),
        confirmButtonColor: '#d33',
      });
    }

    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Usuario creado',
        text: decodeURIComponent(success),
        confirmButtonColor: '#3085d6',
      });
    }
  }, [error, success]);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-6">
      <div className="flex justify-start">
        <Link href="/protected/admin/users" className="w-auto">
          <Button
            type="button"
            className="h-10 bg-blue-600 hover:bg-blue-500 text-white text-sm w-auto px-4 rounded"
          >
            Volver a usuarios
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-semibold mb-6">Nuevo Usuario</h1>

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

        <PasswordSection
          password={password}
          confirmar={confirmar}
          onPasswordChange={setPassword}
          onConfirmarChange={setConfirmar}
        />

        <RolSelector rol={rol} onChange={setRol} />

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
