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
import Image from 'next/image';

const initialState = {
  type: null,
  message: '',
};

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [verPassword, setVerPassword] = useState(false);
  const [emailValue, setEmailValue] = useState(state?.email || '');
  const [passwordValue, setPasswordValue] = useState('');

  const handleEmailBlur = () => {
    if (emailValue && !emailValue.includes('@')) {
      setEmailValue(emailValue.trim() + '@tumuniclm.com');
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center bg-white dark:bg-neutral-950 px-4 pt-5 gap-6 min-h-screen transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-lg"
      >
          src="/images/logo-muni.png"

      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-xl dark:shadow-black/50 dark:border dark:border-neutral-800 overflow-hidden"
      >
        <div className="w-full bg-blue-600 dark:bg-blue-700 px-4 py-4 flex flex-row items-center justify-center gap-6 text-white order-1 transition-colors">
          <div className="flex-shrink-0">
            <AnimatedIcon
              iconKey="yaxbmvvh"
              className="w-[100px] h-[100px]"
              trigger="loop"
              // Nota: Los iconos animados suelen tener colores internos. 
              // Si AnimatedIcon soporta stroke/fill via props, podrías necesitar ajustarlo aquí.
            />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-bold text-white">Iniciar Sesión</h1>
            <h2 className="text-lg mt-2 text-blue-50">Bienvenido de Nuevo</h2>
            <p className="text-blue-200 dark:text-blue-100 mt-1 h-12 text-sm">
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

        <div className="w-full p-8 order-2 flex flex-col justify-center bg-white dark:bg-neutral-900 transition-colors">
          <form action={formAction} className="flex flex-col gap-5">
            {state?.type === 'error' && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border dark:border-red-800/50 text-center text-sm border border-red-200 min-h-[50px] flex items-center justify-center">
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
              <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Escriba aquí su usuario"
                required
                className="py-4 text-sm bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 focus:dark:border-blue-500 focus:dark:ring-blue-500/20"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                onBlur={handleEmailBlur}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-300">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={verPassword ? 'text' : 'password'}
                  placeholder="Escriba aquí su contraseña"
                  required
                  className="py-4 pr-10 text-sm bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 focus:dark:border-blue-500 focus:dark:ring-blue-500/20"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Mostrar/Ocultar contraseña"
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <SubmitButton
              pendingText="Verificando..."
              className="w-full py-4 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors"
            >
              Entrar
            </SubmitButton>
          </form>
        </div>
      </motion.div>
    </div>
  );
}