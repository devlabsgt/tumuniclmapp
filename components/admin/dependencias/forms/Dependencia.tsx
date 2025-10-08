'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dependencia as DependenciaType } from '../Ver';

const formSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  descripcion: z.string().optional(),
  parent_id: z.string().nullable().optional(),
});

export type FormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: DependenciaType | null;
  todasLasDependencias: DependenciaType[];
  preselectedParentId?: string | null;
}

export default function Dependencia({ isOpen, onClose, onSubmit, initialData, preselectedParentId }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      parent_id: initialData?.parent_id || null,
    },
  });

  const mode = useMemo(() => {
    if (initialData) return 'EDIT';
    if (preselectedParentId) return 'CREATE_SUB';
    return 'CREATE_ROOT';
  }, [initialData, preselectedParentId]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'EDIT' && initialData) {
        form.reset({
          nombre: initialData.nombre,
          descripcion: initialData.descripcion || '',
          parent_id: initialData.parent_id,
        });
      } else if (mode === 'CREATE_SUB') {
        form.reset({
          nombre: '',
          descripcion: '',
          parent_id: preselectedParentId,
        });
      } else { 
        form.reset({
          nombre: '',
          descripcion: '',
          parent_id: null,
        });
      }
    }
  }, [mode, initialData, preselectedParentId, form, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {initialData ? 'Editar Dependencia' : 'Nueva Dependencia'}
              </h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FormData>)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <FormLabel className="text-xs w-28 sr-only text-right">Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre" {...field} className="text-xs" />
                          </FormControl>
                        </div>
                        <FormMessage className="ml-[128px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <FormLabel className="text-xs w-28 sr-only text-right">Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción (Opcional)" {...field} value={field.value || ''} className="text-xs" />
                          </FormControl>
                        </div>
                        <FormMessage className="ml-[128px]" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="text-xs">Cancelar</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Guardar</Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}