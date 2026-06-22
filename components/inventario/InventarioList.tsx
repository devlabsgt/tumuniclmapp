'use client';

import React from 'react';
import { ItemInventario } from './lib/schemas';
import InventarioItem from './InventarioItem';
import { PackageOpen } from 'lucide-react';

interface InventarioListProps {
  items: ItemInventario[];
  isLoading: boolean;
  onTrasladar?: (id: string, nombre: string) => void;
  onBaja?: (id: string, nombre: string) => void;
  onClickItem?: (item: ItemInventario) => void;
}

export default function InventarioList({ items, isLoading, onTrasladar, onBaja, onClickItem }: InventarioListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 w-full bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-slate-50 dark:bg-neutral-900/50">
        <PackageOpen className="w-16 h-16 text-slate-300 dark:text-neutral-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          No hay bienes registrados
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Aún no hay artículos en el inventario activo. Haz clic en "Nuevo Bien" para agregar el primero.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {items.map((item) => (
        <InventarioItem 
          key={item.id} 
          item={item} 
          onTrasladar={() => onTrasladar?.(item.id, item.descripcion)}
          onBaja={() => onBaja?.(item.id, item.descripcion)}
          onClick={() => onClickItem?.(item)}
        />
      ))}
    </div>
  );
}
