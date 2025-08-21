'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { crearAgenda, editarAgenda, type AgendaFormData, type AgendaConcejo, getTodayDate, getNowTime } from '../lib/acciones';
import { agendaSchema } from '../lib/esquemas';

import Calendario from '@/components/ui/Calendario';

interface AgendaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  agendaAEditar?: AgendaConcejo | null;
}

export default function Agenda({ isOpen, onClose, onSave, agendaAEditar }: AgendaProps) {
  const isEditMode = !!agendaAEditar;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      titulo: isEditMode ? agendaAEditar.titulo : '',
      descripcion: isEditMode ? agendaAEditar.descripcion : '',
      fecha_reunion: isEditMode ? agendaAEditar.fecha_reunion.split('T')[0] : getTodayDate(),
      hora_reunion: isEditMode ? agendaAEditar.fecha_reunion.split('T')[1].substring(0, 5) : getNowTime(),
    }
  });

  const fechaReunion = watch('fecha_reunion');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          titulo: agendaAEditar.titulo,
          descripcion: agendaAEditar.descripcion,
          fecha_reunion: agendaAEditar.fecha_reunion.split('T')[0],
          hora_reunion: agendaAEditar.fecha_reunion.split('T')[1].substring(0, 5),
        });
      } else {
        reset({
          titulo: '',
          descripcion: '',
          fecha_reunion: getTodayDate(),
          hora_reunion: getNowTime(),
        });
      }
    }
  }, [isOpen, reset, isEditMode, agendaAEditar]);

  const onSubmit = async (formData: AgendaFormData) => {
    let result = null;
    const combinedFormData = {
      ...formData,
      fecha_reunion: `${formData.fecha_reunion}T${formData.hora_reunion}:00-06:00`,
    };

    if (isEditMode) {
        result = await editarAgenda(agendaAEditar!.id, combinedFormData);
    } else {
        result = await crearAgenda(combinedFormData);
    }
    
    if (result) {
      onSave();
      onClose();
    }
  };

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
            className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
          >
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {isEditMode ? 'Editar Sesión' : 'Crear Nueva Sesión'}
                  </h3>

                  <div>
                    <Input
                      id="titulo"
                      {...register("titulo")}
                      placeholder="Ej. Nombre: Sesión Ordinaria de enero"
                      className={errors.titulo ? 'border-red-500' : ''}
                    />
                    {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
                  </div>

                  <div>
                    <textarea
                      id="descripcion"
                      {...register('descripcion')}
                      placeholder="Agregue una descripción..."
                      rows={4}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.descripcion ? 'border-red-500' : ''}`}
                    />
                    {errors.descripcion && <p className="text-sm text-red-500 mt-1">{errors.descripcion.message}</p>}
                  </div>
                  
                  <div>
                    <Calendario
                      fechaSeleccionada={watch('fecha_reunion')}
                      onSelectDate={(date) => setValue('fecha_reunion', date, { shouldValidate: true })}
                    />
                    {errors.fecha_reunion && <p className="text-sm text-red-500 mt-1">{errors.fecha_reunion.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="hora_reunion" className="block text-sm font-medium text-gray-700">Hora de la reunión</label>
                    <Input
                      id="hora_reunion"
                      type="time"
                      {...register("hora_reunion")}
                      className={`mt-1 ${errors.hora_reunion ? 'border-red-500' : ''}`}
                    />
                    {errors.hora_reunion && <p className="text-sm text-red-500 mt-1">{errors.hora_reunion.message}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="w-1/2">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 w-1/2">
                    {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Agenda')}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}