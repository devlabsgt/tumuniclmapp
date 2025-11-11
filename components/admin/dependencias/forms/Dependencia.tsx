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
import { Switch } from '@/components/ui/Switch';
import { DependenciaNode } from '../DependenciaItem'; 
import {
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'; 

const formSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  descripcion: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  es_puesto: z.boolean().default(false).optional(),
});

export type FormData = z.infer<typeof formSchema>;

export interface SelectableDependency {
  id: string;
  nombre: string;
  level: number;
  prefix: string; 
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: DependenciaNode | null; 
  todasLasDependencias: DependenciaType[];
  preselectedParentId?: string | null;
  selectableDependencies: SelectableDependency[]; 
}

export default function Dependencia({ isOpen, onClose, onSubmit, initialData, preselectedParentId, todasLasDependencias, selectableDependencies }: Props) { 
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      parent_id: initialData?.parent_id || null,
      es_puesto: initialData?.es_puesto || false,
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
          es_puesto: initialData.es_puesto || false,
        });
      } else if (mode === 'CREATE_SUB') {
        form.reset({
          nombre: '',
          descripcion: '',
          parent_id: preselectedParentId,
          es_puesto: false,
        });
      } else { 
        form.reset({
          nombre: '',
          descripcion: '',
          parent_id: null,
          es_puesto: false,
        });
      }
    }
  }, [mode, initialData, preselectedParentId, form, isOpen]);

  const handleSelectChange = (value: string) => {
    form.setValue('parent_id', value === 'null' ? null : value, { shouldValidate: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" 
            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {mode === 'EDIT' ? 'Editar Dependencia' : 'Nueva Dependencia'}
              </h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FormData>)} className="space-y-4">
                  
                  {/* Solo mostramos el Switch si NO estamos en modo edición */}
                  {mode !== 'EDIT' && (
                    <FormField
                      control={form.control}
                      name="es_puesto"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                          <div className="space-y-0.5">
                            <FormLabel>¿Es un Puesto?</FormLabel>
                            <p className="text-[10px] text-gray-500">
                              Habilita esta opción si es un puesto al que se le asignará un empleado.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

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
                  
                  {mode === 'EDIT' && ( 
                    <FormField
                      control={form.control}
                      name="parent_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mover a otra dependencia</FormLabel>
                          <Select 
                            onValueChange={handleSelectChange} 
                            value={field.value === null || field.value === undefined ? 'null' : field.value} 
                          >
                            <FormControl>
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Seleccione la dependencia superior..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent 
                              className="text-xs [&>div]:!p-0 [&>div]:!gap-0" 
                              style={{ width: '400px' }} 
                            >
                              <SelectItem key="null" value="null" className="text-xs font-bold">
                                [ Nivel Raíz ]
                              </SelectItem>
                              
                              {selectableDependencies.map((dep) => (
                                <SelectItem 
                                  key={dep.id} 
                                  value={dep.id} 
                                  className="text-xs p-0" 
                                >
                                  <div 
                                    className="flex items-center overflow-hidden whitespace-nowrap py-1.5 px-2 w-full"
                                    style={{ paddingLeft: `${dep.level * 15 + 8}px` }} 
                                  >
                                    <span className="font-semibold mr-2 flex-shrink-0">{dep.prefix}</span>
                                    <span className="truncate flex-grow min-w-0"> 
                                        {dep.nombre}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
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