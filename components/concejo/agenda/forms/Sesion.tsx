'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { crearAgenda, editarAgenda, getTodayDate } from '../lib/acciones';
import {type AgendaConcejo } from '../lib/esquemas';
import { parseISO, getHours, getMinutes, format } from 'date-fns';

import { sesionSchema, type SesionFormData } from '../lib/esquemas';
import Calendario from '@/components/ui/Calendario';

interface SesionProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  agendaAEditar?: AgendaConcejo | null;
}

const parseDescripcion = (descripcion: string) => {
  if (!descripcion) return { acta: '', libro: '' };
  const match = descripcion.match(/ACTA (.*), LIBRO (.*)/);
  if (match && match.length === 3) {
    return { acta: match[1], libro: match[2] };
  }
  return { acta: '', libro: '' };
};

// Función de ayuda para convertir de 24h a 12h
const convert24to12 = (h24: number): { hora12: string; periodo: string } => {
  const periodo = h24 >= 12 ? 'PM' : 'AM';
  let hora12 = h24 % 12;
  if (hora12 === 0) hora12 = 12;
  return { hora12: String(hora12).padStart(2, '0'), periodo };
};

// Función de ayuda para convertir de 12h a 24h
const convert12to24 = (hora12: string, periodo: string): string => {
  let h24 = parseInt(hora12, 10);
  if (periodo === 'PM' && h24 < 12) h24 += 12;
  if (periodo === 'AM' && h24 === 12) h24 = 0;
  return String(h24).padStart(2, '0');
};

export default function Sesion({ isOpen, onClose, onSave, agendaAEditar }: SesionProps) {
  const isEditMode = !!agendaAEditar;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<SesionFormData>({
    resolver: zodResolver(sesionSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      acta: '',
      libro: '',
      fecha_reunion: getTodayDate(),
      hora_reunion: '08:00',
    }
  });

  const [hora, setHora] = useState('08');
  const [minuto, setMinuto] = useState('00');
  const [periodo, setPeriodo] = useState('AM');

  const actaForm = watch('acta');
  const libroForm = watch('libro');

  useEffect(() => {
    if (actaForm && libroForm) {
      setValue('descripcion', `ACTA ${actaForm}, LIBRO ${libroForm}`);
    } else {
      setValue('descripcion', '');
    }
  }, [actaForm, libroForm, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && agendaAEditar) {
        const { acta, libro } = parseDescripcion(agendaAEditar.descripcion);
        const fechaHoraDB = parseISO(agendaAEditar.fecha_reunion);
        const h24 = getHours(fechaHoraDB);
        const m = getMinutes(fechaHoraDB);

        const { hora12: newHora12, periodo: newPeriodo } = convert24to12(h24);

        reset({
          titulo: agendaAEditar.titulo,
          descripcion: agendaAEditar.descripcion,
          acta: acta,
          libro: libro,
          fecha_reunion: format(fechaHoraDB, 'yyyy-MM-dd'),
          hora_reunion: `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        });

        setHora(newHora12);
        setMinuto(String(m).padStart(2, '0'));
        setPeriodo(newPeriodo);
      } else {
        reset({
          titulo: '',
          descripcion: '',
          acta: '',
          libro: '',
          fecha_reunion: getTodayDate(),
          hora_reunion: '08:00',
        });
        setHora('08');
        setMinuto('00');
        setPeriodo('AM');
      }
    }
  }, [isOpen, reset, isEditMode, agendaAEditar]);

  const handleTimeChange = (newHour: string, newMinute: string, newPeriod: string) => {
    const h24 = convert12to24(newHour, newPeriod);
    const nuevaHoraForm = `${h24}:${newMinute}`;
    setValue('hora_reunion', nuevaHoraForm, { shouldValidate: true });

    setHora(newHour);
    setMinuto(newMinute);
    setPeriodo(newPeriod);
  };

  const onSubmit = async (formData: SesionFormData) => {
    const combinedFormData = {
      ...formData,
      fecha_reunion: `${formData.fecha_reunion}T${formData.hora_reunion}:00-06:00`,
    };

    const result = isEditMode
      ? await editarAgenda(agendaAEditar!.id, combinedFormData as any)
      : await crearAgenda(combinedFormData as any);

    if (result) {
      onSave();
      onClose();
    }
  };

  const selectClassName = "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
          >
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <Input id="titulo" {...register("titulo")} placeholder="Ejemplo: Sesión Ordinaria de enero" className={errors.titulo ? 'border-red-500' : ''} />
                    {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="acta" className="block text-sm font-medium text-gray-700 mb-1">Acta</label>
                      <Input id="acta" {...register("acta")} placeholder="Ej. 1-2025" className={errors.acta ? 'border-red-500' : ''} />
                      {errors.acta && <p className="text-sm text-red-500 mt-1">{errors.acta.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="libro" className="block text-sm font-medium text-gray-700 mb-1">Libro</label>
                      <Input id="libro" {...register("libro")} placeholder="Ej. 01" className={errors.libro ? 'border-red-500' : ''} />
                      {errors.libro && <p className="text-sm text-red-500 mt-1">{errors.libro.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora de la reunión</label>
                    <div className="flex items-center gap-2">
                      <Input type="text" value={hora} onChange={(e) => handleTimeChange(e.target.value, minuto, periodo)} className="w-20 text-center" />
                      <span>:</span>
                      <Input type="text" value={minuto} onChange={(e) => handleTimeChange(hora, e.target.value, periodo)} className="w-20 text-center" />
                      <select value={periodo} onChange={(e) => handleTimeChange(hora, minuto, e.target.value)} className={selectClassName}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                    {errors.hora_reunion && <p className="text-sm text-red-500 mt-1">{errors.hora_reunion.message}</p>}
                  </div>

                  <div>
                   <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <Calendario fechaSeleccionada={watch('fecha_reunion')} onSelectDate={(date: string) => setValue('fecha_reunion', date, { shouldValidate: true })} />
                    {errors.fecha_reunion && <p className="text-sm text-red-500 mt-1">{errors.fecha_reunion.message}</p>}
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="w-1/2">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 w-1/2">
                    {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Sesión')}
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