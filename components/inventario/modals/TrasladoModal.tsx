'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trasladoSchema, TrasladoFormValues } from '../lib/schemas';
import { toast } from 'react-toastify';
import { useDependenciasBasicas, useUsuariosBasicos, useInventarioMutations } from '../lib/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUploader, { ImageUploaderHandle } from '@/components/imgs/ImageUploader';
import { Loader2, Search, CheckCircle2 } from 'lucide-react';

interface TrasladoModalProps {
  idBien: string;
  nombreBien: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TrasladoModal({ idBien, nombreBien, open, onOpenChange }: TrasladoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: dependencias = [] } = useDependenciasBasicas();
  const { data: usuarios = [] } = useUsuariosBasicos();
  const { trasladar } = useInventarioMutations();

  const [searchUsuario, setSearchUsuario] = useState('');
  const [showUsuariosDrop, setShowUsuariosDrop] = useState(false);

  const uploaderRef = useRef<ImageUploaderHandle>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, clearErrors } = useForm<TrasladoFormValues>({
    resolver: zodResolver(trasladoSchema),
    defaultValues: {
      id_usuario_destino: '',
      id_dependencia_destino: '',
      imagen_url: '',
      observaciones: '',
    }
  });

  const imagenUrl = watch('imagen_url');

  useEffect(() => {
    if (!open) {
      reset();
      setSearchUsuario('');
    }
  }, [open, reset]);

  const handleClose = () => {
    reset();
    setSearchUsuario('');
    setShowUsuariosDrop(false);
    onOpenChange(false);
  };

  const filteredUsuarios = usuarios.filter(u => u.nombre.toLowerCase().includes(searchUsuario.toLowerCase()));

  const onSubmit = async (data: TrasladoFormValues) => {
    setIsSubmitting(true);
    try {
      trasladar.mutate({
        idBien: idBien,
        nuevoIdUsuario: data.id_usuario_destino || null,
        nuevoIdDependencia: null,
        imagenUrl: data.imagen_url || null,
        observaciones: data.observaciones || null,
      }, {
        onSuccess: () => {
          toast.success('Bien trasladado correctamente');
          handleClose();
        },
        onError: (error: any) => {
          toast.error(`Error al trasladar el bien: ${error.message || 'Desconocido'}`);
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
      <DialogContent aria-describedby={undefined} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Trasladar Bien: {nombreBien}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Empleado Destino <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Escribe para buscar un empleado..."
                      value={searchUsuario}
                      onChange={(e) => {
                        setSearchUsuario(e.target.value);
                        setShowUsuariosDrop(e.target.value.length > 0);
                        if (e.target.value === '') {
                          setValue('id_usuario_destino', '');
                        }
                      }}
                      onFocus={(e) => setShowUsuariosDrop(e.target.value.length > 0)}
                      onBlur={() => setTimeout(() => setShowUsuariosDrop(false), 200)}
                      className="pl-9"
                    />
                  </div>
                  
                  {showUsuariosDrop && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsuarios.length > 0 ? (
                        <ul className="py-1">
                          {filteredUsuarios.map(u => (
                            <li 
                              key={u.user_id}
                              className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between"
                              onClick={() => {
                                setSearchUsuario(u.nombre);
                                setValue('id_usuario_destino', u.user_id);
                                clearErrors('id_usuario_destino');
                                setShowUsuariosDrop(false);
                              }}
                            >
                              {u.nombre}
                              {watch('id_usuario_destino') === u.user_id && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                          No se encontraron empleados.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.id_usuario_destino && <p className="text-xs text-red-500">{errors.id_usuario_destino.message}</p>}
              </div>

            <div className="space-y-2">
              <Label>Evidencia Fotográfica (Acta o Entrega)</Label>
              <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-neutral-900/50">
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
                  previewClassName="max-h-[250px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input id="observaciones" {...register('observaciones')} placeholder="Motivo o detalle del traslado" />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || isUploadingImage}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage} className="bg-blue-600 hover:bg-blue-700 text-white">
              {(isSubmitting || isUploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploadingImage ? 'Subiendo imagen...' : 'Confirmar Traslado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
