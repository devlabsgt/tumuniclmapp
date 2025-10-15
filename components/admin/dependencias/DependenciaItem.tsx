//DependeciaItem.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Pencil, Trash2, GitBranchPlus, ArrowUp, ArrowDown, UserPlus, ChevronsUp, ChevronsDown, Info } from 'lucide-react';
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
  es_puesto: boolean | null;
  children: (DependenciaNode | EmpleadoNode)[];
}

interface DependenciaItemProps {
  node: DependenciaNode;
  onEdit: (d: DependenciaNode) => void;
  onDelete: (id: string) => void;
  onAddSub: (parent: DependenciaNode) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onMoveExtreme: (id: string, direction: 'inicio' | 'final') => void;
  onAddEmpleado: (parent: DependenciaNode) => void;
  onDeleteEmpleado: (userId: string) => void;
  onOpenInfoPersonal: (usuario: Usuario) => void;
  onOpenContrato: (usuario: Usuario) => void;
  onViewCard: (usuario: Usuario) => void;
  onOpenDescription: (title: string, description: string) => void;
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
  onMoveExtreme,
  onAddEmpleado,
  onDeleteEmpleado,
  onOpenInfoPersonal,
  onOpenContrato,
  onViewCard,
  onOpenDescription,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    switch (level % 4) {
      case 0: return { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-500', icon: 'text-green-600', border: 'hover:border-t-green-500' };
      case 1: return { bg: 'bg-blue-100', text: 'text-blue-800', accent: 'bg-blue-500', icon: 'text-blue-600', border: 'hover:border-t-blue-500' };
      case 2: return { bg: 'bg-purple-100', text: 'text-purple-800', accent: 'bg-purple-500', icon: 'text-purple-600', border: 'hover:border-t-purple-500' };
      case 3: return { bg: 'bg-orange-100', text: 'text-orange-800', accent: 'bg-orange-500', icon: 'text-orange-600', border: 'hover:border-t-orange-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', accent: 'bg-gray-500', icon: 'text-gray-600', border: 'hover:border-t-gray-500' };
    }
  };

  const isPuesto = node.es_puesto;
  const { bg, text, accent, icon, border } = isPuesto
    ? { bg: 'bg-yellow-100', text: 'text-yellow-800', accent: 'bg-yellow-500', icon: 'text-yellow-600', border: 'hover:border-t-yellow-500' }
    : getColorClasses(level);

  const canMoveUp = index > 0;
  const canMoveDown = index < siblingCount - 1;

  const minWidthStyle = { minWidth: `${1.5 + level * 0.25}rem` };

  return (
    <motion.div layout className="w-full relative text-xs py-1">
      {level > 0 && (
        <>
          <span className="absolute top-0 w-0.5 bg-slate-300 dark:bg-slate-600" style={{ left: `calc(${level - 1} * 1.5rem + 0.5rem + 0.875rem)`, height: isLast ? '1.375rem' : '100%' }} aria-hidden="true" />
          <span className="absolute h-0.5 bg-slate-300 dark:bg-slate-600" style={{ top: '1.375rem', left: `calc(${level - 1} * 1.5rem + 0.5rem + 0.875rem)`, width: '1.5rem' }} aria-hidden="true" />
        </>
      )}
      <div
        className={`flex items-center justify-between p-2 rounded-md transition-colors`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        <div 
          className="flex-grow flex items-center min-w-0"
        >
          <div onClick={handleToggle} className={`${hasChildren ? 'cursor-pointer' : ''}`}>
            <DropdownMenu onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {/* Div que reemplaza al botón numérico */}
                  <div 
                    className={`
                      relative flex-shrink-0 h-7 px-2 ${bg} ${text} rounded-md font-bold text-[10px] shadow-sm z-10 p-0 cursor-pointer
                      flex items-center justify-center 
                      transition-colors
                      // **** APLICACIÓN DEL BORDE SOLO ARRIBA ****
                      border-t-2 border-x-0 border-b-0 border-transparent ${border}
                    `} 
                    onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                    style={minWidthStyle}
                  >
                    {prefix}
                    {hasChildren && (<motion.div className={`absolute bottom-0 -translate-x-1/2 w-4 h-1 ${accent} rounded-full`} animate={{ y: isOpen ? 4 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}></motion.div>)}
                  </div>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={10}
                className="cursor-pointer"
              >
                {!isPuesto && (<DropdownMenuItem onSelect={() => onAddSub(node)} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"><GitBranchPlus className={`mr-2 h-4 w-4 ${icon}`} /><span>Añadir Sub-dependencia</span></DropdownMenuItem>)}
                {isPuesto && !empleadoAsignado && (<DropdownMenuItem onSelect={() => onAddEmpleado(node)} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"><UserPlus className={`mr-2 h-4 w-4 ${icon}`} /><span>Asignar Empleado</span></DropdownMenuItem>)}
                <DropdownMenuItem onSelect={() => onEdit(node)} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"><Pencil className="mr-2 h-4 w-4" /><span>Editar</span></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(node.id)} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"><Trash2 className="mr-2 h-4 w-4 text-red-600" /><span>Eliminar</span></DropdownMenuItem>
                {(canMoveUp || canMoveDown) && (<DropdownMenuSub><DropdownMenuSubTrigger onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"><span>Mover</span></DropdownMenuSubTrigger><DropdownMenuSubContent>{canMoveUp && ( <DropdownMenuItem onSelect={() => onMove(node.id, 'up')} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"> <ArrowUp className="mr-2 h-4 w-4" /> <span>Mover Arriba</span> </DropdownMenuItem> )}{canMoveDown && ( <DropdownMenuItem onSelect={() => onMove(node.id, 'down')} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"> <ArrowDown className="mr-2 h-4 w-4" /> <span>Mover Abajo</span> </DropdownMenuItem> )}{canMoveUp && ( <DropdownMenuItem onSelect={() => onMoveExtreme(node.id, 'inicio')} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"> <ChevronsUp className="mr-2 h-4 w-4" /> <span>Mover al inicio</span> </DropdownMenuItem> )}{canMoveDown && ( <DropdownMenuItem onSelect={() => onMoveExtreme(node.id, 'final')} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="cursor-pointer"> <ChevronsDown className="mr-2 h-4 w-4" /> <span>Mover al final</span> </DropdownMenuItem> )}</DropdownMenuSubContent></DropdownMenuSub>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center min-w-0 pl-2">
            <span onClick={handleToggle} className={`font-medium text-gray-800 dark:text-white truncate ${hasChildren ? 'cursor-pointer' : ''}`}>{node.nombre}</span>
            {node.descripcion && (
              <div
                role="button" 
                tabIndex={0}
                className="flex-shrink-0 h-6 w-6 text-gray-400 hover:text-blue-600 ml-1 rounded-md transition-colors cursor-pointer flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700" 
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onOpenDescription(node.nombre, node.descripcion!);
                }}
              >
                <Info className={`h-10 w-10 ml-1 ${text}`} />
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {node.children.map((child, childIndex) => {
              if ('isEmployee' in child) {
                return ( <EmpleadoItem key={child.usuario.id} empleado={child.usuario} level={level + 1} onDelete={() => onDeleteEmpleado(child.usuario.id)} onOpenInfoPersonal={onOpenInfoPersonal} onOpenContrato={onOpenContrato} onViewCard={onViewCard} /> );
              } else {
                const subDependencias = node.children.filter(c => !('isEmployee' in c));
                return ( <DependenciaItem key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} onMove={onMove} onMoveExtreme={onMoveExtreme} onAddEmpleado={onAddEmpleado} onDeleteEmpleado={onDeleteEmpleado} onOpenInfoPersonal={onOpenInfoPersonal} onOpenContrato={onOpenContrato} onViewCard={onViewCard} onOpenDescription={onOpenDescription} level={level + 1} index={childIndex} prefix={`${prefix}.${child.no}`} isLast={childIndex === subDependencias.length - 1} openNodeIds={openNodeIds} setOpenNodeIds={setOpenNodeIds} siblingCount={subDependencias.length} /> );
              }
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DependenciaItem;