'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, Contact } from 'lucide-react';
import { Usuario } from '@/lib/usuarios/esquemas';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface EmpleadoItemProps {
  empleado: Usuario;
  level: number;
  rol: string | null;
  onDelete: (userId: string) => void;
  onOpenInfoPersonal: (usuario: Usuario) => void;
  onViewCard: (usuario: Usuario) => void;
}

export const EmpleadoItem = ({ empleado, level, rol, onDelete, onOpenInfoPersonal, onViewCard }: EmpleadoItemProps) => {
  
  const hasFullPermission = rol === 'SUPER' || rol === 'RRHH';
  const hasMenuAccess = hasFullPermission || rol === 'SECRETARIO';

  // Clase base para el contenedor del nombre del empleado
  const badgeClasses = `
    flex items-center gap-2 cursor-pointer px-3 py-1 rounded-sm
    bg-slate-100 text-slate-600 
    dark:bg-slate-800 dark:text-slate-300
    transition-all duration-300 ease-in-out
    border-b-2 border-transparent 
    hover:border-b-slate-600 dark:hover:border-b-slate-400
  `;

  return (
    <div className="w-full relative text-xs py-1 z-10">
      <div
        className="flex items-center"
        style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}
      >
        <motion.div
          className="relative inline-flex items-center gap-2"
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {hasMenuAccess ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={badgeClasses}>
                  <User className="h-4 w-4" />
                  <span className="text-xs">{empleado.nombre}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={10}
                  className="dark:bg-slate-900 dark:border-slate-800"
              >
                <DropdownMenuItem 
                  onClick={() => onViewCard(empleado)}
                  className="dark:hover:bg-slate-800 dark:text-slate-200"
                >
                  <Contact className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span>Ver Tarjeta</span>
                </DropdownMenuItem>
                
                {hasFullPermission && (
                  <DropdownMenuItem 
                    onClick={() => onOpenInfoPersonal(empleado)}
                    className="dark:hover:bg-slate-800 dark:text-slate-200"
                  >
                    <User className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Info. Personal</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  onClick={() => onDelete(empleado.id)}
                  className="dark:hover:bg-red-900/30 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-red-500 dark:text-red-400">Desasignar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div 
              onClick={() => onViewCard(empleado)}
              className={badgeClasses}
            >
              <User className="h-4 w-4" />
              <span className="text-xs">{empleado.nombre}</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};