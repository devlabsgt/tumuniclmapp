'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  password: string;
  confirmar: string;
  onPasswordChange: (value: string) => void;
  onConfirmarChange: (value: string) => void;
};

export default function PasswordEditor({
  password,
  confirmar,
  onPasswordChange,
  onConfirmarChange,
}: Props) {
  const [mostrar, setMostrar] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const requisitos = {
    longitud: password.length >= 8,
    mayus: /[A-Z]/.test(password),
    minus: /[a-z]/.test(password),
    numero: /\d/.test(password),
    simbolo: /[^A-Za-z0-9]/.test(password),
  };

  const contraseñasCoinciden = password && confirmar && password === confirmar;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="text-lg mb-1 block">Nueva contraseña</Label>
        <div className="relative">
          <Input
            type={mostrar ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Nueva contraseña"
            className="pr-10 h-12 text-lg"
          />
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <Label className="text-lg mb-1 block">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            type={mostrarConfirm ? 'text' : 'password'}
            value={confirmar}
            onChange={(e) => onConfirmarChange(e.target.value)}
            placeholder="Confirmar contraseña"
            className="pr-10 h-12 text-lg"
          />
          <button
            type="button"
            onClick={() => setMostrarConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {mostrarConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {confirmar && !contraseñasCoinciden && (
          <p className="text-sm text-red-600 mt-1">Las contraseñas no coinciden.</p>
        )}
      </div>

      {/* Requisitos */}
      <ul className="text-sm text-gray-600 space-y-1 mt-1">
        <li className={requisitos.longitud ? 'text-green-600' : 'text-red-600'}>
          • Al menos 8 caracteres
        </li>
        <li className={requisitos.mayus ? 'text-green-600' : 'text-red-600'}>
          • Una letra mayúscula
        </li>
        <li className={requisitos.minus ? 'text-green-600' : 'text-red-600'}>
          • Una letra minúscula
        </li>
        <li className={requisitos.numero ? 'text-green-600' : 'text-red-600'}>
          • Un número
        </li>
        <li className={requisitos.simbolo ? 'text-green-600' : 'text-red-600'}>
          • Un símbolo (ej. !@#$%)
        </li>
      </ul>
    </div>
  );
}
