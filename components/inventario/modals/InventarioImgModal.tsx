'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/imgs/ImageUploader';
import { actualizarImagenInventarioAction } from '../lib/actions';
import { toast } from 'react-toastify';
import { createClient } from '@/utils/supabase/client';

export interface InventarioItemBase {
  id: string;
  descripcion?: string; 
  nombre?: string; 
  serie?: string | null;
  imagen_url?: string | null;
}

interface InventarioImgModalProps {
  item: InventarioItemBase;
  onClose: () => void;
  onSaved?: () => void;
}

export default function InventarioImgModal({
  item,
  onClose,
  onSaved,
}: InventarioImgModalProps) {
  const [imgPath, setImgPath] = useState<string | null>(item.imagen_url ?? null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [loadingFullscreen, setLoadingFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    setImgPath(item.imagen_url ?? null);
  }, [item.imagen_url]);

  const mutation = useMutation({
    mutationFn: ({ path }: { path: string | null }) =>
      actualizarImagenInventarioAction(item.id, path),
    onSuccess: ({ path }) => {
      setImgPath(path);
      // Actualizar ambas posibles llaves
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-jerarquico'] });
      onSaved?.();
      toast.success('Imagen actualizada correctamente.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al actualizar imagen.');
    },
  });

  const handleVerImagen = async () => {
    if (!imgPath) return;
    setLoadingFullscreen(true);
    const { data, error } = await supabase.storage
      .from('inventario-imgs')
      .createSignedUrl(imgPath, 3600);

    if (error || !data?.signedUrl) {
      toast.error('No se pudo cargar la imagen.');
      setLoadingFullscreen(false);
      return;
    }
    setImageLoaded(false);
    setFullscreenUrl(data.signedUrl);
    setLoadingFullscreen(false);
  };

  const tieneImagen = !!imgPath;
  const tituloSecundario = item.serie ? `Serie: ${item.serie}` : 'Sin serie';
  const descripcion = item.descripcion || item.nombre || 'Bien municipal';

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
                Imagen del Bien
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">
                {tituloSecundario} — {descripcion}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="px-5 py-4 overflow-y-auto flex-1 relative">
            {mutation.isPending && (
              <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/40 flex items-center justify-center rounded-2xl">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            )}

            <ImageUploader
              bucketName="inventario-imgs"
              currentImagePath={imgPath}
              onUploadSuccess={async (path) => { await mutation.mutateAsync({ path }); }}
              onDeleteSuccess={async () => { await mutation.mutateAsync({ path: null }); }}
              disabled={mutation.isPending}
              aspect={3/4}
              aspectLabel="Vertical 3:4"
              permitirTodos={true}
            />
          </div>

          <div className="px-5 py-3 border-t border-gray-200 dark:border-neutral-700 flex gap-2 justify-end">
            <button
              onClick={handleVerImagen}
              disabled={!tieneImagen || loadingFullscreen}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingFullscreen && <Loader2 size={14} className="animate-spin" />}
              Ver imagen
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/92 p-6"
          onClick={() => {
            setFullscreenUrl(null);
            setImageLoaded(false);
          }}
        >
          {!imageLoaded && (
            <div className="w-72 h-96 rounded-2xl bg-neutral-800 animate-pulse" />
          )}

          <div className={`flex flex-col items-center gap-3 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenUrl(null);
                setImageLoaded(false);
              }}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
            >
              <X size={22} className="text-white" />
            </button>

            <img
              src={fullscreenUrl}
              alt="Imagen del Bien"
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onLoad={() => setImageLoaded(true)}
            />

            <div
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-5 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white/80 text-sm font-medium">
                {tituloSecundario}
              </span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-sm truncate max-w-[220px]">
                {descripcion}
              </span>
            </div>
          </div>

          {!imageLoaded && (
            <img
              src={fullscreenUrl}
              alt=""
              className="absolute opacity-0 pointer-events-none w-0 h-0"
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>
      )}
    </>
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
