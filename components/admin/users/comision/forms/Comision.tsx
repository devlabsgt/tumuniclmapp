'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { comisionSchema, ComisionFormData } from '@/lib/comisiones/esquemas';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import Calendario from '@/components/ui/Calendario';
import { Comision, Asistente } from '@/hooks/comisiones/useObtenerComisiones';
import { parseISO } from 'date-fns';
import { toast } from 'react-toastify';

interface ComisionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  usuarios: Usuario[];
  comisionAEditar?: Comision | null;
}

export default function ComisionForm({ isOpen, onClose, onSave, usuarios, comisionAEditar }: ComisionFormProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [busquedaEncargado, setBusquedaEncargado] = useState('');
  const [busquedaAsistente, setBusquedaAsistente] = useState('');
  const [resultadosBusquedaEncargado, setResultadosBusquedaEncargado] = useState<Usuario[]>([]);
  const [resultadosBusquedaAsistente, setResultadosBusquedaAsistente] = useState<Usuario[]>([]);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<ComisionFormData>({
    resolver: zodResolver(comisionSchema),
    defaultValues: { titulo: '', comentarios: '', hora: '08', minuto: '00', periodo: 'AM', encargadoId: '', userIds: [] },
  });

  const encargadoId = watch('encargadoId');
  const userIds = watch('userIds');

  const encargadoSeleccionado = useMemo(() => {
    return usuarios.find(u => u.id === encargadoId) || null;
  }, [usuarios, encargadoId]);

  const asistentesAsignados = useMemo(() => {
    return usuarios.filter(u => userIds?.includes(u.id));
  }, [usuarios, userIds]);

  useEffect(() => {
    if (isOpen) {
        if (comisionAEditar) {
            const fecha = parseISO(comisionAEditar.fecha);
            const [horaStr, periodo] = comisionAEditar.hora.split(' ');
            const [hora, minuto] = horaStr.split(':');

            const encargado = comisionAEditar.asistentes?.find((a: Asistente) => a.encargado) || null;
            const asistentes = comisionAEditar.asistentes?.filter((a: Asistente) => !a.encargado) || [];

            reset({
                titulo: comisionAEditar.titulo,
                comentarios: comisionAEditar.comentarios,
                hora: hora,
                minuto: minuto,
                periodo: periodo as 'AM' | 'PM',
                encargadoId: encargado?.id || '',
                userIds: asistentes.map(a => a.id),
            });
            setFechaSeleccionada(format(fecha, 'yyyy-MM-dd'));
            if (comisionAEditar.comentarios) {
                setMostrarComentarios(true);
            }
        } else {
            reset({ titulo: '', comentarios: '', hora: '08', minuto: '00', periodo: 'AM', encargadoId: '', userIds: [] });
            setFechaSeleccionada(format(new Date(), 'yyyy-MM-dd'));
            setMostrarComentarios(false);
        }
        setBusquedaEncargado('');
        setBusquedaAsistente('');
    }
  }, [comisionAEditar, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setBusquedaEncargado('');
      setBusquedaAsistente('');
      setMostrarComentarios(false);
    }
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, reset]);

  useEffect(() => {
    const idsAsignados = [encargadoId, ...(userIds || [])].filter(Boolean) as string[];
    
    if (busquedaEncargado.length > 1 && !encargadoSeleccionado) {
      const filtrados = usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(busquedaEncargado.toLowerCase()) &&
        !idsAsignados.includes(u.id)
      );
      setResultadosBusquedaEncargado(filtrados);
    } else {
      setResultadosBusquedaEncargado([]);
    }
  }, [busquedaEncargado, usuarios, encargadoSeleccionado, userIds]);

  useEffect(() => {
    const idsAsignados = [encargadoId, ...(userIds || [])].filter(Boolean) as string[];
    
    if (busquedaAsistente.length > 1 && encargadoSeleccionado) {
      const filtrados = usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(busquedaAsistente.toLowerCase()) &&
        !idsAsignados.includes(u.id)
      );
      setResultadosBusquedaAsistente(filtrados);
    } else {
      setResultadosBusquedaAsistente([]);
    }
  }, [busquedaAsistente, usuarios, encargadoSeleccionado, userIds, encargadoSeleccionado]);

  const handleSeleccionEncargado = (user: Usuario) => {
    setValue('encargadoId', user.id, { shouldValidate: true });
    setBusquedaEncargado('');
    setResultadosBusquedaEncargado([]);
  };

  const handleSeleccionAsistente = (user: Usuario) => {
    setValue('userIds', [...(userIds || []), user.id], { shouldValidate: true });
    setBusquedaAsistente('');
    setResultadosBusquedaAsistente([]);
  };

  const handleQuitarAsistente = (userId: string) => {
    setValue('userIds', userIds?.filter(id => id !== userId), { shouldValidate: true });
  };
  
  const handleQuitarEncargado = () => {
    setValue('encargadoId', '', { shouldValidate: true });
  };

  const onSubmit = async (formData: ComisionFormData) => {
    if (!encargadoId) {
      toast.error('Debe asignar un encargado a la comisión.');
      return;
    }

    try {
      let response;
      if (comisionAEditar) {
        // --- CAMBIO AQUÍ ---
        const datosComision = {
          id: comisionAEditar.id, // Se añade el ID para la actualización
          titulo: formData.titulo,
          comentarios: formData.comentarios,
          fecha: new Date(fechaSeleccionada + 'T00:00:00').toISOString(),
          hora: `${formData.hora}:${formData.minuto} ${formData.periodo}`,
          encargadoId: formData.encargadoId,
          userIds: formData.userIds,
        };
        response = await fetch(`/api/users/comision`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosComision),
        });
      } else {
        const datosComision = {
          titulo: formData.titulo,
          comentarios: formData.comentarios,
          fecha: new Date(fechaSeleccionada + 'T00:00:00').toISOString(),
          hora: `${formData.hora}:${formData.minuto} ${formData.periodo}`,
          encargadoId: formData.encargadoId,
          userIds: formData.userIds,
        };
        response = await fetch('/api/users/comision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosComision),
        });
      }

      if (!response.ok) {
        let errorMessage = 'Hubo un error al guardar la comisión. Intente de nuevo.';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      toast.success(comisionAEditar ? 'Comisión actualizada con éxito!' : 'Comisión creada con éxito!');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar la comisión:', error);
      toast.error(error.message);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {comisionAEditar ? 'Editar Comisión' : 'Nueva Comisión'}
                  </h2>
                  <p className="text-sm text-gray-500">Complete los detalles de la comisión.</p>
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full -mt-2 -mr-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col md:grid md:grid-cols-2 md:gap-8 pb-4">
                <div className="flex flex-col gap-6">
                  <div>
                    <label htmlFor="titulo" className="sr-only">Título de la Comisión</label>
                    <Input id="titulo" {...register("titulo")} placeholder="Título de la Comisión" className={errors.titulo ? 'border-red-500' : ''} />
                    {errors.titulo && <p className="text-sm text-red-500 mt-1">{errors.titulo.message}</p>}
                  </div>
                  <div className='flex justify-center self-start'>
                      <Calendario
                          fechaSeleccionada={fechaSeleccionada}
                          onSelectDate={setFechaSeleccionada}
                      />
                  </div>
                  <div className='flex flex-col gap-4'>
                    <div>
                      <label className="sr-only">Hora</label>
                      <div className="flex items-center gap-2">
                        <select {...register("hora")} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" aria-label="Hora">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (<option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>))}
                        </select>
                        <span className="font-bold">:</span>
                        <select {...register("minuto")} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" aria-label="Minuto">
                          {Array.from({ length: 60 }, (_, i) => i).map(m => (<option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>))}
                        </select>
                        <select {...register("periodo")} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" aria-label="Periodo AM/PM">
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <button type="button" onClick={() => setMostrarComentarios(!mostrarComentarios)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                        {mostrarComentarios ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span>{mostrarComentarios ? 'Ocultar comentarios' : 'Añadir comentarios'}</span>
                      </button>
                      <AnimatePresence>
                        {mostrarComentarios && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                        <textarea 
                          id="comentarios" 
                          {...register("comentarios")} 
                          placeholder="Escriba aquí los comentarios..." 
                          className="w-full mt-2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                        />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h4 className="sr-only">Encargado:</h4>
                    {!encargadoSeleccionado && (
                      <div className="relative">
                        <Input
                          id="encargado-input"
                          value={busquedaEncargado}
                          onChange={(e) => setBusquedaEncargado(e.target.value)}
                          onBlur={() => setTimeout(() => setResultadosBusquedaEncargado([]), 150)}
                          placeholder="Buscar y añadir encargado..."
                          className={!encargadoSeleccionado && errors.encargadoId ? 'border-red-500' : ''}
                        />
                        {resultadosBusquedaEncargado.length > 0 && (
                          <div className="absolute w-full bg-white border rounded-md mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                            {resultadosBusquedaEncargado.map((user: Usuario) => (
                              <button
                                type="button"
                                key={user.id}
                                className="w-full text-left p-3 text-sm hover:bg-blue-500 hover:text-white transition-colors duration-150"
                                onClick={() => handleSeleccionEncargado(user)}
                              >
                                {user.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {encargadoSeleccionado && (
                      <ul className="p-3 bg-white border rounded-md">
                        <li key={encargadoSeleccionado.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                          <span className="text-sm text-gray-800 font-semibold">
                            {encargadoSeleccionado.nombre}
                          </span>
                          <button type="button" onClick={handleQuitarEncargado} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"><X size={14} /></button>
                        </li>
                      </ul>
                    )}
                    {errors.encargadoId && <p className="text-sm text-red-500 mt-1">{errors.encargadoId.message}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="sr-only">Asistentes:</h4>
                    <div className="relative">
                      <Input
                        id="asistente-input"
                        value={busquedaAsistente}
                        onChange={(e) => setBusquedaAsistente(e.target.value)}
                        onBlur={() => setTimeout(() => setResultadosBusquedaAsistente([]), 150)}
                        placeholder="Buscar y añadir asistentes..."
                      />
                      {resultadosBusquedaAsistente.length > 0 && (
                        <div className="absolute w-full bg-white border rounded-md mt-1 z-20 max-h-40 overflow-y-auto shadow-lg">
                          {resultadosBusquedaAsistente.map((user: Usuario) => (
                            <button
                              type="button"
                              key={user.id}
                              className="w-full text-left p-3 text-sm hover:bg-blue-500 hover:text-white transition-colors duration-150"
                              onClick={() => handleSeleccionAsistente(user)}
                            >
                              {user.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {asistentesAsignados.length > 0 && (
                      <ul className="p-3 bg-white border rounded-md max-h-72 overflow-y-auto mt-2">
                        {asistentesAsignados.map((user: Usuario) => (
                          <li key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <span className="text-sm text-gray-800">
                              {user.nombre}
                            </span>
                            <button type="button" onClick={() => handleQuitarAsistente(user.id)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"><X size={14} /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-3 pt-4 md:col-span-2 mt-auto">
                  <Button type="button" variant="ghost" onClick={onClose} className="w-full md:w-1/2">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-1/2 bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? 'Guardando...' : comisionAEditar ? 'Guardar Cambios' : 'Crear Comisión'}
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