'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { signInAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Typewriter } from 'react-simple-typewriter';
import AnimatedIcon from '@/components/ui/AnimatedIcon';

const initialState = {
  type: null,
  message: '',
};

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [verPassword, setVerPassword] = useState(false);

  return (
    <div className="w-full flex justify-center items-start bg-white px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="w-full bg-blue-600 px-4 py-4 flex flex-row items-center justify-center gap-6 text-white order-1">
          <div className="flex-shrink-0">
            <AnimatedIcon
              iconKey="yaxbmvvh"
              className="w-[100px] h-[100px]"
                trigger="loop"

            />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-bold">Iniciar Sesión</h1>
            <h2 className="text-lg mt-2">Bienvenido de Nuevo</h2>
            <p className="text-blue-200 mt-1 h-12 text-sm">
              <Typewriter
                words={['Ingresa tus credenciales para acceder al sistema.']}
                loop={1}
                cursor
                cursorStyle="_"
                typeSpeed={40}
              />
            </p>
          </div>
        </div>

        <div className="w-full p-8 order-2 flex flex-col justify-center">
          <form action={formAction} className="flex flex-col gap-5">
            {state?.type === 'error' && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 text-center text-sm border border-red-200 min-h-[50px] flex items-center justify-center">
                <Typewriter
                  words={[state.message || '']}
                  loop={1}
                  cursor
                  cursorStyle='_'
                  typeSpeed={40}
                  key={state.message}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Correo Electrónico</Label>
              <Input
                id="email" name="email" type="email"
                placeholder="su.correo@ejemplo.com"
                required className="py-4 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password" name="password"
                  type={verPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required className="py-4 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Mostrar/Ocultar contraseña"
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <SubmitButton
              pendingText="Verificando..."
              className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700"
            >
              Entrar
            </SubmitButton>
          </form>
        </div>
      </motion.div>
    </div>
  );
}