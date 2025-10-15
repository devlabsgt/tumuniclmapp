//DependenciaList.tsx
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
  onMoveExtreme: (id: string, direction: 'inicio' | 'final') => void;
  onAddEmpleado: (parent: DependenciaNode) => void;
  onDeleteEmpleado: (userId: string) => void;
  onOpenInfoPersonal: (usuario: Usuario) => void;
  onOpenContrato: (usuario: Usuario) => void;
  onViewCard: (usuario: Usuario) => void;
  onOpenDescription: (title: string, description: string) => void;
  openNodeIds: string[];
  setOpenNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function DependenciaList({
  dependencias,
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
  openNodeIds,
  setOpenNodeIds
}: DependenciaListProps) {
  return (
    <div className="space-y-1">
      {dependencias.map((node, index) => {
        const showSubtitle = node.no === 1 || node.no === 7;
        const subtitleText = node.no === 1 ? 'ACTIVIDADES CENTRALES' : 'PROGRAMA O PROYECTO ACTIVIDAD';

        return (
          <React.Fragment key={node.id}>
            {showSubtitle && (
              <div className="px-2 pt-4 pb-1">
                <h2 className="text-md font-bold uppercase text-blue-600 dark:text-gray-500 tracking-wider">
                  {subtitleText}
                </h2>
              </div>
            )}
            <DependenciaItem
              node={node}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSub={onAddSub}
              onMove={onMove}
              onMoveExtreme={onMoveExtreme}
              onAddEmpleado={onAddEmpleado}
              onDeleteEmpleado={onDeleteEmpleado}
              onOpenInfoPersonal={onOpenInfoPersonal}
              onOpenContrato={onOpenContrato}
              onViewCard={onViewCard}
              onOpenDescription={onOpenDescription}
              level={0}
              index={index}
              prefix={`${node.no}`}
              isLast={index === dependencias.length - 1}
              openNodeIds={openNodeIds}
              setOpenNodeIds={setOpenNodeIds}
              siblingCount={dependencias.length}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}