'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { crearAgenda, editarAgenda, type AgendaConcejo, getTodayDate } from '../lib/acciones';
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
      // SOLUCIÓN: Usar una hora fija por defecto en lugar de la actual.
      hora_reunion: '08:00',
    }
  });

  const actaForm = watch('acta');
  const libroForm = watch('libro');
  const horaReunionForm = watch('hora_reunion');

  useEffect(() => {
    if (actaForm && libroForm) {
      setValue('descripcion', `ACTA ${actaForm}, LIBRO ${libroForm}`);
    } else {
      setValue('descripcion', '');
    }
  }, [actaForm, libroForm, setValue]);
  
  // Lógica para llenar o limpiar el formulario
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && agendaAEditar) {
        const { acta, libro } = parseDescripcion(agendaAEditar.descripcion);
        reset({
          titulo: agendaAEditar.titulo,
          descripcion: agendaAEditar.descripcion,
          acta: acta,
          libro: libro,
          fecha_reunion: agendaAEditar.fecha_reunion.split('T')[0],
          hora_reunion: agendaAEditar.fecha_reunion.split('T')[1].substring(0, 5),
        });
      } else {
        reset({
          titulo: '',
          descripcion: '',
          acta: '',
          libro: '',
          fecha_reunion: getTodayDate(),
          hora_reunion: '08:00', // Usar la misma hora fija al resetear
        });
      }
    }
  }, [isOpen, reset, isEditMode, agendaAEditar]);

  // SOLUCIÓN: Lógica de la hora simplificada para evitar bucles infinitos
  const [h24, m] = horaReunionForm.split(':').map(Number);
  const periodo = h24 >= 12 ? 'PM' : 'AM';
  let hora12 = h24 % 12;
  if (hora12 === 0) hora12 = 12;

  const handleTimeChange = (newHour: number, newMinute: number, newPeriod: string) => {
    let newH24 = newHour;
    if (newPeriod === 'PM' && newHour < 12) newH24 = newHour + 12;
    if (newPeriod === 'AM' && newHour === 12) newH24 = 0;
    
    const nuevaHoraForm = `${String(newH24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    setValue('hora_reunion', nuevaHoraForm, { shouldValidate: true });
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
                      <Input type="number" min="1" max="12" value={hora12} onChange={(e) => handleTimeChange(parseInt(e.target.value, 10) || 1, m, periodo)} className="w-20 text-center" />
                      <span>:</span>
                      <Input type="number" min="0" max="59" value={String(m).padStart(2, '0')} onChange={(e) => handleTimeChange(hora12, parseInt(e.target.value, 10) || 0, periodo)} className="w-20 text-center" />
                      <select value={periodo} onChange={(e) => handleTimeChange(hora12, m, e.target.value)} className={selectClassName}>
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