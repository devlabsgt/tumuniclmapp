// forms/Agenda.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { crearAgenda, editarAgenda, type AgendaFormData, type AgendaConsejo } from '../lib/acciones';
import { agendaSchema } from '../lib/esquemas';
import { toast } from 'react-toastify';
import { es } from 'date-fns/locale';
import {
  format,
  isToday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  agendaAEditar?: AgendaConsejo | null;
}

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CalendarioSelectorProps {
  fechaSeleccionada: string;
  onSelectDate: (date: string) => void;
}

const CalendarioSelector = ({ fechaSeleccionada, onSelectDate }: CalendarioSelectorProps) => {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date(fechaSeleccionada + 'T00:00:00'));

  const inicioDeMes = startOfMonth(fechaDeReferencia);
  const finDeMes = endOfMonth(fechaDeReferencia);
  const diasDelMes = eachDayOfInterval({ start: inicioDeMes, end: finDeMes });

  const irMesSiguiente = () => setFechaDeReferencia(addMonths(fechaDeReferencia, 1));
  const irMesAnterior = () => setFechaDeReferencia(subMonths(fechaDeReferencia, 1));

  const handleSeleccionFecha = (dia: Date) => {
    onSelectDate(format(dia, 'yyyy-MM-dd'));
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-center p-2 rounded-lg">
        <button type="button" onClick={irMesAnterior} className="p-2 rounded-full hover:bg-slate-200" aria-label="Mes anterior">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
        <div className='flex gap-2 text-lg lg:text-xl'>
          <span>{format(fechaDeReferencia, 'LLLL', { locale: es })}</span>
          <span>{format(fechaDeReferencia, 'yyyy')}</span>
        </div>
        <button type="button" onClick={irMesSiguiente} className="p-2 rounded-full hover:bg-slate-200" aria-label="Siguiente mes">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((dia) => (
          <span key={dia} className="text-xs uppercase font-semibold text-gray-500">{dia}</span>
        ))}
        {Array.from({ length: inicioDeMes.getDay() === 0 ? 6 : inicioDeMes.getDay() - 1 }, (_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8"></div>
        ))}
        {diasDelMes.map((dia) => {
          const isSelected = isSameDay(dia, new Date(fechaSeleccionada + 'T00:00:00'));
          const isTodayDate = isToday(dia);
          const isPastDate = dia.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
          return (
            <button
              type="button"
              key={dia.toString()}
              onClick={() => handleSeleccionFecha(dia)}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer text-sm
                ${isPastDate && isSelected ? 'bg-slate-200 text-slate-600' : ''}
                ${isPastDate && !isSelected ? 'text-slate-600' : ''}
                ${!isPastDate && isSelected ? 'bg-blue-600 text-white' : ''}
                ${isTodayDate && !isSelected ? 'bg-blue-100 text-blue-800' : ''}
                ${!isPastDate && !isSelected && !isTodayDate ? 'hover:bg-slate-100 text-slate-600' : ''}
              `}
            >
              {format(dia, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default function Agenda({ isOpen, onClose, onSave, agendaAEditar }: Props) {
  const isEditMode = !!agendaAEditar;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      titulo: isEditMode ? agendaAEditar.titulo : '',
      fecha_reunion: isEditMode ? agendaAEditar.fecha_reunion : getTodayDate(),
    }
  });

  const fechaReunion = watch('fecha_reunion');

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          titulo: agendaAEditar.titulo,
          fecha_reunion: agendaAEditar.fecha_reunion,
        });
      } else {
        reset({
          titulo: '',
          fecha_reunion: getTodayDate(),
        });
      }
    }
  }, [isOpen, reset, isEditMode, agendaAEditar]);

  const onSubmit = async (formData: AgendaFormData) => {
    let result = null;
    if (isEditMode) {
        result = await editarAgenda(agendaAEditar!.id, formData);
    } else {
        result = await crearAgenda(formData);
    }
    
    if (result) {
      onSave();
      onClose();
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
            className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
          >
            <div className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {isEditMode ? 'Editar Agenda' : 'Crear Nueva Agenda'}
                  </h3>

                  <div>
                    <Input
                      id="titulo"
                      {...register("titulo")}
                      placeholder="Ej. Nombre: Sesión Ordinaria de agosto"
                      className={errors.titulo ? 'border-red-500' : ''}
                    />
                    {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
                  </div>
                  
                  <div>
                    <CalendarioSelector
                      fechaSeleccionada={fechaReunion}
                      onSelectDate={(date) => setValue('fecha_reunion', date, { shouldValidate: true })}
                    />
                    {errors.fecha_reunion && <p className="text-sm text-red-500 mt-1">{errors.fecha_reunion.message}</p>}
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
