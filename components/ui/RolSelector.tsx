// components/admin/sign-up/RolSelector.tsx
'use client';

import { Label } from '@/components/ui/label';

type Props = {
  rol: string;
  onChange: (val: string) => void;
};

export default function RolSelector({ rol, onChange }: Props) {
  return (
    <div>
      <Label htmlFor="rol" className="text-lg mb-1 block">
        Rol
      </Label>
      <select
        name="rol"
        required
        value={rol}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 text-lg border border-input rounded px-3 w-full"
      >
        <option value="">Seleccione un rol</option>
        <option value="Usuario">Usuario</option>
        <option value="Admin">Admin</option>
      </select>
    </div>
  );
}
