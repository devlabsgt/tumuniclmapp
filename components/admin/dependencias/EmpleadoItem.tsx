//EmpleadoItem.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, Contact, FileSignature } from 'lucide-react';
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
    <div
      className="w-full relative text-xs py-1 z-10"
    >
      <div
        className="flex items-center"
        style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}
      >
        {/* MOVIMIENTO: motion.div y whileHover se mueven aquí, envolviendo solo el recuadro interactivo */}
        <motion.div
          className="relative inline-flex items-center gap-2"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div 
                className={`
                  flex items-center gap-2 cursor-pointer px-3 py-1 bg-slate-100 text-slate-600 rounded-sm dark:text-gray-400
                  transition-all duration-300 ease-in-out
                  border-b-2 border-transparent hover:border-b-slate-600 dark:hover:border-b-gray-400
                `}
              >
                <User className="h-4 w-4" />
                <span className="text-xs">{empleado.nombre}</span>
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
                <User className="mr-2 h-4 w-4" />
                <span>Info. Personal</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenContrato(empleado)}>
                <FileSignature className="mr-2 h-4 w-4" />
                <span>Contrato o<br/>nombramiento</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(empleado.id)}>
                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-red-500">Desasignar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </div>
  );
};