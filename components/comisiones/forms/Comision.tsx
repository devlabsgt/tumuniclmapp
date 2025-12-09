'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { comisionSchema, ComisionFormData } from '@/lib/comisiones/esquemas';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CalendarioComisiones from '../CalendarioComisiones';
import { ComisionConFechaYHoraSeparada, Asistente } from '@/hooks/comisiones/useObtenerComisiones';
import { motion, AnimatePresence } from 'framer-motion';
import Comentarios from './Comentarios';
import Asistentes from './Asistentes';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import useUserData from '@/hooks/sesion/useUserData';

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
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<Date[]>([new Date()]);
  const { rol, esjefe } = useUserData();

  const methods = useForm<ComisionFormData>({
    resolver: zodResolver(comisionSchema),
    defaultValues: { titulo: '', comentarios: [], hora: '08', minuto: '00', periodo: 'AM', encargadoId: '', userIds: [] },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = methods;

  useEffect(() => {
    if (isOpen) {
      if (comisionAEditar) {
        const encargado = comisionAEditar.asistentes?.find((a: Asistente) => a.encargado) || null;
        const asistentes = comisionAEditar.asistentes?.filter((a: Asistente) => !a.encargado) || [];
        
        const fechaHoraISO = comisionAEditar.fecha_hora.replace(' ', 'T');
        const date = parseISO(fechaHoraISO);

        const hour12 = parseInt(format(date, 'h'));
        const minute = parseInt(format(date, 'mm'));
        const periodo = format(date, 'aa');

        reset({
          titulo: comisionAEditar.titulo,
          comentarios: comisionAEditar.comentarios,
          hora: hour12.toString().padStart(2, '0'),
          minuto: minute.toString().padStart(2, '0'),
          periodo: periodo.toUpperCase() as 'AM' | 'PM', 
          encargadoId: encargado?.id || '',
          userIds: asistentes.map(a => a.id),
        });
        setFechasSeleccionadas([date]);
      } else {
        reset({ titulo: '', comentarios: [], hora: '08', minuto: '00', periodo: 'AM', encargadoId: '', userIds: [] });
        setFechasSeleccionadas([new Date()]);
      }
    }
  }, [comisionAEditar, isOpen, reset]);

  const sendPushNotification = async (titulo: string, mensaje: string, userIds: string[]) => {
    try {
      if (userIds.length === 0) return;

      await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titulo,
          message: mensaje,
          targetIds: userIds
        })
      });
    } catch (error) {
      console.error('Error enviando notificación push:', error);
    }
  };

  const onSubmit = async (formData: ComisionFormData) => {
    const { encargadoId } = formData;
    if (!encargadoId) {
      customToast('#f97316').fire({ icon: 'warning', title: 'Debe asignar un encargado.' });
      return;
    }

    if (!fechasSeleccionadas || fechasSeleccionadas.length === 0) {
      customToast('#f97316').fire({ icon: 'warning', title: 'Debe seleccionar al menos una fecha.' });
      return;
    }

    let hour24 = parseInt(formData.hora, 10);
    if (formData.periodo === 'PM' && hour24 < 12) {
      hour24 += 12;
    } else if (formData.periodo === 'AM' && hour24 === 12) { 
      hour24 = 0;
    }
    const minute = parseInt(formData.minuto, 10);

    const esAdminSuperior = rol === 'SUPER' || rol === 'RRHH' || rol === 'SECRETARIO';
    
const destinatariosNotificacion = Array.from(new Set([formData.encargadoId, ...(formData.userIds || [])]));
    try {
      if (comisionAEditar) {
        const fecha = fechasSeleccionadas[0];
        const fechaHora = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), hour24, minute);

        let aprobado = esAdminSuperior;
        if (esjefe) {
          aprobado = false;
        }

        const datosComision = {
          titulo: formData.titulo,
          comentarios: formData.comentarios,
          fecha_hora: fechaHora.toISOString(),
          encargadoId: formData.encargadoId,
          userIds: formData.userIds,
          aprobado: aprobado,
          id: comisionAEditar.id,
        };

        const response = await fetch('/api/users/comision', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosComision),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error al guardar la comisión.');
        }

        sendPushNotification(
          'Comisión Actualizada', 
          `Se han realizado cambios en la comisión: "${formData.titulo}". Haz click para ver los detalles.`,
          destinatariosNotificacion
        );
        
        if (esjefe) {
          const titulo = 'Comisión Editada con Éxito';
          await Swal.fire({
            icon: 'success',
            title: titulo,
            text: 'Debe de ser aprobada por Recursos Humanos antes de estar disponible.'
          });
        } else if (esAdminSuperior) {
          const titulo = 'Comisión Actualizada y Aprobada';
          await Swal.fire({
            icon: 'success',
            title: titulo,
            text: 'La comisión ha sido guardada y aprobada exitosamente.'
          });
        } else {
          customToast('#3b82f6').fire({
            icon: 'success',
            title: 'Comisión actualizada!'
          });
        }
        
      } else {
        
        const promesasDeCreacion = fechasSeleccionadas.map(fecha => {
          const fechaHora = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), hour24, minute);

          const datosComision = {
            titulo: formData.titulo,
            comentarios: formData.comentarios,
            fecha_hora: fechaHora.toISOString(),
            encargadoId: formData.encargadoId,
            userIds: formData.userIds,
            aprobado: esAdminSuperior,
          };

          return fetch('/api/users/comision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosComision),
          });
        });

        const responses = await Promise.all(promesasDeCreacion);

        const fallidas = responses.filter(res => !res.ok);
        if (fallidas.length > 0) {
          const errorData = await fallidas[0].json().catch(() => ({}));
          throw new Error(errorData.error || `Error al crear ${fallidas.length} de ${responses.length} comisiones.`);
        }

        sendPushNotification(
          'Nueva Comisión Asignada', 
          `Se te ha asignado a la nueva comisión: "${formData.titulo}". Haz click para ver los detalles.`,
          destinatariosNotificacion
        );
        
        const numComisiones = fechasSeleccionadas.length;
        const plural = numComisiones > 1;

        if (esjefe) {
          await Swal.fire({
            icon: 'success',
            title: `¡${numComisiones} Comisi${plural ? 'ones Creadas' : 'ón Creada'}!`,
            text: `Debe${plural ? 'n' : ''} ser aprobad${plural ? 'as' : 'a'} por Recursos Humanos.`
          });
        } else if (esAdminSuperior) {
          await Swal.fire({
            icon: 'success',
            title: `¡${numComisiones} Comisi${plural ? 'ones Guardadas' : 'ón Guardada'}!`,
            text: `La${plural ? 's' : ''} comisi${plural ? 'ones' : 'ón'} ha${plural ? 'n' : ''} sido guardad${plural ? 'as' : 'a'} y aprobad${plural ? 'as' : 'a'} exitosamente.`
          });
        } else {
          customToast('#22c55e').fire({
            icon: 'success',
            title: `¡${numComisiones} Comisi${plural ? 'ones Creadas' : 'ón Creada'}!`
          });
        }
      }
      
      onSave();
      onClose();

    } catch (error: any) {
      customToast('#ef4444').fire({ icon: 'error', title: error.message });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-slate-50 rounded-xl border border-gray-300 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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
                <button type="button" onClick={onClose} className="p-1 text-red-500 hover:text-red-700 rounded-sm hover:bg-red-100"><X size={14} /></button>
              </div>
              
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col gap-6 pb-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col gap-6 md:w-1/2">
                      <div>
                        <Input {...register("titulo")} placeholder="Título de la Comisión" className={errors.titulo ? 'border-red-500' : ''} />
                        {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
                      </div>
                      <div className='flex justify-center'>
                        <CalendarioComisiones
                          fechasSeleccionadas={fechasSeleccionadas}
                          onSelectFechas={setFechasSeleccionadas}
                          disabled={!!comisionAEditar}
                        />
                      </div>
                      {!!comisionAEditar && (
                        <p className="text-xs text-center text-gray-500 -mt-4">
                          No se pueden seleccionar múltiples fechas al editar.
                        </p>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <select {...register("hora")} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (<option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>))}
                          </select>
                          <span>:</span>
                          <select {...register("minuto")} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                            {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (<option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>))}
                          </select>
                          <select {...register("periodo")} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
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
                  
                  <div className="flex justify-end pt-4 mt-auto">
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
  );
}