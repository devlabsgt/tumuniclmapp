'use client';

import React from 'react';
import { Box, User, Building2, MonitorSmartphone } from 'lucide-react';
import { ItemInventario } from './lib/schemas';
import { createClient } from '@/utils/supabase/client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowRightLeft, Trash2 } from 'lucide-react';
import InventarioImgModal from './modals/InventarioImgModal';

interface InventarioItemProps {
  item: ItemInventario;
  onTrasladar?: () => void;
  onBaja?: () => void;
  onClick?: () => void;
}

const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);

export default function InventarioItem({ item, onTrasladar, onBaja, onClick }: InventarioItemProps) {
  const tieneCustodio = item.info_usuario || item.dependencias;
  const supabase = createClient();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = React.useState(false);

  React.useEffect(() => {
    if (item.imagen_url) {
      supabase.storage
        .from('inventario-imgs')
        .createSignedUrl(item.imagen_url, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setImageUrl(data.signedUrl);
        });
    }
  }, [item.imagen_url]);

  return (
    <div 
      className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      
      {/* Imagen o Icono */}
      <div 
        className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-slate-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center overflow-hidden ${imageUrl ? 'cursor-pointer group-hover:opacity-80 transition-opacity' : ''}`}
        onClick={(e) => { 
          if (imageUrl) {
            e.stopPropagation();
            setIsImageOpen(true); 
          }
        }}
        title={imageUrl ? "Ver imagen en grande" : undefined}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={item.descripcion} 
            className="w-full h-full object-cover"
          />
        ) : (
          <MonitorSmartphone className="text-slate-400 w-8 h-8" />
        )}
      </div>

      {isImageOpen && (
        <InventarioImgModal
          item={item}
          onClose={() => setIsImageOpen(false)}
        />
      )}

      {/* Info Principal */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {item.serie}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            item.estado === 'Inactivo' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}>
            {item.estado}
          </span>
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
          {item.descripcion}
        </h3>
        
        {/* Asignación */}
        {tieneCustodio ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 mt-2">
            {item.info_usuario && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="shrink-0" />
                <span className="truncate max-w-[150px] md:max-w-none">{item.info_usuario.nombre}</span>
              </div>
            )}
            {item.dependencias && (
              <div className="flex items-center gap-1.5">
                <Building2 size={14} className="shrink-0" />
                <span className="truncate max-w-[150px] md:max-w-none">{item.dependencias.nombre}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-400 dark:text-slate-500 mt-2 italic">
            Sin asignar
          </div>
        )}
      </div>

      {/* Totales */}
      <div className="flex flex-col items-start sm:items-end gap-1 sm:w-32 shrink-0">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Cant: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.ctd}</span>
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          {formatearQ(item.valor)}
        </div>
      </div>

      {/* Menú de Acciones */}
      <div className="flex items-center shrink-0 ml-auto sm:ml-4">
        {!['Inactivo', 'Baja'].includes(item.estado) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" title="Acciones">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTrasladar?.(); }} className="cursor-pointer text-blue-600 dark:text-blue-400">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                <span>{tieneCustodio ? 'Trasladar' : 'Asignar'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onBaja?.(); }} className="cursor-pointer text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Dar de Baja</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

    </div>
  );
}
