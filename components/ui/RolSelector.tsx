'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type Props = {
  roles: string[];
  onChange: (valores: string[]) => void;
};

const opciones = ['Admin', 'Usuario', 'Maestro', 'Inventario'];

export default function RolSelector({ roles, onChange }: Props) {
  const toggleRol = (rol: string) => {
    if (roles.includes(rol)) {
      onChange(roles.filter((r) => r !== rol));
    } else {
      onChange([...roles, rol]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          {roles.length > 0 ? `Filtrando (${roles.length}) rol(es)` : 'Seleccionar rol'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2">
        {opciones.map((rol) => (
          <DropdownMenuCheckboxItem
            key={rol}
            checked={roles.includes(rol)}
            onCheckedChange={() => toggleRol(rol)}
            className="capitalize"
          >
            {rol}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
