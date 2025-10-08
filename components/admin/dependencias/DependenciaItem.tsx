'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Pencil, Trash2, GitBranchPlus, ArrowUp, ArrowDown, UserPlus } from 'lucide-react';
import { EmpleadoItem } from './EmpleadoItem';
import { Usuario } from '@/lib/usuarios/esquemas';

export interface EmpleadoNode {
  isEmployee: true;
  usuario: Usuario;
}

export interface DependenciaNode {
  id: string;
  no: number;
  nombre: string;
  descripcion: string | null;
  parent_id: string | null;
  horario_id: string | null;
  children: (DependenciaNode | EmpleadoNode)[];
}

interface DependenciaItemProps {
  node: DependenciaNode;
  onEdit: (d: DependenciaNode) => void;
  onDelete: (id: string) => void;
  onAddSub: (parent: DependenciaNode) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onAddEmpleado: (parent: DependenciaNode) => void;
  onEditEmpleado: (empleado: Usuario, parentId: string) => void;
  onDeleteEmpleado: (userId: string) => void;
  level: number;
  index: number;
  prefix: string;
  isLast: boolean;
  openNodeIds: string[];
  setOpenNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  siblingCount: number;
}

const DependenciaItem = ({ 
  node, 
  onEdit, 
  onDelete, 
  onAddSub, 
  onMove, 
  onAddEmpleado,
  onEditEmpleado,
  onDeleteEmpleado,
  level, 
  index, 
  prefix, 
  isLast, 
  openNodeIds, 
  setOpenNodeIds, 
  siblingCount 
}: DependenciaItemProps) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = openNodeIds.includes(node.id);
  const empleadoAsignado = node.children?.find(child => 'isEmployee' in child) as EmpleadoNode | undefined;

  const handleToggle = () => {
    if (hasChildren) {
      setOpenNodeIds(prevIds => 
        prevIds.includes(node.id)
          ? prevIds.filter(id => id !== node.id)
          : [...prevIds, node.id]
      );
    }
  };

  const getColorClasses = (level: number) => {
    switch (level % 3) {
      case 0: return { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-500', icon: 'text-green-600' };
      case 1: return { bg: 'bg-blue-100', text: 'text-blue-800', accent: 'bg-blue-500', icon: 'text-blue-600' };
      case 2: return { bg: 'bg-purple-100', text: 'text-purple-800', accent: 'bg-purple-500', icon: 'text-purple-600' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', accent: 'bg-gray-500', icon: 'text-gray-600' };
    }
  };

  const { bg, text, accent, icon } = getColorClasses(level);
  const canMoveUp = index > 0;
  const canMoveDown = index < siblingCount - 1;

  return (
    <div className="w-full relative text-xs">
      {level > 0 && (
        <>
          <span className="absolute top-0 w-0.5 bg-slate-300 dark:bg-slate-600" style={{ left: `calc(${level - 1} * 1.5rem + 0.5rem + 0.875rem)`, height: isLast ? '1.375rem' : '100%' }} aria-hidden="true" />
          <span className="absolute h-0.5 bg-slate-300 dark:bg-slate-600" style={{ top: '1.375rem', left: `calc(${level - 1} * 1.5rem + 0.5rem + 0.875rem)`, width: '1.5rem' }} aria-hidden="true" />
        </>
      )}
      <div className={`flex items-center justify-between p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 ${hasChildren ? 'cursor-pointer' : ''}`} style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }} onClick={handleToggle}>
        <div className="flex-grow flex items-center min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
             <Button variant="ghost" className={`relative flex-shrink-0 h-7 w-7 ${bg} ${text} rounded-md font-bold text-[10px] shadow-sm z-10 p-0`} onClick={(e) => e.stopPropagation()}>
                {prefix}
                {hasChildren && (<motion.div className={`absolute bottom-0 -translate-x-1/2 w-4 h-1 ${accent} rounded-full`} animate={{ y: isOpen ? 4 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}></motion.div>)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
            side="top" 
            align="start" 
            sideOffset={10}
            >
              {(canMoveUp || canMoveDown) && (
                <DropdownMenuItem>
                  <div className="flex items-center justify-center gap-2 w-full">
                    {canMoveUp && (
                      <ArrowUp
                        className="h-4 w-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(node.id, 'up');
                        }}
                      />
                    )}
                    <span className="text-xs">Mover</span>
                    {canMoveDown && (
                      <ArrowDown
                        className="h-4 w-4 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(node.id, 'down');
                        }}
                      />
                    )}
                  </div>
                </DropdownMenuItem>
              )}
              {level < 2 ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddSub(node); }}>
                  <GitBranchPlus className={`mr-2 h-4 w-4 ${icon}`} />
                  <span>Añadir Subdependencia</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddEmpleado(node); }}>
                  <UserPlus className={`mr-2 h-4 w-4 ${icon}`} />
                  <span>Añadir Empleado</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(node); }}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Editar Dependencia</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}>
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                <span>Eliminar Dependencia</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="min-w-0 pl-2 pr-2">
            <span className="font-medium text-gray-800 dark:text-white truncate">{node.nombre}</span>
            {node.descripcion && (<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{node.descripcion}</p>)}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {node.children.map((child, childIndex) => {
              if ('isEmployee' in child) {
                return (
                  <EmpleadoItem
                    key={child.usuario.id}
                    empleado={child.usuario}
                    level={level + 1}
                    onDelete={() => onDeleteEmpleado(child.usuario.id)}
                  />
                );
              } else {
                return (
                  <DependenciaItem
                    key={child.id}
                    node={child}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddSub={onAddSub}
                    onMove={onMove}
                    onAddEmpleado={onAddEmpleado}
                    onEditEmpleado={onEditEmpleado}
                    onDeleteEmpleado={onDeleteEmpleado}
                    level={level + 1}
                    index={childIndex}
                    prefix={`${prefix}.${child.no}`}
                    isLast={childIndex === node.children.length - 1}
                    openNodeIds={openNodeIds}
                    setOpenNodeIds={setOpenNodeIds}
                    siblingCount={node.children.length}
                  />
                );
              }
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DependenciaItem;