'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { maestroSchema, type Maestro as MaestroType } from '../lib/esquemas';
import { toast } from 'react-toastify';

type MaestroFormData = z.infer<typeof maestroSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  maestroAEditar?: MaestroType | null;
}

export default function Maestro({ isOpen, onClose, onSave, maestroAEditar }: Props) {
  const isEditMode = !!maestroAEditar;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<MaestroFormData>({
    resolver: zodResolver(maestroSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (maestroAEditar) {
        reset(maestroAEditar);
      } else {
        reset({
          nombre: '',
          ctd_alumnos: 0,
        });
      }
    }
  }, [isOpen, maestroAEditar, reset]);

  const onSubmit = async (formData: MaestroFormData) => {
    const supabase = createClient();
    if (isEditMode) {
      const { error } = await supabase.from('maestros_municipales').update(formData).eq('id', maestroAEditar!.id);
      if (error) {
        toast.error(`Error al actualizar: ${error.message}`);
      } else {
        toast.success('Maestro actualizado correctamente.');
        onSave();
      }
    } else {
      const { data: existente } = await supabase.from('maestros_municipales').select('id').eq('nombre', formData.nombre).single();
      if (existente) {
        toast.error(`Ya existe un maestro con el nombre "${formData.nombre}".`);
        return;
      }
      const { error } = await supabase.from('maestros_municipales').insert(formData);
      if (error) {
        toast.error(`Error al crear: ${error.message}`);
      } else {
        toast.success(`Maestro creado correctamente.`);
        onSave();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <motion.div
        className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg p-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Editar Maestro' : 'Nuevo Maestro'}</h2>
            <p className="text-sm text-gray-500">Proporcione los detalles del maestro.</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full -mt-2 -mr-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <Input id="nombre" {...register("nombre")} placeholder="Nombre del maestro" className={errors.nombre ? 'border-red-500' : ''} />
              {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label htmlFor="ctd_alumnos" className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Alumnos</label>
              <Input 
                id="ctd_alumnos" 
                type="number"
                {...register("ctd_alumnos", { valueAsNumber: true })} 
                placeholder="0" 
                className={errors.ctd_alumnos ? 'border-red-500' : ''} 
              />
              {errors.ctd_alumnos && <p className="text-sm text-red-500 mt-1">{errors.ctd_alumnos.message}</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
