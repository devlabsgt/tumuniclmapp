'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const getDescendantIds = (dependenciaId: string, dependencias: DependenciaType[]): string[] => {
  let descendants: string[] = [];
  const children = dependencias.filter(d => d.parent_id === dependenciaId);
  for (const child of children) {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, dependencias)];
  }
  return descendants;
};

const calculateLevels = (dependencias: DependenciaType[]): Map<string, number> => {
    const levels = new Map<string, number>();
    const depMap = new Map(dependencias.map(d => [d.id, d]));
    const findLevel = (depId: string): number => {
        if (levels.has(depId)) return levels.get(depId)!;
        const dep = depMap.get(depId);
        if (!dep || !dep.parent_id) {
            levels.set(depId, 0);
            return 0;
        }
        const parentLevel = findLevel(dep.parent_id);
        const currentLevel = parentLevel + 1;
        levels.set(depId, currentLevel);
        return currentLevel;
    };
    dependencias.forEach(d => findLevel(d.id));
    return levels;
};

export default function Dependencia({ isOpen, onClose, onSubmit, initialData, todasLasDependencias, preselectedParentId }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nombre: '', descripcion: '', parent_id: null },
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
          parent_id: preselectedParentId || null,
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

  const dependenciasPadrePosibles = useMemo(() => {
    if (mode !== 'EDIT' || !initialData) {
      return []; 
    }
    
    const levels = calculateLevels(todasLasDependencias);
    const currentLevel = levels.get(initialData.id) ?? 0;
    if (currentLevel === 0) return [];
    
    const targetParentLevel = currentLevel - 1;
    const idsInvalidos = [initialData.id, ...getDescendantIds(initialData.id, todasLasDependencias)];
    
    return todasLasDependencias.filter(dep => {
      if (idsInvalidos.includes(dep.id)) return false;
      const depLevel = levels.get(dep.id) ?? 0;
      return depLevel === targetParentLevel;
    });
  }, [mode, initialData, todasLasDependencias]);

  const parentName = useMemo(() => {
    if (mode === 'CREATE_SUB') {
      return todasLasDependencias.find(d => d.id === preselectedParentId)?.nombre;
    }
    return '';
  }, [mode, preselectedParentId, todasLasDependencias]);

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
              <h2 className="text-xl font-bold mb-4">{initialData ? 'Editar Dependencia' : 'Nueva Dependencia'}</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<FormData>)} className="space-y-4">
                  <FormField control={form.control} name="nombre" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <FormLabel className="text-xs w-28 sr-only text-right">Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage className="ml-[128px]" />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="descripcion" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-4">
                          <FormLabel className="text-xs w-28 sr-only text-right">Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción (Opcional)" {...field} value={field.value || ''} />
                          </FormControl>
                        </div>
                        <FormMessage className="ml-[128px]" />
                      </FormItem>
                    )}
                  />
                  
                  {mode === 'CREATE_SUB' && (
                    <div className="flex items-center gap-4">
                      <FormLabel className="text-xs w-28 text-right">Dependencia Padre</FormLabel>
                      <div className="flex h-10 w-full items-center text-sm text-gray-700">
                        {parentName}
                      </div>
                    </div>
                  )}

                  {mode === 'EDIT' && (
                    <FormField control={form.control} name="parent_id" render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-4">
                            <FormLabel className="text-xs w-28 text-right">Dependencia Padre</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'null' ? null : value)} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="-- Ninguna (Dependencia Principal) --" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="null">-- Ninguna (Dependencia Principal) --</SelectItem>
                                {dependenciasPadrePosibles.map(dep => (
                                  <SelectItem key={dep.id} value={dep.id}>{dep.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage className="ml-[128px]" />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
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