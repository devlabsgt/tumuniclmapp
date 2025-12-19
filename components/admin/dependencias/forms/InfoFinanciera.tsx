'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { DependenciaNode } from '../DependenciaItem';

const formSchema = z.object({
  renglon: z.string().min(1, { message: "Seleccione un renglón" }),
  salario: z.string().optional(),
  bonificacion: z.string().optional(),
  unidades_tiempo: z.string().optional(),
  prima: z.boolean().optional(),
  tiene_antiguedad: z.boolean().optional(),
  antiguedad: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export type InfoFinancieraFormData = {
  renglon: string;
  salario?: number;
  bonificacion?: number;
  unidades_tiempo?: number;
  prima?: boolean;
  antiguedad?: number;
};

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
  '031-dia': 'Jornales (Por Día)',
  '031-hora': 'Jornales (Por Hora)',
  '035': 'Retribuciones a destajo',
  '036': 'Retribuciones por servicios',
};

type RenglonConfig = { 
  salarioLabel: string; 
  bonoLabel?: string; 
  placeholder: string; 
  tieneBono: boolean;
  requiereUnidades?: boolean;
  unidadesLabel?: string;
  defaultSalario?: string;
  defaultBono?: string;
  defaultUnidades?: string;
  admiteAntiguedad?: boolean;
};

const renglonConfig: Record<string, RenglonConfig> = {
  '011': { 
    salarioLabel: 'Salario Base (011)', 
    bonoLabel: 'Bonificación (015)', 
    placeholder: 'Salario Mensual', 
    tieneBono: true, 
    admiteAntiguedad: true 
  },
  '061': { salarioLabel: 'Dietas (061)', placeholder: 'Monto Dieta', tieneBono: false },
  '022': { salarioLabel: 'Salario Base (022)', bonoLabel: 'Bonificación (027)', placeholder: 'Salario Mensual', tieneBono: true },
  '029': { salarioLabel: 'Honorarios (029)', placeholder: 'Honorarios', tieneBono: false },
  '031-dia': { 
    salarioLabel: 'Jornal Diario (Base)', 
    bonoLabel: 'Bonificación (Por día)', 
    placeholder: 'Q 116.73', 
    tieneBono: true,
    requiereUnidades: true,
    unidadesLabel: 'Total Días Trabajados',
    defaultSalario: '116.73',
    defaultBono: '8.33',
    defaultUnidades: '26'
  },
  '031-hora': { 
    salarioLabel: 'Pago por Hora (Base)', 
    bonoLabel: 'Bonificación (Por hora)', 
    placeholder: 'Q 19.80', 
    tieneBono: true,
    requiereUnidades: true,
    unidadesLabel: 'Total Horas Trabajadas',
    defaultSalario: '19.80',
    defaultBono: '1.19',
    defaultUnidades: '104'
  },
  '035': { salarioLabel: 'Retribución a destajo (035)', placeholder: 'Importe', tieneBono: false },
  '036': { salarioLabel: 'Retribución por servicios (036)', placeholder: 'Importe', tieneBono: false },
};

export default function InfoFinancieraForm({ isOpen, onClose, onSubmit, dependencia }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      renglon: "",
      salario: "",
      bonificacion: "",
      unidades_tiempo: "",
      prima: false,
      tiene_antiguedad: false,
      antiguedad: "",
    },
  });

  const { reset, setValue, watch, handleSubmit } = form;
  const renglonSeleccionado = watch('renglon');
  const tieneAntiguedad = watch('tiene_antiguedad');
  
  const wSalario = parseFloat(watch('salario') || '0');
  const wBono = parseFloat(watch('bonificacion') || '0');
  const wUnidades = parseFloat(watch('unidades_tiempo') || '0');
  const wAntiguedad = parseFloat(watch('antiguedad') || '0');

  useEffect(() => {
    if (isOpen && dependencia) {
      const montoAntiguedad = (dependencia as any).antiguedad;
      const hasAntiguedad = montoAntiguedad && montoAntiguedad > 0;

      reset({
        renglon: dependencia.renglon || "",
        salario: (dependencia.salario !== null && dependencia.salario !== undefined) ? String(dependencia.salario) : "",
        bonificacion: (dependencia.bonificacion !== null && dependencia.bonificacion !== undefined) ? String(dependencia.bonificacion) : "",
        unidades_tiempo: (dependencia.unidades_tiempo !== null && dependencia.unidades_tiempo !== undefined) ? String(dependencia.unidades_tiempo) : "",
        prima: dependencia.prima || false,
        tiene_antiguedad: !!hasAntiguedad,
        antiguedad: hasAntiguedad ? String(montoAntiguedad) : "",
      });
    } else if (!isOpen) {
      reset({ 
        renglon: "", 
        salario: "", 
        bonificacion: "", 
        unidades_tiempo: "", 
        prima: false,
        tiene_antiguedad: false,
        antiguedad: "" 
      });
    }
  }, [isOpen, dependencia, reset]);

  const renglonActivo = renglonSeleccionado;
  const configActual = renglonActivo ? renglonConfig[renglonActivo] : null;

  const handleRenglonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    form.setValue('renglon', newValue);

    const config = renglonConfig[newValue];
    if (config) {
        if (!config.tieneBono) setValue('bonificacion', "");
        if (!config.admiteAntiguedad) {
            setValue('tiene_antiguedad', false);
            setValue('antiguedad', "");
        }

        if (config.defaultSalario) setValue('salario', config.defaultSalario);
        else setValue('salario', "");

        if (config.defaultBono) setValue('bonificacion', config.defaultBono);
        else if (config.tieneBono) setValue('bonificacion', "");

        if (config.defaultUnidades) setValue('unidades_tiempo', config.defaultUnidades);
        else setValue('unidades_tiempo', "");
    }
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: any, isInteger: boolean = false) => {
    const val = e.target.value;
    const regex = isInteger ? /^\d*$/ : /^\d*\.?\d*$/;
    if (val === '' || regex.test(val)) field.onChange(val);
  };

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    if (!data.renglon) return;
    onSubmit({
      renglon: data.renglon,
      salario: data.salario ? parseFloat(data.salario) : 0,
      bonificacion: (configActual?.tieneBono && data.bonificacion) ? parseFloat(data.bonificacion) : 0,
      unidades_tiempo: (configActual?.requiereUnidades && data.unidades_tiempo) ? parseInt(data.unidades_tiempo) : 0,
      prima: data.prima || false,
      antiguedad: (configActual?.admiteAntiguedad && data.tiene_antiguedad && data.antiguedad) ? parseFloat(data.antiguedad) : 0,
    });
  };

  const handleDelete = () => {
    onSubmit({
      renglon: "",
      salario: 0,
      bonificacion: 0,
      unidades_tiempo: 0,
      prima: false,
      antiguedad: 0,
    });
    onClose();
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);
  };

  const multiplicador = (configActual?.requiereUnidades && wUnidades) ? wUnidades : 1;
  const totalBase = wSalario * multiplicador;
  const totalBono = wBono * multiplicador;
  const totalAntiguedad = (tieneAntiguedad && wAntiguedad) ? wAntiguedad : 0;
  const granTotal = totalBase + totalBono + totalAntiguedad;

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
                <form onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="renglon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renglón Presupuestario</FormLabel>
                          <FormControl>
                            <select
                              value={field.value}
                              onChange={handleRenglonChange}
                              className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            >
                              <option value="" disabled className="dark:bg-slate-800">Seleccione un renglón...</option>
                              <optgroup label="NOMBRAMIENTO" className="dark:bg-slate-800">
                                {Object.entries(nombramientoRenglones).map(([k, v]) => (
                                  <option key={k} value={k} className="dark:bg-slate-800">{k} - {v}</option>
                                ))}
                              </optgroup>
                              <optgroup label="CONTRATO" className="dark:bg-slate-800">
                                {Object.entries(contratoRenglones).map(([k, v]) => (
                                  <option key={k} value={k} className="dark:bg-slate-800">{k} - {v}</option>
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50/50 border-gray-200 dark:bg-slate-700/30 dark:border-slate-600">
                          <FormLabel className="text-sm font-normal">Prima de Fianza</FormLabel>
                          <FormControl>
                            <label htmlFor="toggle-prima" className="flex items-center cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  id="toggle-prima"
                                  className="sr-only peer"
                                  checked={!!field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                />
                                <div className="block h-5 w-9 rounded-full bg-gray-200 dark:bg-slate-600 peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-all duration-200 peer-checked:translate-x-4"></div>
                              </div>
                            </label>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {configActual?.admiteAntiguedad && (
                    <div className="md:col-span-2 space-y-3 p-3 border border-indigo-100 rounded-lg bg-indigo-50/30 dark:bg-indigo-900/20 dark:border-indigo-800/50">
                       <FormField
                        control={form.control}
                        name="tiene_antiguedad"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between mb-0">
                            <FormLabel className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Bono por Antigüedad</FormLabel>
                            <FormControl>
                              <label htmlFor="toggle-antiguedad" className="flex items-center cursor-pointer">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    id="toggle-antiguedad"
                                    className="sr-only peer"
                                    checked={!!field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                  />
                                  <div className="block h-5 w-9 rounded-full bg-gray-200 dark:bg-slate-600 peer-checked:bg-indigo-600 transition-colors duration-200"></div>
                                  <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-all duration-200 peer-checked:translate-x-4"></div>
                                </div>
                              </label>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <AnimatePresence>
                        {tieneAntiguedad && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                             <FormField
                                control={form.control}
                                name="antiguedad"
                                render={({ field }) => (
                                  <FormItem className="pt-2">
                                    <FormLabel className="text-xs text-indigo-600 dark:text-indigo-400">Monto Antigüedad</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">Q</span>
                                        <Input
                                          {...field}
                                          className="pl-7 border-indigo-200 focus:border-indigo-400 dark:bg-slate-900 dark:border-indigo-800 dark:text-slate-100"
                                          placeholder="0.00"
                                          onChange={(e) => handleNumericChange(e, field)}
                                          value={field.value}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {configActual && (
                    <>
                      {configActual.requiereUnidades && (
                         <div className="md:col-span-2">
                           <FormField
                            control={form.control}
                            name="unidades_tiempo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-blue-600 font-semibold">{configActual.unidadesLabel}</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    inputMode="numeric"
                                    placeholder={configActual.unidadesLabel}
                                    onChange={(e) => handleNumericChange(e, field, true)}
                                    value={field.value}
                                    className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                         </div>
                      )}

                      <FormField
                        control={form.control}
                        name="salario"
                        render={({ field }) => (
                          <FormItem className={configActual.tieneBono ? "" : "md:col-span-2"}>
                            <FormLabel className="text-xs">{configActual.salarioLabel}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">Q</span>
                                <Input
                                  {...field}
                                  className="pl-7 dark:bg-slate-900 dark:border-slate-700"
                                  placeholder={configActual.placeholder}
                                  onChange={(e) => handleNumericChange(e, field)}
                                  value={field.value}
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
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">Q</span>
                                  <Input
                                    {...field}
                                    className="pl-7 dark:bg-slate-900 dark:border-slate-700"
                                    placeholder="Bonificación"
                                    onChange={(e) => handleNumericChange(e, field)}
                                    value={field.value}
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
                  
                  {configActual && granTotal > 0 && (
                     <div className="md:col-span-2 mt-4 space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                          <span>Total Salario Base:</span>
                          <span className="font-medium">{formatMoney(totalBase)}</span>
                        </div>
                        {totalBono > 0 && (
                          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                            <span>Total Bonificación:</span>
                            <span className="font-medium">{formatMoney(totalBono)}</span>
                          </div>
                        )}
                        {totalAntiguedad > 0 && (
                          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                            <span>Antigüedad:</span>
                            <span className="font-medium">{formatMoney(totalAntiguedad)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center">
                           <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">Total Estimado Mensual</span>
                           <span className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                              {formatMoney(granTotal)}
                           </span>
                        </div>
                     </div>
                  )}

                  <div className="flex justify-between items-center pt-4 md:col-span-2 mt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Info
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!renglonSeleccionado}>
                        Guardar Información
                        </Button>
                    </div>
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