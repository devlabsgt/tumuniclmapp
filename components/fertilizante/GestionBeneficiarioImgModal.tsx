'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import ImageUploader from '@/components/imgs/ImageUploader';
import { actualizarImgBeneficiarioAction } from '@/components/fertilizante/actions/imagenBeneficiario';
import { toast } from 'react-toastify';
import { createClient } from '@/utils/supabase/client';

interface Beneficiario {
  id: string;
  nombre_completo: string | null;
  codigo: string;
  img_url?: string | null;
}

interface GestionBeneficiarioImgModalProps {
  beneficiario: Beneficiario;
  onClose: () => void;
  onSaved?: () => void;
}

export default function GestionBeneficiarioImgModal({
  beneficiario,
  onClose,
  onSaved,
}: GestionBeneficiarioImgModalProps) {
  const [imgPath, setImgPath] = useState<string | null>(beneficiario.img_url ?? null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [loadingFullscreen, setLoadingFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Sync state when beneficiario changes
  useEffect(() => {
    setImgPath(beneficiario.img_url ?? null);
  }, [beneficiario.img_url]);

  const mutation = useMutation({
    mutationFn: ({ path }: { path: string | null }) =>
      actualizarImgBeneficiarioAction(beneficiario.id, 'img_url', path),
    onSuccess: ({ path }) => {
      setImgPath(path);
      queryClient.invalidateQueries({ queryKey: ['beneficiarios-fertilizante'] });
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
      .from('Fertilizante2026')
      .createSignedUrl(imgPath, 600);

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

  return (
    <>
      {/* Modal overlay */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[95vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
                Imagen del beneficiario
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">
                Folio {beneficiario.codigo}
                {beneficiario.nombre_completo && ` — ${beneficiario.nombre_completo}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto flex-1">
            {mutation.isPending && (
              <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/40 flex items-center justify-center rounded-2xl">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            )}

            <ImageUploader
              bucketName="Fertilizante2026"
              currentImagePath={imgPath}
              onUploadSuccess={async (path) => { await mutation.mutateAsync({ path }); }}
              onDeleteSuccess={async () => { await mutation.mutateAsync({ path: null }); }}
              disabled={mutation.isPending}
              aspect={3 / 4}
              aspectLabel="Vertical 3:4"
            />
          </div>

          {/* Footer */}
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

      {/* Fullscreen image viewer */}
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/92 p-6"
          onClick={() => {
            setFullscreenUrl(null);
            setImageLoaded(false);
          }}
        >
          {/* SKELETON: solo esto se ve mientras carga, nada más */}
          {!imageLoaded && (
            <div className="w-72 h-96 rounded-2xl bg-neutral-800 animate-pulse" />
          )}

          {/* TODO aparece de golpe cuando la imagen cargó */}
          <div className={`flex flex-col items-center gap-3 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}`}>
            {/* Botón cerrar */}
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
              alt="Imagen del beneficiario"
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Barra de info */}
            <div
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-5 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white/80 text-sm font-medium">
                Folio {beneficiario.codigo}
              </span>
              {beneficiario.nombre_completo && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-white/60 text-sm truncate max-w-[220px]">
                    {beneficiario.nombre_completo}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Precargador invisible */}
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
}
