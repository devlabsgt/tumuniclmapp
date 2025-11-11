'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence } from 'framer-motion';
import { DependenciaNode } from '../DependenciaItem';

const formSchema = z.object({
  renglon: z.string().min(1, { message: "Debe seleccionar un renglón." }),
  salario: z.number().min(0, { message: "El valor no puede ser negativo." }).optional(),
  bonificacion: z.number().min(0, { message: "El valor no puede ser negativo." }).optional(),
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
      renglon: "",
      salario: undefined,
      bonificacion: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        renglon: dependencia?.renglon || "",
        salario: dependencia?.salario || undefined,
        bonificacion: dependencia?.bonificacion || undefined,
      });
    }
  }, [isOpen, dependencia, form]);

  const renglonSeleccionado = form.watch('renglon');
  const configActual = renglonSeleccionado ? renglonConfig[renglonSeleccionado] : null;

  useEffect(() => {
    if (configActual && !configActual.tieneBono) {
      form.setValue('bonificacion', undefined);
    }
  }, [renglonSeleccionado, configActual, form]);

  const handleFormSubmit: SubmitHandler<InfoFinancieraFormData> = (data) => {
    onSubmit({
      renglon: data.renglon,
      salario: data.salario || 0,
      bonificacion: (configActual?.tieneBono && data.bonificacion) ? data.bonificacion : 0,
    });
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
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un renglón..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>NOMBRAMIENTO</SelectLabel>
                                {Object.entries(nombramientoRenglones).map(([k, v]) => (
                                  <SelectItem key={k} value={k} className="text-xs">{k} - {v}</SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>CONTRATO</SelectLabel>
                                {Object.entries(contratoRenglones).map(([k, v]) => (
                                  <SelectItem key={k} value={k} className="text-xs">{k} - {v}</SelectItem>
                                ))}
                              </SelectGroup>
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
                          <FormItem className={configActual.tieneBono ? "" : "md:col-span-2"}>
                            <FormLabel className="text-xs">{configActual.salarioLabel}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q</span>
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  className="pl-7"
                                  placeholder={configActual.placeholder}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    field.onChange(val === '' ? undefined : Number(val));
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
                                    type="number"
                                    step="1"
                                    min="0"
                                    className="pl-7"
                                    placeholder="Bonificación"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        field.onChange(val === '' ? undefined : Number(val));
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