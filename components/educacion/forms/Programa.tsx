'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { programaSchema, type Programa as ProgramaType } from '../lib/esquemas';
import { toast } from 'react-toastify';

type ProgramaFormData = z.infer<typeof programaSchema>;

interface Lugar {
  id: number;
  nombre: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  programaAEditar?: ProgramaType | null;
  programaPadreId?: number | null;
}

export default function Programa({ isOpen, onClose, onSave, programaAEditar, programaPadreId }: Props) {
  const isEditMode = !!programaAEditar;
  const isNivel = !!programaPadreId || (isEditMode && !!programaAEditar?.parent_id);
  
  const [lugares, setLugares] = useState<Lugar[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProgramaFormData>({
    resolver: zodResolver(programaSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const supabase = createClient();
      
      const fetchInitialData = async () => {
        const { data: lugaresData, error: lugaresError } = await supabase.from('lugares_clm').select('id, nombre').order('nombre');
        if (lugaresError) toast.error("No se pudieron cargar los lugares.");
        else setLugares(lugaresData as Lugar[]);

        if (programaAEditar) {
            reset(programaAEditar);
        } else {
            reset({
                nombre: '',
                descripcion: '',
                anio: new Date().getFullYear(),
                parent_id: programaPadreId || null,
                lugar: '',
            });
        }
      };

      fetchInitialData();
    }
  }, [isOpen, programaAEditar, programaPadreId, reset]);

  const onSubmit = async (formData: ProgramaFormData) => {
    const supabase = createClient();
    if (isEditMode) {
      const { error } = await supabase.from('programas_educativos').update(formData).eq('id', programaAEditar!.id);
      if (error) {
        toast.error(`Error al actualizar: ${error.message}`);
      } else {
        toast.success('Registro actualizado correctamente.');
        onSave();
      }
    } else {
      if (!formData.parent_id) {
        const { data: existente } = await supabase.from('programas_educativos').select('id').eq('nombre', formData.nombre).eq('anio', formData.anio).single();
        if (existente) {
          toast.error(`Ya existe un programa con el nombre "${formData.nombre}" en el año ${formData.anio}.`);
          return;
        }
      }
      const { error } = await supabase.from('programas_educativos').insert(formData);
      if (error) {
        toast.error(`Error al crear: ${error.message}`);
      } else {
        toast.success(`Registro creado correctamente.`);
        onSave();
      }
    }
  };
  
  const generateYearOptions = () => {
    const years = [];
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 1;
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };
  const yearOptions = generateYearOptions();

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-50 dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {isEditMode ? 'Editar' : (isNivel ? 'Nuevo Nivel' : 'Nuevo Programa')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Proporcione los detalles requeridos.</p>
            </div>
            <Button 
                size="icon" 
                variant="ghost" 
                onClick={onClose} 
                className="rounded-full -mt-2 -mr-2 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <Input 
                    id="nombre" 
                    {...register("nombre")} 
                    placeholder="Nombre del programa o nivel" 
                    className={`dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100 dark:placeholder-gray-500 ${errors.nombre ? 'border-red-500' : ''}`} 
                />
                {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <Input 
                    id="descripcion" 
                    {...register("descripcion")} 
                    placeholder="Descripción breve" 
                    className={`dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100 dark:placeholder-gray-500 ${errors.descripcion ? 'border-red-500' : ''}`} 
                />
                {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion.message}</p>}
              </div>
              
              {isNivel && (
                <div>
                  <label htmlFor="lugar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar</label>
                  <select 
                    id="lugar" 
                    {...register("lugar")} 
                    className={`w-full h-10 rounded-md border border-gray-300 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lugar ? 'border-red-500' : ''}`}
                  >
                    <option value="">-- Seleccione un lugar --</option>
                    {lugares.map(lugar => (<option key={lugar.id} value={lugar.nombre}>{lugar.nombre}</option>))}
                  </select>
                  {errors.lugar && <p className="text-sm text-red-500 mt-1">{errors.lugar.message}</p>}
                </div>
              )}

              <div>
                <label htmlFor="anio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
                <select 
                    id="anio" 
                    {...register("anio", { valueAsNumber: true })} 
                    className={`w-full h-10 rounded-md border border-gray-300 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.anio ? 'border-red-500' : ''}`}
                >
                  {yearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
                {errors.anio && <p className="text-sm text-red-500 mt-1">{errors.anio.message}</p>}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="dark:bg-transparent dark:text-gray-300 dark:border-neutral-600 dark:hover:bg-neutral-800"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}