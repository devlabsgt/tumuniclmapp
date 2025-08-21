'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { maestroSchema, type Maestro as MaestroType } from '../lib/esquemas';
import { toast } from 'react-toastify';
import { Label } from '@/components/ui/label';

type MaestroFormData = z.infer<typeof maestroSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  maestroAEditar?: MaestroType | null;
}

export default function Maestro({ isOpen, onClose, onSave, maestroAEditar }: Props) {
  const isEditMode = !!maestroAEditar;
  const [maestrosExistentes, setMaestrosExistentes] = useState<MaestroType[]>([]);
  const [nombreBusqueda, setNombreBusqueda] = useState('');
  const [maestroSeleccionado, setMaestroSeleccionado] = useState<MaestroType | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<MaestroFormData>({
    resolver: zodResolver(maestroSchema),
    defaultValues: {
      nombre: '',
      ctd_alumnos: 0,
    }
  });

  const nombreWatch = watch("nombre");

  useEffect(() => {
    if (!isEditMode) {
      const fetchMaestros = async () => {
        const supabase = createClient();
        const { data, error } = await supabase.from('maestros_municipales').select('id, nombre, ctd_alumnos');
        if (error) {
          toast.error(`Error al cargar maestros: ${error.message}`);
        } else {
          setMaestrosExistentes(data as MaestroType[]);
        }
      };
      fetchMaestros();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isOpen) {
      if (maestroAEditar) {
        reset(maestroAEditar);
      } else {
        reset({
          nombre: '',
          ctd_alumnos: 0,
        });
        setMaestroSeleccionado(null);
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

  const handleSelectMaestro = (maestro: MaestroType) => {
    setMaestroSeleccionado(maestro);
    setValue('nombre', maestro.nombre, { shouldValidate: true });
    setValue('ctd_alumnos', maestro.ctd_alumnos, { shouldValidate: true });
  };

  const maestrosFiltrados = !isEditMode && nombreWatch 
    ? maestrosExistentes.filter(m => m.nombre.toLowerCase().includes(nombreWatch.toLowerCase()))
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-0 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
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
              <Label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</Label>
              <div className="relative">
                <Input 
                  id="nombre" 
                  {...register("nombre")} 
                  placeholder="Nombre del maestro" 
                  className={errors.nombre ? 'border-red-500' : ''} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setValue("nombre", value);
                    if (!isEditMode) {
                       setMaestroSeleccionado(null);
                    }
                  }}
                  disabled={!!maestroSeleccionado && !isEditMode} // <-- Lógica corregida
                />
                <AnimatePresence>
                  {!isEditMode && nombreWatch && maestrosFiltrados.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {maestrosFiltrados.map(maestro => (
                        <li 
                          key={maestro.id}
                          onClick={() => handleSelectMaestro(maestro)}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        >
                          {maestro.nombre}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
                {!isEditMode && maestroSeleccionado && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="ctd_alumnos" className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Alumnos</Label>
              <Input 
                id="ctd_alumnos" 
                type="number"
                {...register("ctd_alumnos", { valueAsNumber: true })} 
                placeholder="0" 
                className={errors.ctd_alumnos ? 'border-red-500' : ''} 
                disabled={!isEditMode && !!maestroSeleccionado}
              />
              {errors.ctd_alumnos && <p className="text-sm text-red-500 mt-1">{errors.ctd_alumnos.message}</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !!maestroSeleccionado && !isEditMode} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}