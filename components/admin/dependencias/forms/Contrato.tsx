//forms/Contrato.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence } from 'framer-motion';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Database } from '@/lib/database.types';

type Contrato = Database['public']['Tables']['info_contrato']['Row'];

const formSchema = z.object({
  renglon: z.string().min(1, { message: "Debe seleccionar un renglón." }),
  contrato_no: z.string().optional(),
  salario: z.number().min(0, { message: "El valor no puede ser negativo." }).optional(),
  bonificacion: z.number().min(0, { message: "El valor no puede ser negativo." }).optional(),
  fecha_ini: z.string().optional(),
  fecha_fin: z.string().optional(),
});

export type ContratoFormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContratoFormData) => void;
  usuario: Usuario | null;
  initialData?: Partial<Contrato> | null;
}

const renglonesInfo = {
  '011': 'Personal permanente',
  '022': 'Personal por contrato',
  '029': 'Otras remuneraciones de personal temporal',
  '031': 'Jornales',
  '035': 'Retribuciones a destajo',
  '036': 'Retribuciones por servicios',
};

type RenglonConBono = { salarioLabel: string; bonoLabel: string; placeholder: string; tieneBono: true };
type RenglonSinBono = { salarioLabel: string; placeholder: string; tieneBono: false };
type RenglonConfig = RenglonConBono | RenglonSinBono;

const renglonConfig: Record<string, RenglonConfig> = {
  '011': { salarioLabel: '011 - Personal permanente', bonoLabel: '015 - Complementos específicos', placeholder: 'Salario', tieneBono: true },
  '022': { salarioLabel: '022 - Personal por contrato', bonoLabel: '027 - Complementos específicos', placeholder: 'Salario', tieneBono: true },
  '029': { salarioLabel: '029 - Otras remuneraciones', placeholder: 'Remuneración', tieneBono: false },
  '031': { salarioLabel: '031 - Jornales', bonoLabel: '033 - Complementos específicos', placeholder: 'Jornal', tieneBono: true },
  '035': { salarioLabel: '035 - Retribuciones a destajo', placeholder: 'Subsidio', tieneBono: false },
  '036': { salarioLabel: '036 - Retribuciones por servicios', placeholder: 'Retribución', tieneBono: false },
};

type RenglonKey = keyof typeof renglonConfig;

export default function ContratoForm({ isOpen, onClose, onSubmit, usuario, initialData }: Props) {
  const form = useForm<ContratoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renglon: initialData?.renglon || undefined,
      contrato_no: initialData?.contrato_no || '',
      salario: initialData?.salario ?? undefined,
      bonificacion: initialData?.bonificacion ?? undefined,
      fecha_ini: initialData?.fecha_ini ? new Date(initialData.fecha_ini).toISOString().split('T')[0] : '',
      fecha_fin: initialData?.fecha_fin ? new Date(initialData.fecha_fin).toISOString().split('T')[0] : '',
    },
  });

  const renglonSeleccionado = form.watch('renglon');
  const configActual = renglonSeleccionado ? renglonConfig[renglonSeleccionado as RenglonKey] : null;

  useEffect(() => {
    form.reset({
      renglon: initialData?.renglon || undefined,
      contrato_no: initialData?.contrato_no || '',
      salario: initialData?.salario ?? undefined,
      bonificacion: initialData?.bonificacion ?? undefined,
      fecha_ini: initialData?.fecha_ini ? new Date(initialData.fecha_ini).toISOString().split('T')[0] : '',
      fecha_fin: initialData?.fecha_fin ? new Date(initialData.fecha_fin).toISOString().split('T')[0] : '',
    });
  }, [initialData, form]);
  
  useEffect(() => {
    if (configActual && !configActual.tieneBono) {
      form.setValue('bonificacion', undefined);
    }
  }, [renglonSeleccionado, configActual, form]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1">Información de Contrato</h2>
              <p className="text-sm font-semibold text-blue-500 mb-4"> {usuario?.nombre}</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<ContratoFormData>)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="renglon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renglón Presupuestario</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un renglón..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(renglonesInfo).map(([numero, descripcion]) => (
                                <SelectItem key={numero} value={numero} className="text-xs">
                                  {numero} - {descripcion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {renglonSeleccionado && configActual && (
                    <>
                      <FormField
                        control={form.control}
                        name="salario"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-xs">{configActual.salarioLabel}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                placeholder={configActual.placeholder}
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {configActual.tieneBono && (
                        <FormField
                          control={form.control}
                          name="bonificacion"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-xs">{configActual.bonoLabel}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  placeholder="Bonificación"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField control={form.control} name="contrato_no" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>No. de Contrato</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                      
                      <FormField control={form.control} name="fecha_ini" render={({ field }) => ( <FormItem><FormLabel>Fecha Inicio</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                      <FormField control={form.control} name="fecha_fin" render={({ field }) => ( <FormItem><FormLabel>Fecha Fin</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    </>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4 md:col-span-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={!renglonSeleccionado}>Guardar Cambios</Button>
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