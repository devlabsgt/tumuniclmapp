'use client';

import React from 'react';
import DependenciaItem, { DependenciaNode } from './DependenciaItem';
import { Usuario } from '@/lib/usuarios/esquemas';

interface DependenciaListProps {
  dependencias: DependenciaNode[];
  onEdit: (dependencia: DependenciaNode) => void;
  onDelete: (id: string) => void;
  onAddSub: (parent: DependenciaNode) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onAddEmpleado: (parent: DependenciaNode) => void;
  onEditEmpleado: (empleado: Usuario, parentId: string) => void;
  onDeleteEmpleado: (userId: string) => void;
  openNodeIds: string[];
  setOpenNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function DependenciaList({ 
  dependencias, 
  onEdit, 
  onDelete, 
  onAddSub, 
  onMove,
  onAddEmpleado,
  onEditEmpleado,
  onDeleteEmpleado,
  openNodeIds,
  setOpenNodeIds
}: DependenciaListProps) {
  return (
    <div className="space-y-1">
      {dependencias.map((node, index) => (
        <DependenciaItem
          key={node.id}
          node={node}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSub={onAddSub}
          onMove={onMove}
          onAddEmpleado={onAddEmpleado}
          onEditEmpleado={onEditEmpleado}
          onDeleteEmpleado={onDeleteEmpleado}
          level={0}
          index={index}
          prefix={`${node.no}`}
          isLast={index === dependencias.length - 1}
          openNodeIds={openNodeIds}
          setOpenNodeIds={setOpenNodeIds}
          siblingCount={dependencias.length}
        />
      ))}
    </div>
  );
}