'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { crearInventarioSchema, CrearInventarioFormValues } from '../lib/schemas';
import { useDependenciasBasicas, useUsuariosBasicos, useInventarioMutations } from '../lib/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUploader, { ImageUploaderHandle } from '@/components/imgs/ImageUploader';
import { Loader2, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface CrearInventarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CrearInventarioModal({ open, onOpenChange, onSuccess }: CrearInventarioModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: dependencias = [] } = useDependenciasBasicas();
  const { data: usuarios = [] } = useUsuariosBasicos();
  const { crearBien } = useInventarioMutations();

  const [searchUsuario, setSearchUsuario] = useState('');
  const [showUsuariosDrop, setShowUsuariosDrop] = useState(false);
  
  const [searchDependencia, setSearchDependencia] = useState('');
  const [showDependenciasDrop, setShowDependenciasDrop] = useState(false);
  
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, clearErrors } = useForm<CrearInventarioFormValues>({
    // @ts-ignore: zodResolver and z.coerce.number() type mismatch in older hookform versions
    resolver: zodResolver(crearInventarioSchema),
    defaultValues: {
      estado: 'Activo',
      ctd: 1,
      valor: 0,
      id_usuario_asignado: '',
      id_dependencia_asignada: '',
    }
  });

  const imagenUrl = watch('imagen_url');

  useEffect(() => {
    if (!open) {
      reset();
      setSearchUsuario('');
      setShowUsuariosDrop(false);
    }
  }, [open, reset]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const filteredUsuarios = usuarios.filter(u => u.nombre.toLowerCase().includes(searchUsuario.toLowerCase()));

  const onSubmit = async (data: CrearInventarioFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        id_usuario_asignado: data.id_usuario_asignado || null,
        id_dependencia_asignada: null,
      };
      
      crearBien.mutate(payload, {
        onSuccess: () => {
          toast.success('Bien registrado correctamente');
          onSuccess();
          handleClose();
        },
        onError: (error: any) => {
          toast.error(`Error al registrar el bien: ${error.message || 'Desconocido'}`);
        }
      });
    } catch (error: any) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white dark:bg-neutral-900 border-0 sm:border border-gray-100 dark:border-neutral-800">
        {/* Header Institucional */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-2 sm:py-3 border-b-2 border-blue-600">
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

        {/* Título de Formulario */}
        <div className="px-6 pt-4 pb-0 sm:px-8 sm:pt-5 sm:pb-0 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
            <DialogTitle className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight m-0">
                Registrar Nuevo Bien
            </DialogTitle>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 sm:px-8 custom-scrollbar pb-6">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 sm:gap-8">
            
            {/* Columna Izquierda: Fotografía y Asignación */}
            <div className="flex flex-col space-y-6">
              
              {/* Card: Fotografía */}
              <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                <Label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-4">Fotografía Inicial (Fábrica)</Label>
                <div className="rounded-xl overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-neutral-800/60">
                  <ImageUploader
                    ref={uploaderRef}
                    bucketName="inventario-imgs"
                    currentImagePath={imagenUrl || null}
                    onUploadSuccess={(path) => setValue('imagen_url', path)}
                    onDeleteSuccess={() => setValue('imagen_url', null)}
                    onEstadoChange={({ uploading }) => setIsUploadingImage(uploading)}
                    aspect={3/4}
                    aspectLabel="Vertical 3:4"
                    permitirTodos={true}
                    previewClassName="max-h-[200px]"
                  />
                </div>
              </div>

              {/* Card: Asignación */}
              <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Asignación Inicial (Opcional)</h4>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Escribe para buscar un empleado..."
                      value={searchUsuario}
                      onChange={(e) => {
                        setSearchUsuario(e.target.value);
                        setShowUsuariosDrop(e.target.value.length > 0);
                        if (e.target.value === '') {
                          setValue('id_usuario_asignado', '');
                        }
                      }}
                      onFocus={(e) => setShowUsuariosDrop(e.target.value.length > 0)}
                      onBlur={() => setTimeout(() => setShowUsuariosDrop(false), 200)}
                      className="pl-10 bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800 rounded-xl focus-visible:ring-blue-500/30"
                    />
                  </div>
                  
                  {showUsuariosDrop && (
                    <div className="absolute z-50 w-full bottom-full mb-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl shadow-black/10 max-h-56 overflow-y-auto custom-scrollbar">
                      {filteredUsuarios.length > 0 ? (
                        <ul className="p-1.5">
                          {filteredUsuarios.map(u => (
                            <li 
                              key={u.user_id}
                              className="px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                              onClick={() => {
                                setSearchUsuario(u.nombre);
                                setValue('id_usuario_asignado', u.user_id);
                                clearErrors('id_usuario_asignado');
                                setShowUsuariosDrop(false);
                              }}
                            >
                              <span className="font-medium">{u.nombre}</span>
                              {watch('id_usuario_asignado') === u.user_id && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500 dark:text-neutral-500 font-medium">
                          No se encontraron empleados.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Columna Derecha: Datos del Bien */}
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
              
              <div className="space-y-1.5">
                <Label htmlFor="serie" className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Número de Serie <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="serie" 
                  {...register('serie')} 
                  placeholder="Ej. SN-987654321" 
                  className="bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800 rounded-xl focus-visible:ring-blue-500/30"
                />
                {errors.serie && <span className="text-xs font-medium text-red-500">{errors.serie.message}</span>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descripcion" className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="descripcion" 
                  {...register('descripcion')} 
                  placeholder="Ej. Monitor HP 24 pulgadas" 
                  className="bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800 rounded-xl focus-visible:ring-blue-500/30"
                />
                {errors.descripcion && <span className="text-xs font-medium text-red-500">{errors.descripcion.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ctd" className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Cantidad <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="ctd" 
                    type="number" 
                    min="1" 
                    inputMode="numeric"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800 rounded-xl focus-visible:ring-blue-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('ctd', {
                      onBlur: (e) => {
                        if (!e.target.value || Number(e.target.value) < 1) setValue('ctd', 1);
                      }
                    })} 
                  />
                  {errors.ctd && <span className="text-xs font-medium text-red-500">{errors.ctd.message}</span>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="valor" className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Valor (Q) <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="valor" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    inputMode="decimal"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                    className="bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800 rounded-xl focus-visible:ring-blue-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('valor', {
                      onBlur: (e) => {
                        if (!e.target.value || Number(e.target.value) < 0) setValue('valor', 0);
                      }
                    })} 
                  />
                  {errors.valor && <span className="text-xs font-medium text-red-500">{errors.valor.message}</span>}
                </div>
              </div>

            </div>

          </div>
        </form>
        </div>

        {/* Cintillo de Colores Institucional */}
        <div className="flex h-1.5 sm:h-2 w-full mt-2 mb-2 shrink-0">
          <div className="flex-1 bg-blue-900" />
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-blue-400" />
          <div className="flex-1 bg-blue-200" />
        </div>

        <div className="flex justify-center items-center pb-6 shrink-0">
          <button 
            type="submit" 
            disabled={isSubmitting || isUploadingImage}
            onClick={handleSubmit(onSubmit as any)}
            className="px-12 sm:px-16 py-3 text-base font-bold bg-blue-600 text-white rounded-xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {(isSubmitting || isUploadingImage) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isUploadingImage ? 'Subiendo imagen...' : 'Registrar Bien'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
