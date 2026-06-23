'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bajaSchema, BajaFormValues } from '../lib/schemas';
import { useInventarioMutations } from '../lib/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUploader, { ImageUploaderHandle } from '@/components/imgs/ImageUploader';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface BajaModalProps {
  idBien: string;
  nombreBien: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BajaModal({ idBien, nombreBien, open, onOpenChange }: BajaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { darBaja } = useInventarioMutations();
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BajaFormValues>({
    resolver: zodResolver(bajaSchema),
    defaultValues: {
      imagen_url: '',
      observaciones: '',
    }
  });

  const imagenUrl = watch('imagen_url');

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: BajaFormValues) => {
    setIsSubmitting(true);
    try {
      darBaja.mutate({
        idBien: idBien,
        imagenUrl: data.imagen_url || null,
        observaciones: data.observaciones,
      }, {
        onSuccess: () => {
          toast.success('Bien dado de baja correctamente');
          handleClose();
        },
        onError: (error: any) => {
          toast.error(`Error al dar de baja: ${error.message || 'Desconocido'}`);
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
          <DialogTitle>Dar de Baja Bien: {nombreBien}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Evidencia Fotográfica del Daño <span className="text-red-500">*</span></Label>
              <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-neutral-900/50">
                <ImageUploader
                  ref={uploaderRef}
                  bucketName="inventario-imgs"
                  currentImagePath={imagenUrl || null}
                  onUploadSuccess={(path) => setValue('imagen_url', path)}
                  onDeleteSuccess={() => setValue('imagen_url', '')}
                  aspect={3/4}
                  aspectLabel="Vertical 3:4"
                  permitirTodos={true}
                  previewClassName="max-h-[250px]"
                />
              </div>
              {errors.imagen_url && <span className="text-xs text-red-500">{errors.imagen_url.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Motivo o Dictamen de Baja <span className="text-red-500">*</span></Label>
              <Textarea 
                id="observaciones" 
                {...register('observaciones')} 
                placeholder="Describa por qué el bien está siendo dado de baja..." 
                rows={4}
              />
              {errors.observaciones && <span className="text-xs text-red-500">{errors.observaciones.message}</span>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Baja
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
