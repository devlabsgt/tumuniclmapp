'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence } from 'framer-motion';
import { Usuario } from '@/lib/usuarios/esquemas';
// Importamos el tipo que Ver.tsx SÍ está usando:
import { type InfoUsuarioData } from '@/hooks/usuarios/useInfoUsuario';

const formSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre es requerido.' }),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  dpi: z.string().optional(),
  nit: z.string().optional(),
  igss: z.string().optional(),
  cuenta_no: z.string().optional(),
});

export type InfoPersonalFormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InfoPersonalFormData) => void;
  usuario: Usuario | null;
  // Corregimos el tipo de 'initialData' para que coincida con el hook
  initialData?: Partial<InfoUsuarioData>;
}

export default function InfoPersonalForm({ isOpen, onClose, onSubmit, usuario, initialData }: Props) {
  const form = useForm<InfoPersonalFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      direccion: initialData?.direccion || '',
      telefono: initialData?.telefono || '',
      dpi: initialData?.dpi || '',
      nit: initialData?.nit || '',
      igss: initialData?.igss || '',
      cuenta_no: initialData?.cuenta_no || '',
    },
  });

  useEffect(() => {
    if (initialData || usuario) {
      form.reset({
        nombre: initialData?.nombre || usuario?.nombre || '',
        direccion: initialData?.direccion || '',
        telefono: initialData?.telefono || '',
        dpi: initialData?.dpi || '',
        nit: initialData?.nit || '',
        igss: initialData?.igss || '',
        cuenta_no: initialData?.cuenta_no || '',
      });
    }
  }, [initialData, usuario, form]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg m-4"
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1">Información Personal</h2>
              <p className="text-sm text-gray-500 mb-4">Editando a: {usuario?.nombre}</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<InfoPersonalFormData>)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="dpi" render={({ field }) => ( <FormItem><FormLabel>DPI</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="direccion" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="nit" render={({ field }) => ( <FormItem><FormLabel>NIT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="igss" render={({ field }) => ( <FormItem><FormLabel>Afiliación IGSS</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="cuenta_no" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>No. de Cuenta Bancaria</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="flex justify-end gap-2 pt-4 md:col-span-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
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