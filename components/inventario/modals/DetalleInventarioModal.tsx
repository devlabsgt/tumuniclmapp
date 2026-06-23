'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editarInventarioSchema, EditarInventarioFormValues, ItemInventario } from '../lib/schemas';
import { useInventarioMutations } from '../lib/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUploader, { ImageUploaderHandle } from '@/components/imgs/ImageUploader';
import { Loader2, Edit2, Trash2, AlertTriangle, MonitorSmartphone, User, Building2, History, Info, Package, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { createClient } from '@/utils/supabase/client';
import HistorialTimeline from '../HistorialTimeline';
import { createPortal } from 'react-dom';

interface DetalleInventarioModalProps {
  item: ItemInventario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatearQ = (monto: number) =>
  new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(monto);

export default function DetalleInventarioModal({ item, open, onOpenChange }: DetalleInventarioModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detalles' | 'historial'>('detalles');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { editar, eliminar } = useInventarioMutations();
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<EditarInventarioFormValues>({
    resolver: zodResolver(editarInventarioSchema) as any,
    defaultValues: {
      serie: '',
      descripcion: '',
      ctd: 1,
      valor: 0,
      estado: 'Activo',
      imagen_url: null,
    }
  });

  useEffect(() => {
    if (open && item) {
      reset({
        serie: item.serie,
        descripcion: item.descripcion,
        ctd: item.ctd,
        valor: item.valor,
        estado: item.estado,
        imagen_url: item.imagen_url,
      });
      setIsEditing(false);
      setConfirmDelete(false);
      setIsDeleting(false);
      setActiveTab('detalles');

      if (item.imagen_url) {
        supabase.storage
          .from('inventario-imgs')
          .createSignedUrl(item.imagen_url, 3600)
          .then(({ data }) => {
            if (data?.signedUrl) setImageUrl(data.signedUrl);
          });
      } else {
        setImageUrl(null);
      }
    } else {
      reset();
      setImageUrl(null);
      setIsFullscreen(false);
    }
  }, [open, item, reset]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmitEdit: SubmitHandler<EditarInventarioFormValues> = async (data) => {
    if (!item) return;
    try {
      editar.mutate({ idBien: item.id, datos: data }, {
        onSuccess: () => {
          toast.success('Bien actualizado correctamente');
          setIsEditing(false);
          // Update local preview image
          if (data.imagen_url) {
            supabase.storage
              .from('inventario-imgs')
              .createSignedUrl(data.imagen_url, 3600)
              .then(({ data: res }) => {
                if (res?.signedUrl) setImageUrl(res.signedUrl);
              });
          }
        },
        onError: (error: any) => {
          toast.error(`Error al editar: ${error.message || 'Desconocido'}`);
        }
      });
    } catch (error) {
      toast.error('Error inesperado');
    }
  };



  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        aria-describedby={undefined}
        className="sm:max-w-[950px] lg:max-w-[1000px] p-0 overflow-hidden bg-white dark:bg-neutral-900 border-0 sm:border border-gray-100 dark:border-neutral-800 flex flex-col max-h-[96vh] [&>button]:bg-blue-600 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:opacity-100 [&>button]:hover:bg-blue-700 [&>button]:rounded-md [&>button]:shadow [&>button]:active:scale-95 [&>button]:transition-all [&>button]:top-[14px] [&>button]:sm:top-[16px] [&>button]:p-1.5"
        onInteractOutside={(e) => {
          if (isFullscreen) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isFullscreen) {
            e.preventDefault();
            setIsFullscreen(false);
          }
        }}
      >
        {/* Header Institucional */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-1.5 sm:py-2 border-b-2 border-blue-600 shrink-0 pr-24">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo-muni.png"
              alt="Logo"
              className="h-14 sm:h-20 object-contain"
            />
            <div>
              <p className="text-[12px] sm:text-[14px] font-black text-neutral-600 dark:text-neutral-400 tracking-widest uppercase leading-tight">
                Municipalidad de Concepción Las Minas
              </p>
              <p className="text-[10px] sm:text-[12px] font-bold text-neutral-500/80 tracking-wide mt-0.5">Chiquimula, Guatemala</p>
            </div>
          </div>
        </div>

        {/* Botón de Editar / Guardar en el encabezado */}
        {(!item || !['Inactivo', 'Baja'].includes(item.estado)) && (
          <div className="absolute top-[14px] sm:top-[16px] right-12 z-50">
            {isEditing ? (
              <button
                type="submit"
                disabled={editar.isPending || isUploadingImage}
                onClick={() => handleSubmit(onSubmitEdit)()}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-md transition-all shadow hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {(editar.isPending || isUploadingImage) ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Guardando...</> : 'Guardar'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md transition-all shadow hover:bg-blue-700 active:scale-95 flex items-center"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </button>
            )}
          </div>
        )}

        {/* Título de Formulario */}
        <div className="px-6 pb-0 sm:px-8 sm:pb-0 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 shrink-0">
          <DialogTitle className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-tight m-0">
            Detalles del Bien
          </DialogTitle>
          <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">
            Información completa del artículo seleccionado
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 custom-scrollbar pb-6">

          {/* Custom Tabs */}
          <div className="flex items-center justify-center gap-2 border-b border-slate-200 dark:border-neutral-800 pb-px mt-0 sm:mt-1">
            <button
              type="button"
              onClick={() => setActiveTab('detalles')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${activeTab === 'detalles'
                  ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-neutral-700'
                }`}
            >
              <Info className="w-4 h-4" />
              Información General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${activeTab === 'historial'
                  ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-neutral-700'
                }`}
            >
              <History className="w-4 h-4" />
              Movimientos
            </button>
          </div>

          {activeTab === 'historial' ? (
            <div className="py-2">
              <HistorialTimeline idBien={item.id} />
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serie">Número de Serie o Placa</Label>
                  <Input id="serie" {...register('serie')} placeholder="Ej. LPT-2023-01" />
                  {errors.serie && <p className="text-sm text-red-500">{errors.serie.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado Físico</Label>
                  <select
                    id="estado"
                    {...register('estado')}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                  {errors.estado && <p className="text-sm text-red-500">{errors.estado.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descripcion">Descripción del Bien</Label>
                  <Textarea
                    id="descripcion"
                    {...register('descripcion')}
                    placeholder="Ej. Laptop HP Ryzen 7 5000 series, 16GB RAM, 512GB SSD..."
                    rows={3}
                  />
                  {errors.descripcion && <p className="text-sm text-red-500">{errors.descripcion.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ctd">Cantidad</Label>
                  <Input
                    id="ctd"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('ctd', {
                      onBlur: (e) => {
                        if (!e.target.value || Number(e.target.value) < 1) setValue('ctd', 1);
                      }
                    })}
                  />
                  {errors.ctd && <p className="text-sm text-red-500">{errors.ctd.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Costo / Valor (Q)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('valor', {
                      onBlur: (e) => {
                        if (!e.target.value || Number(e.target.value) < 0) setValue('valor', 0);
                      }
                    })}
                  />
                  {errors.valor && <p className="text-sm text-red-500">{errors.valor.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Actualizar Fotografía (Opcional)</Label>
                  <ImageUploader
                    ref={uploaderRef}
                    bucketName="inventario-imgs"
                    currentImagePath={watch('imagen_url') || null}
                    onUploadSuccess={(path) => setValue('imagen_url', path)}
                    onDeleteSuccess={() => setValue('imagen_url', null)}
                    onEstadoChange={({ uploading }) => setIsUploadingImage(uploading)}
                    permitirTodos={true}
                    aspect={3 / 4}
                    aspectLabel="Vertical 3:4"
                    previewClassName="max-h-[250px]"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              {/* Vista de lectura */}
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-1/3 shrink-0 flex flex-col gap-2">
                <div 
                  className={`w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800/80 dark:to-neutral-900/80 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-neutral-700/50 shadow-inner relative group ${imageUrl ? 'cursor-pointer' : ''}`}
                  onClick={() => { if (imageUrl) setIsFullscreen(true); }}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt={item.descripcion} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-90" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                        <span className="bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">Ver Imagen</span>
                      </div>
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-2xl pointer-events-none"></div>
                    </>
                  ) : (
                      <MonitorSmartphone className="text-slate-400/50 dark:text-neutral-600 w-20 h-20 drop-shadow-sm" />
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300 border border-slate-200 dark:border-neutral-700 shadow-sm">
                        {item.serie}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm border ${item.estado === 'Inactivo'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                          item.estado === 'Baja'
                            ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        }`}>
                        {item.estado}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      {item.descripcion}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Cantidad</p>
                      <p className="text-base font-black text-slate-800 dark:text-slate-200">{item.ctd}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-3 sm:p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm flex flex-col justify-center">
                      <p className="text-[11px] font-bold text-blue-500/70 dark:text-blue-400/70 uppercase tracking-widest mb-1">Costo Unitario</p>
                      <p className="text-base font-black text-blue-700 dark:text-blue-400">{formatearQ(item.valor)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-neutral-800/80 mt-4">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      Asignación Actual
                    </h4>
                    {item.info_usuario || item.dependencias ? (
                      <div className="space-y-2.5">
                        {item.info_usuario && (
                          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-neutral-900/40 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mb-0.5">Asignado a empleado</p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.info_usuario.nombre}</p>
                            </div>
                          </div>
                        )}
                        {item.dependencias && (
                          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-neutral-900/40 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mb-0.5">Dependencia u Órgano</p>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.dependencias.nombre}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-900/40 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 italic">Bien sin asignar (En bodega)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cintillo de Colores Institucional al ras del borde inferior */}
        <div className="flex h-1.5 sm:h-2 w-full shrink-0">
          <div className="flex-1 bg-blue-900" />
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-blue-400" />
          <div className="flex-1 bg-blue-200" />
        </div>
      </DialogContent>

      {/* Visor de Imagen Fullscreen */}
      {isFullscreen && imageUrl && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(false);
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20"
            title="Cerrar (Esc)"
          >
            <X size={24} />
          </button>
          <img 
            src={imageUrl} 
            alt={item.descripcion}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </Dialog>
  );
}
