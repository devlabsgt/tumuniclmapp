// components/admin/sign-up/PasswordSection.tsx
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

  return (
    <div className="flex flex-col gap-4">
      {/* Contraseña */}
      <div>
        <Label htmlFor="password" className="text-lg mb-1 block">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            type={mostrarPass ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
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

      {/* Confirmar contraseña */}
      <div>
        <Label htmlFor="confirmar" className="text-lg mb-1 block">
          Confirmar contraseña
        </Label>
        <div className="relative">
          <Input
            type={mostrarConfirm ? 'text' : 'password'}
            name="confirmar"
            value={confirmar}
            onChange={(e) => onConfirmarChange(e.target.value)}
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
          <p className="text-red-600 text-sm mt-1">Las contraseñas no coinciden.</p>
        )}
      </div>

      {/* Requisitos visuales */}
      <ul className="text-sm text-gray-600 space-y-1 mt-1">
        <li className={password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
          • Al menos 8 caracteres
        </li>
        <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
          • Una letra mayúscula
        </li>
        <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
          • Una letra minúscula
        </li>
        <li className={/\d/.test(password) ? 'text-green-600' : 'text-red-600'}>
          • Un número
        </li>
        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}>
          • Un símbolo (ej. !@#$%)
        </li>
      </ul>
    </div>
  );
}
