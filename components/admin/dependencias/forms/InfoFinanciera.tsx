'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DependenciaNode } from '../DependenciaItem';

const formSchema = z.object({
  renglon: z.string().min(1, { message: "Debe seleccionar un renglón." }),
  salario: z.number().min(0, { message: "El valor no puede ser negativo." }).optional(),
  bonificacion: z.number().min(0, { message: "El valor no puede ser negativo." }).optional(),
  prima: z.boolean().optional(),
});

export type InfoFinancieraFormData = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InfoFinancieraFormData) => void;
  dependencia: DependenciaNode | null;
}

const nombramientoRenglones = {
  '011': 'Personal permanente',
  '061': 'Dietas',
};

const contratoRenglones = {
  '022': 'Personal por contrato',
  '029': 'Otras remuneraciones de personal temporal',
  '031': 'Jornales',
  '035': 'Retribuciones a destajo',
  '036': 'Retribuciones por servicios',
};

type RenglonConfig = { salarioLabel: string; bonoLabel?: string; placeholder: string; tieneBono: boolean };

const renglonConfig: Record<string, RenglonConfig> = {
  '011': { salarioLabel: 'Salario Base (011)', bonoLabel: 'Bonificación (015)', placeholder: 'Salario', tieneBono: true },
  '061': { salarioLabel: 'Dietas (061)', placeholder: 'Dietas', tieneBono: false },
  '022': { salarioLabel: 'Salario Base (022)', bonoLabel: 'Bonificación (027)', placeholder: 'Salario', tieneBono: true },
  '029': { salarioLabel: 'Honorarios (029)', placeholder: 'Honorarios', tieneBono: false },
  '031': { salarioLabel: 'Jornal (031)', bonoLabel: 'Bonificación (033)', placeholder: 'Jornal', tieneBono: true },
  '035': { salarioLabel: 'Retribución a destajo (035)', placeholder: 'Importe', tieneBono: false },
  '036': { salarioLabel: 'Retribución por servicios (036)', placeholder: 'Importe', tieneBono: false },
};

export default function InfoFinancieraForm({ isOpen, onClose, onSubmit, dependencia }: Props) {
  const form = useForm<InfoFinancieraFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renglon: dependencia?.renglon || "",
      salario: dependencia?.salario || undefined,
      bonificacion: dependencia?.bonificacion || undefined,
      prima: dependencia?.prima || false,
    },
  });

  const { reset, setValue } = form;

  useEffect(() => {
    if (isOpen && dependencia) { 
      reset({
        renglon: dependencia.renglon || "",
        salario: dependencia.salario || undefined,
        bonificacion: dependencia.bonificacion || undefined,
        prima: dependencia.prima || false,
      });
    } else if (!isOpen) {
      reset({
        renglon: "",
        salario: undefined,
        bonificacion: undefined,
        prima: false,
      });
    }
  }, [isOpen, dependencia, reset]);

  const renglonSeleccionado = form.watch('renglon');
  
  const renglonActivo = renglonSeleccionado || dependencia?.renglon;
  const configActual = renglonActivo ? renglonConfig[renglonActivo] : null;

  useEffect(() => {
    if (configActual) {
      if (!configActual.tieneBono) {
        setValue('bonificacion', undefined);
      }
    }
  }, [renglonSeleccionado, configActual, setValue]);

  const handleFormSubmit: SubmitHandler<InfoFinancieraFormData> = (data) => {
    onSubmit({
      renglon: data.renglon,
      salario: data.salario || 0,
      bonificacion: (configActual?.tieneBono && data.bonificacion) ? data.bonificacion : 0,
      prima: data.prima || false,
    });
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const val = e.target.value;
    
    if (val === '') {
      field.onChange(undefined);
      return;
    }

    const cleanVal = val.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    const numVal = parseFloat(cleanVal);

    if (!isNaN(numVal)) {
      field.onChange(numVal);
    } else if (cleanVal === '') {
      field.onChange(undefined);
    }
  };

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
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            
            <div className="p-6">
              <h2 className="text-xl text-blue-600 font-bold mb-1">Información Financiera</h2>
              <p className="text-sm text-gray-500 mb-4">{dependencia?.nombre}</p>
              <hr className="my-4 border-slate-200 dark:border-slate-700" />

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="renglon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renglón Presupuestario</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="" disabled={field.value !== ""}>Seleccione un renglón...</option>
                              
                              <optgroup label="NOMBRAMIENTO">
                                {Object.entries(nombramientoRenglones).map(([k, v]) => (
                                  <option key={k} value={k} className="text-xs">{k} - {v}</option>
                                ))}
                              </optgroup>
                              
                              <optgroup label="CONTRATO">
                                {Object.entries(contratoRenglones).map(([k, v]) => (
                                  <option key={k} value={k} className="text-xs">{k} - {v}</option>
                                ))}
                              </optgroup>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="prima"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Prima de Fianza</FormLabel>
                          </div>
                          <FormControl>
                            <label htmlFor="toggle-prima" className="flex items-center cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id="toggle-prima"
                                  className="sr-only peer"
                                  checked={!!field.value}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                />
                                <div className="block h-6 w-10 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all duration-200 peer-checked:translate-x-4"></div>
                              </div>
                              <div className="ml-3 text-gray-700 text-xs">
                                {field.value ? 'Sí' : 'No'}
                              </div>
                            </label>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {configActual && (
                    <>
                      <FormField
                        control={form.control}
                        name="salario"
                        render={({ field }) => (
                          <FormItem className={configActual.tieneBono ? "" : "md:col-span-2"}>
                            <FormLabel className="text-xs">{configActual.salarioLabel}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q</span>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  className="pl-7"
                                  placeholder={configActual.placeholder}
                                  {...field}
                                  value={field.value === undefined ? '' : String(field.value)}
                                  onChange={e => handleNumericChange(e, field)}
                                  onBlur={() => {
                                      const val = form.getValues('salario');
                                      const numVal = parseFloat(val as any);
                                      form.setValue('salario', isNaN(numVal) ? undefined : numVal);
                                  }}
                                />
                              </div>
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
                            <FormItem>
                              <FormLabel className="text-xs">{configActual.bonoLabel}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q</span>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    className="pl-7"
                                    placeholder="Bonificación"
                                    {...field}
                                    value={field.value === undefined ? '' : String(field.value)}
                                    onChange={e => handleNumericChange(e, field)}
                                    onBlur={() => {
                                      const val = form.getValues('bonificacion');
                                      const numVal = parseFloat(val as any);
                                      form.setValue('bonificacion', isNaN(numVal) ? undefined : numVal);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-4 md:col-span-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!renglonSeleccionado}>
                      Guardar Información
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