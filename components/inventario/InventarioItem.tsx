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
      className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl p-3.5 sm:p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group flex flex-col sm:flex-row gap-3 sm:gap-4 relative sm:items-center"
      onClick={onClick}
    >
      
      {/* Bloque Superior en Móvil / Bloque Izquierdo y Central en PC */}
      <div className="flex gap-3 sm:gap-4 items-start sm:items-center sm:flex-1 min-w-0">
        
        {/* Imagen */}
        <div 
          className={`w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 shrink-0 bg-slate-50 dark:bg-neutral-950 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-neutral-800 ${imageUrl ? 'cursor-pointer group-hover:opacity-80 transition-opacity' : ''}`}
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
            <MonitorSmartphone className="text-slate-300 dark:text-neutral-700 w-8 h-8" />
          )}
        </div>

        {/* Título y Asignación PC */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 sm:py-0 pr-6 sm:pr-0">
          
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:mb-1">
            <span className="px-1.5 py-0.5 rounded md:rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-400 uppercase">
              {item.serie || 'S/N'}
            </span>
            <span className={`px-1.5 py-0.5 rounded md:rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase ${
              item.estado === 'Inactivo' ? 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {item.estado}
            </span>
          </div>
          
          <h3 className="text-[15px] sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 sm:truncate">
            {item.descripcion}
          </h3>

          {/* Asignación (Solo Visible en Desktop, debajo del título) */}
          <div className="hidden sm:flex items-center gap-4 mt-2 text-[13px] text-slate-500 dark:text-slate-400">
            {tieneCustodio ? (
              <>
                {item.info_usuario && (
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="truncate">{item.info_usuario.nombre}</span>
                  </div>
                )}
                {item.dependencias && (
                  <div className="flex items-center gap-1.5">
                    <Building2 size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                    <span className="truncate">{item.dependencias.nombre}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="italic text-slate-400">Sin asignar</div>
            )}
          </div>

        </div>
      </div>

      {/* Botón de Acciones (Flotante en Móvil, Relativo en Desktop) */}
      <div className="absolute top-2.5 right-2.5 sm:relative sm:top-0 sm:right-0 sm:ml-auto sm:order-last shrink-0">
        {!['Inactivo', 'Baja'].includes(item.estado) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full" title="Acciones">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px] rounded-xl" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTrasladar?.(); }} className="cursor-pointer text-blue-600 dark:text-blue-400 font-medium">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                <span>{tieneCustodio ? 'Trasladar' : 'Asignar'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onBaja?.(); }} className="cursor-pointer text-red-600 dark:text-red-400 font-medium">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Dar de Baja</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Bloque Inferior en Móvil / Lado Derecho en PC (Totales) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0 pt-1 sm:pt-0">
        
        {/* Asignación (Solo Visible en Móvil, pegado a la izquierda) */}
        <div className="flex sm:hidden flex-col gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 w-full">
          {tieneCustodio ? (
            <>
              {item.info_usuario && (
                <div className="flex items-center gap-2">
                  <User size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{item.info_usuario.nombre}</span>
                </div>
              )}
              {item.dependencias && (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{item.dependencias.nombre}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-[13px] text-slate-400 dark:text-slate-500 italic">
              Sin asignar
            </div>
          )}
        </div>

        {/* Totales (Cant y Precio) */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 bg-slate-50 dark:bg-neutral-900/50 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none mt-1 sm:mt-0 w-full sm:w-auto">
          <div className="text-[13px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            Cant: <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">{item.ctd}</span>
          </div>
          <div className="text-sm sm:text-[17px] font-black text-slate-800 dark:text-white tracking-tight">
            {formatearQ(item.valor)}
          </div>
        </div>

      </div>

      {isImageOpen && (
        <InventarioImgModal
          item={item}
          onClose={() => setIsImageOpen(false)}
        />
      )}

    </div>
  );
}
