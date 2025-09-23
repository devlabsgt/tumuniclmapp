'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  password: string;
  confirmar: string;
  onPasswordChange: (val: string) => void;
  onConfirmarChange: (val: string) => void;
};

export default function PasswordSection({
  password,
  confirmar,
  onPasswordChange,
  onConfirmarChange,
}: Props) {
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const contraseñasCoinciden = password === confirmar;

  const requisitos = {
    longitud: password.length >= 8,
    mayus: /[A-Z]/.test(password),
    minus: /[a-z]/.test(password),
    numero: /\d/.test(password),
    simbolo: /[^A-Za-z0-9]/.test(password),
  };

  return (
    <div className="flex gap-8 mt-4 items-center flex-grow">
      <div className="flex flex-col gap-4 w-3/5 md:w-2/3">
        {/* Contraseña */}
        <div>
          <Label htmlFor="password" className="text-sm mb-1 block">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              type={mostrarPass ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Ingresar contraseña"
              required
              className="h-12 text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrarPass(!mostrarPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <Label htmlFor="confirmar" className="text-sm mb-1 block">
            Confirmar contraseña
          </Label>
          <div className="relative">
            <Input
              type={mostrarConfirm ? 'text' : 'password'}
              name="confirmar"
              value={confirmar}
              onChange={(e) => onConfirmarChange(e.target.value)}
              placeholder="Confirmar contraseña"
              required
              className={`h-12 text-xs pr-10 ${confirmar && !contraseñasCoinciden ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setMostrarConfirm(!mostrarConfirm)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {mostrarConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmar && !contraseñasCoinciden && (
            <p className="text-red-600 text-sm mt-1">Las contraseñas no coinciden.</p>
          )}
        </div>
      </div>

      {/* Requisitos visuales */}
      <div className="w-2/5 md:w-1/3 text-end">
        <div className="text-sm text-gray-600 space-y-1 mt-1">
          <p className={requisitos.longitud ? 'text-green-600' : 'text-red-600'}>
            Al menos 8 caracteres
          </p>
          <p className={requisitos.mayus ? 'text-green-600' : 'text-red-600'}>
            Una letra mayúscula
          </p>
          <p className={requisitos.minus ? 'text-green-600' : 'text-red-600'}>
            Una letra minúscula
          </p>
          <p className={requisitos.numero ? 'text-green-600' : 'text-red-600'}>
            Un número
          </p>
          <p className={requisitos.simbolo ? 'text-green-600' : 'text-red-600'}>
            Un símbolo (ej. !@#$%)
          </p>
        </div>
      </div>
    </div>
  );
}