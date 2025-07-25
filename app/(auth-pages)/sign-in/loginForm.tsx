'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { signInAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Typewriter } from 'react-simple-typewriter';

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const [verPassword, setVerPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <form
      ref={formRef}
      action={signInAction}
      className="flex-1 flex flex-col max-w-xl mx-auto px-5 py-5 gap-8 text-2xl bg-white rounded-xl shadow-md mt-2"
    >
            {/* Imagen SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full px-4 flex flex-col gap-4"
      >
        {/* Línea superior: Volver e Iniciar Sesión */}
        <div className="flex justify-between w-full ">
          <BotonVolver ruta="/" />
          <h1 className="text-2xl font-bold text-black md:text-3xl">Iniciar Sesión</h1>
        </div>

        {/* Línea inferior: texto y svg */}
    <div className="flex items-center justify-between w-full gap-4 flex-wrap md:flex-nowrap">
      <div className="flex-1">
      <p className="text-[#06c] text-base md:text-lg font-medium">
          <Typewriter
            words={['Ingresa tus credenciales para iniciar sesión']}
            loop={1}
            cursor
            cursorStyle="|"
            typeSpeed={40}
            deleteSpeed={0}
            delaySpeed={1000}
          />
        </p>
      </div>
      <div className="w-[120px] h-[120px]">
        <Image
          src="/svg/login.svg"
          alt="Iniciar sesión"
          width={120}
          height={120}
          className="w-full h-full object-contain"
        />
      </div>
    </div>

      </motion.div>





      {/* Mensajes */}
      {(error || success) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`p-4 rounded border text-xl ${
            error
              ? 'bg-red-100 text-red-800 border-red-300'
              : 'bg-green-100 text-green-800 border-green-300'
          }`}
        >
          {error && traducirError(decodeURIComponent(error))}
          {success && decodeURIComponent(success)}
        </motion.div>
      )}

      {/* Campos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="flex flex-col gap-6"
      >
        <div>
          <Label htmlFor="email" className="text-2xl mb-2 block">Email</Label>
          <Input
            name="email"
            placeholder="correo@ejemplo.com"
            required
            className="text-2xl py-8 px-4"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-2xl mb-2 block">Contraseña</Label>
          <div className="relative">
            <Input
              type={verPassword ? 'text' : 'password'}
              name="password"
              placeholder="Tu Contraseña"
              required
              className="text-2xl py-8 px-4 pr-12"
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
      </motion.div>

      {/* Botón de envío */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <SubmitButton
          pendingText="Iniciando..."
          formAction={signInAction}
          className="text-2xl py-8 w-full"
        >
          Iniciar Sesión
        </SubmitButton>
      </motion.div>
    </form>
  );
}
