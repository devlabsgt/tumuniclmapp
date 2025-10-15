'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, Pencil, Contact } from 'lucide-react';
import { Usuario } from '@/lib/usuarios/esquemas';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface EmpleadoItemProps {
  empleado: Usuario;
  level: number;
  onDelete: (userId: string) => void;
  onOpenInfoPersonal: (usuario: Usuario) => void;
  onOpenContrato: (usuario: Usuario) => void;
  onViewCard: (usuario: Usuario) => void;
}

export const EmpleadoItem = ({ empleado, level, onDelete, onOpenInfoPersonal, onOpenContrato, onViewCard }: EmpleadoItemProps) => {
  return (
    <motion.div layout className="w-full relative text-xs">
      <div
        className="flex items-center justify-between p-2 rounded-md"
        style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}
      >
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-400">
                <User className="h-4 w-4" />
                <span className="text-xs underline">{empleado.nombre}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={10}
            >
              <DropdownMenuItem onClick={() => onViewCard(empleado)}>
                <Contact className="mr-2 h-4 w-4" />
                <span>Ver Tarjeta</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenInfoPersonal(empleado)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Info. Personal</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenContrato(empleado)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Contrato</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(empleado.id)}>
                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500">Desasignar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};