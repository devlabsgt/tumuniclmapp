import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilaReporteInventario } from './lib/schemas';
import { getColorNivel, formatearQ } from './lib/formatoInventario';
import { MonitorSmartphone, Package, ArrowRightLeft, ArrowDownToLine } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import InventarioImgModal from './modals/InventarioImgModal';

const GRID_TABLA = 'grid grid-cols-[5rem_1fr_6rem_8.5rem] items-stretch';
const BORDE_TABLA = 'border-slate-300 dark:border-neutral-500';
const FILA_TABLA = `border-b ${BORDE_TABLA}`;
const CELDA_NO = `px-3 py-2.5 border-r ${BORDE_TABLA} min-h-full`;
const CELDA_NOMBRE = `px-3 py-2.5 border-r ${BORDE_TABLA} min-w-0 min-h-full`;
const CELDA_CANTIDAD = `px-3 py-2.5 border-r ${BORDE_TABLA} text-center min-h-full`;
const CELDA_TOTAL = `px-3 py-2.5 text-right min-h-full`;

export interface NodoFila extends FilaReporteInventario {
  children: NodoFila[];
  tieneHijos: boolean;
}

interface NodoItemProps {
  nodo: NodoFila;
  expandidos: Set<string>;
  toggleExpand: (nodo: NodoFila) => void;
  onTrasladar?: (nodo: NodoFila) => void;
  onBaja?: (nodo: NodoFila) => void;
  onClickItem?: (nodo: NodoFila) => void;
}

export function NodoInventarioItem({ nodo, expandidos, toggleExpand, onTrasladar, onBaja, onClickItem }: NodoItemProps) {
  const colores = getColorNivel(nodo as any);
  const expandido = expandidos.has(nodo.id);
  const esExpandible = nodo.tieneHijos;
  const esBien = nodo.tipo === 'bien';
  const mostrarNumero = nodo.tipo === 'dependencia' && nodo.prefix && !nodo.esPuesto;

  const handleClick = () => {
    if (esBien) {
      onClickItem?.(nodo);
    } else if (esExpandible) {
      toggleExpand(nodo);
    }
  };

  const supabase = createClient();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = React.useState(false);

  React.useEffect(() => {
    if (nodo.imagen_url) {
      supabase.storage
        .from('inventario-imgs')
        .createSignedUrl(nodo.imagen_url, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setImageUrl(data.signedUrl);
        });
    }
  }, [nodo.imagen_url]);

  return (
    <div>
      <div
        onClick={handleClick}
        className={`${GRID_TABLA} ${FILA_TABLA} ${colores.row} relative group ${
          esExpandible || esBien ? 'cursor-pointer hover:brightness-[0.98] dark:hover:brightness-110' : ''
        }`}
      >
        {/* Celda No / Miniatura */}
        <div className={`${CELDA_NO} flex items-center justify-center`}>
          {mostrarNumero && (
            <span
              className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md font-mono font-bold text-[11px] ${colores.badge} ${colores.underline}`}
            >
              {nodo.prefix}
            </span>
          )}
          {esBien && (
            <>
              <div 
                className={`w-10 h-10 rounded bg-slate-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden ${imageUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={(e) => {
                  if (imageUrl) {
                    e.stopPropagation();
                    setIsImageOpen(true);
                  }
                }}
                title={imageUrl ? "Ver imagen en grande" : undefined}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="img" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>

              {isImageOpen && (
                <InventarioImgModal
                  item={{
                    ...nodo,
                    descripcion: nodo.nombre,
                  }}
                  onClose={() => setIsImageOpen(false)}
                />
              )}
            </>
          )}
        </div>

        {/* Celda Nombre / Descripcion */}
        <div className={`${CELDA_NOMBRE} overflow-hidden text-left flex items-center`}>
          {esBien ? (
            <div className={`text-sm leading-snug break-words space-y-0.5 ${colores.text}`}>
              <div className="font-bold">{nodo.nombre}</div>
              <div className="flex gap-2 text-[11px] opacity-80">
                <span className="font-mono bg-black/5 px-1 rounded">{nodo.serie || 'Sin serie'}</span>
                <span>•</span>
                <span className={nodo.estado === 'Activo' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{nodo.estado}</span>
              </div>
            </div>
          ) : nodo.tipo === 'empleado' ? (
            <div className="min-w-0 text-left leading-snug">
              {nodo.nombrePuesto && (
                <div className={`font-bold truncate ${colores.text}`}>{nodo.nombrePuesto}</div>
              )}
              <div className={`font-bold truncate underline decoration-2 underline-offset-[3px] decoration-current ${colores.text}`}>
                {nodo.nombre}
              </div>
            </div>
          ) : (
            <span className={`font-bold truncate ${colores.text}`}>{nodo.nombre}</span>
          )}

          {/* Botones de acción flotantes para Bienes */}
          {esBien && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 mr-[14.5rem] opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-l from-white via-white dark:from-[#0a0a0a] dark:via-[#0a0a0a] to-transparent pl-8 pr-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onTrasladar?.(nodo); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/20 dark:hover:border-blue-500/40 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                TRASLADAR
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onBaja?.(nodo); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-md dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:border-red-500/40 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all shadow-sm active:scale-95"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                BAJA
              </button>
            </div>
          )}
        </div>

        {/* Celda Cantidad */}
        <div className={`${CELDA_CANTIDAD} flex items-center justify-center font-mono font-bold ${colores.text}`}>
          {nodo.cantidad}
        </div>

        {/* Celda Total (Q) */}
        <div className={`${CELDA_TOTAL} flex items-center justify-end font-mono font-extrabold whitespace-nowrap ${colores.price}`}>
          {formatearQ(nodo.valor)}
        </div>
      </div>

      {/* Hijos */}
      <AnimatePresence initial={false}>
        {expandido && nodo.children.length > 0 && (
          <motion.div
            key={`children-${nodo.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {nodo.children.map((hijo) => (
              <NodoInventarioItem
                key={hijo.id}
                nodo={hijo}
                expandidos={expandidos}
                toggleExpand={toggleExpand}
                onTrasladar={onTrasladar}
                onBaja={onBaja}
                onClickItem={onClickItem}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
