'use client';

import React from 'react';
import { User, Pencil, Trash2 } from 'lucide-react';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface EmpleadoItemProps {
  empleado: Usuario;
  level: number;
  onDelete: (userId: string) => void;
}

export const EmpleadoItem = ({ empleado, level, onDelete }: EmpleadoItemProps) => {
  return (
    <div
      className="flex items-center justify-between p-2 rounded-md transition-colors text-xs"
      style={{ paddingLeft: `${level * 1.5}rem` }}
    >
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex-shrink-0 h-7 w-7 p-0 flex items-center justify-center bg-gray-100 text-gray-600 rounded-md shadow-sm"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent 
                side="top" 
                align="start" 
                sideOffset={10}
            >            
            <DropdownMenuItem onClick={() => onDelete(empleado.id)}>
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Desasignar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="font-medium text-gray-700 dark:text-gray-300">{empleado.nombre}</span>
      </div>
    </div>
  );
};