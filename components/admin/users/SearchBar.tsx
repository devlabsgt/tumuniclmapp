// components/admin/users/SearchBar.tsx
'use client';

import { Input } from '@/components/ui/input';

type Props = {
  valor: string;
  onBuscar: (valor: string) => void;
};

export default function SearchBar({ valor, onBuscar }: Props) {
  return (
    <div className="mb-4 flex justify-center">
      <Input
        type="text"
        placeholder="Buscar por correo..."
        value={valor}
        onChange={(e) => onBuscar(e.target.value)}
      />
    </div>
  );
}
