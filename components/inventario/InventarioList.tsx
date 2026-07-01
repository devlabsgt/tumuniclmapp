'use client';

import React from 'react';
import { ItemInventario } from './lib/schemas';
import InventarioItem from './InventarioItem';
import { PackageOpen } from 'lucide-react';
import { getColorNivel } from './lib/formatoInventario';

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

  const groupedItems = React.useMemo(() => {
    const result: { depName: string; level: number; prefix: string; nombre: string; items: ItemInventario[] }[] = [];
    let currentGroup: { depName: string; level: number; prefix: string; nombre: string; items: ItemInventario[] } | null = null;
    
    items.forEach(item => {
      const depName = item.__groupName || item.dependencias?.nombre || 'Sin Dependencia Asignada';
      if (!currentGroup || currentGroup.depName !== depName) {
        currentGroup = { 
          depName, 
          level: item.__groupLevel !== undefined ? item.__groupLevel : -1,
          prefix: item.__groupPrefix || '',
          nombre: item.__groupNombre || item.dependencias?.nombre || 'Sin Dependencia Asignada',
          items: [] 
        };
        result.push(currentGroup);
      }
      currentGroup.items.push(item);
    });
    
    return result;
  }, [items]);

  return (
    <div className="flex flex-col space-y-6">
      {groupedItems.map((group) => {
        // Obtenemos los colores para el nivel del grupo
        const esPuesto = false; // Grupos son dependencias
        const colores = group.level >= 0 
           ? getColorNivel({ tipo: 'dependencia', level: group.level, esPuesto })
           : { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-700 dark:text-slate-300', underline: 'border-b-2 border-slate-200 dark:border-neutral-800', row: '' };

        return (
          <div key={group.depName} className="flex flex-col space-y-4">
            <div className={`flex items-center gap-3 pb-1.5 ${colores.underline}`}>
              {group.prefix && (
                <span className={`inline-flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-md font-mono font-bold text-[11px] ${colores.badge}`}>
                  {group.prefix}
                </span>
              )}
              <h3 className={`text-sm font-black uppercase tracking-widest ${colores.text}`}>
                {group.nombre}
              </h3>
              <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${colores.badge}`}>
                {group.items.length} {group.items.length === 1 ? 'BIEN' : 'BIENES'}
              </span>
            </div>
            <div className="flex flex-col space-y-4">
            {group.items.map((item) => (
              <InventarioItem 
                key={item.id} 
                item={item} 
                onTrasladar={() => onTrasladar?.(item.id, item.descripcion)}
                onBaja={() => onBaja?.(item.id, item.descripcion)}
                onClick={() => onClickItem?.(item)}
              />
            ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
