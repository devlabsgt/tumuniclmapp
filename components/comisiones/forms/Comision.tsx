'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { comisionSchema, ComisionFormData } from '@/lib/comisiones/esquemas';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Calendario from '@/components/ui/Calendario';
import { ComisionConFechaYHoraSeparada, Asistente } from '@/hooks/comisiones/useObtenerComisiones';
import { motion, AnimatePresence } from 'framer-motion';
import Comentarios from './Comentarios';
import Asistentes from './Asistentes';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import Dimg from '../downloads/Dimg';

const customToast = (color: string) => Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
    const progressBar = toast.querySelector('.swal2-timer-progress-bar') as HTMLElement;
    if (progressBar) {
      progressBar.style.backgroundColor = color;
    }
  }
});

interface ComisionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  usuarios: Usuario[];
  comisionAEditar?: ComisionConFechaYHoraSeparada | null;
}

export default function ComisionForm({ isOpen, onClose, onSave, usuarios, comisionAEditar }: ComisionFormProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const dimgRef = useRef<HTMLDivElement>(null);

  const methods = useForm<ComisionFormData>({
    resolver: zodResolver(comisionSchema),
    defaultValues: { titulo: '', comentarios: [], hora: '08', minuto: '00', periodo: 'AM', encargadoId: '', userIds: [] },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = methods;

  useEffect(() => {
    if (isOpen) {
      if (comisionAEditar) {
        const encargado = comisionAEditar.asistentes?.find((a: Asistente) => a.encargado) || null;
        const asistentes = comisionAEditar.asistentes?.filter((a: Asistente) => !a.encargado) || [];
        const date = parseISO(comisionAEditar.fecha_hora);
        const hour = date.getHours();
        const minute = date.getMinutes();
        const periodo = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        reset({
          titulo: comisionAEditar.titulo,
          comentarios: comisionAEditar.comentarios,
          hora: displayHour.toString().padStart(2, '0'),
          minuto: minute.toString().padStart(2, '0'),
          periodo: periodo,
          encargadoId: encargado?.id || '',
          userIds: asistentes.map(a => a.id),
        });
        setFechaSeleccionada(format(date, 'yyyy-MM-dd'));
      } else {
        reset({ titulo: '', comentarios: [], hora: '08', minuto: '00', periodo: 'AM', encargadoId: '', userIds: [] });
        setFechaSeleccionada(format(new Date(), 'yyyy-MM-dd'));
      }
    }
  }, [comisionAEditar, isOpen, reset]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);


  const onSubmit = async (formData: ComisionFormData) => {
    const { encargadoId } = formData;
    if (!encargadoId) {
      customToast('#f97316').fire({ icon: 'warning', title: 'Debe asignar un encargado.' });
      return;
    }

    let hour24 = parseInt(formData.hora);
    if (formData.periodo === 'PM' && hour24 !== 12) hour24 += 12;
    if (formData.periodo === 'AM' && hour24 === 12) hour24 = 0;

    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fechaHora = new Date(year, month - 1, day, hour24, parseInt(formData.minuto));

    const datosComision = {
      titulo: formData.titulo,
      comentarios: formData.comentarios,
      fecha_hora: fechaHora.toISOString(),
      encargadoId: formData.encargadoId,
      userIds: formData.userIds,
      ...(comisionAEditar && { id: comisionAEditar.id }),
    };

    try {
      const response = await fetch('/api/users/comision', {
        method: comisionAEditar ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosComision),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al guardar la comisión.');
      }
      
      customToast(comisionAEditar ? '#3b82f6' : '#22c55e').fire({
        icon: 'success',
        title: comisionAEditar ? 'Comisión actualizada!' : 'Comisión creada!'
      });
      
      onSave();
      onClose();

    } catch (error: any) {
      customToast('#ef4444').fire({ icon: 'error', title: error.message });
    }
  };

  const handleGenerateImage = async () => {
    if (!comisionAEditar) return;
    setIsGenerating(true);
    setTimeout(async () => {
      if (dimgRef.current) {
        try {
          const canvas = await html2canvas(dimgRef.current, { scale: 2, useCORS: true });
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank')?.focus();
            }
          }, 'image/png');
        } catch (error) {
          customToast('#ef4444').fire({ icon: 'error', title: 'No se pudo generar el resumen.' });
        }
      }
      setIsGenerating(false);
    }, 50);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {comisionAEditar ? 'Editar Comisión' : 'Nueva Comisión'}
                  </h2>
                  <Button variant="ghost" className="text-gray-500 hover:bg-gray-200 p-2" onClick={onClose} aria-label="Cerrar">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col gap-6 pb-4">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col gap-6 md:w-1/2">
                        <div>
                          <Input {...register("titulo")} placeholder="Título de la Comisión" className={errors.titulo ? 'border-red-500' : ''} />
                          {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
                        </div>
                        <div className='flex justify-center self-start'>
                          <Calendario fechaSeleccionada={fechaSeleccionada} onSelectDate={setFechaSeleccionada} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <select {...register("hora")} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (<option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>))}
                            </select>
                            <span>:</span>
                            <select {...register("minuto")} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                              {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (<option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>))}
                            </select>
                            <select {...register("periodo")} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 md:w-1/2">
                        <Asistentes usuarios={usuarios} />
                      </div>
                    </div>

                    <Comentarios />
                    
                    <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 mt-auto">
                      {comisionAEditar && (
                        <Button type="button" variant="outline" onClick={handleGenerateImage} disabled={isGenerating}>
                          {isGenerating ? 'Generando...' : 'Ver resumen'}
                        </Button>
                      )}
                      <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSubmitting ? 'Guardando...' : comisionAEditar ? 'Guardar Cambios' : 'Crear Comisión'}
                      </Button>
                    </div>
                  </form>
                </FormProvider>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isGenerating && comisionAEditar && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={dimgRef}>
            <Dimg comision={comisionAEditar} usuarios={usuarios} />
          </div>
        </div>
      )}
    </>
  );
}