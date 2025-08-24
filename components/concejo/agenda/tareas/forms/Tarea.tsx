'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tareaSchema, TareaFormData } from '../lib/esquemas';
import { Button } from '@/components/ui/button';
import { crearTarea, editarTarea, fetchCategorias, CategoriaItem, Tarea as TareaType } from '../lib/acciones';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import Calendario from '@/components/ui/Calendario';
import { Input } from '@/components/ui/input';
import Categorias from './Categorias';

interface TareaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  agendaConcejoId: string;
  tareaAEditar?: TareaType | null;
}

export default function Tarea({ isOpen, onClose, onSave, agendaConcejoId, tareaAEditar }: TareaProps) {
  const isEditing = !!tareaAEditar;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TareaFormData>({
    resolver: zodResolver(tareaSchema),
    defaultValues: isEditing ? {
      titulo_item: tareaAEditar.titulo_item,
      categoria_id: tareaAEditar.categoria.id,
      estado: tareaAEditar.estado,
      notas: tareaAEditar.notas,
      fecha_vencimiento: tareaAEditar.fecha_vencimiento,
    } : {
      titulo_item: '',
      categoria_id: '',
      estado: 'No iniciado',
      notas: '',
      fecha_vencimiento: '',
    },
  });

  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);

  useEffect(() => {
    async function loadCategorias() {
      const cats = await fetchCategorias();
      setCategorias(cats);
    }
    loadCategorias();
  }, []);

  const onSubmit = async (data: TareaFormData) => {
    if (isEditing && tareaAEditar) {
      await editarTarea(tareaAEditar.id, data);
    } else {
      await crearTarea(data, agendaConcejoId);
    }
    onSave();
    onClose();
  };

  const fechaVencimientoValue = watch('fecha_vencimiento');
  const categoriaIdValue = watch('categoria_id');
  const categoriaSeleccionada = categorias.find(c => c.id === categoriaIdValue);

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={onClose} className="relative z-50">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
                <DialogTitle className="text-xl font-bold mb-4 flex justify-between items-center">
                  {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="titulo_item" className="block text-sm font-medium text-gray-700">Título de la Tarea</label>
                      <Input
                        id="titulo_item"
                        {...register('titulo_item')}
                        placeholder="Ej. Nombre de la Tarea"
                        className={errors.titulo_item ? 'border-red-500' : ''}
                      />
                      {errors.titulo_item && <p className="mt-1 text-sm text-red-600">{errors.titulo_item.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700">Categoría</label>
                      <Button type="button" variant="outline" onClick={() => setIsCategoriaModalOpen(true)} className="mt-1 w-full justify-start">
                        {categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Seleccione una categoría'}
                      </Button>
                      {errors.categoria_id && <p className="mt-1 text-sm text-red-600">{errors.categoria_id.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                      <select
                        id="estado"
                        {...register('estado')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.estado ? 'border-red-500' : ''}`}
                      >
                        <option value="No iniciado">No iniciado</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="No aprobado">No aprobado</option>
                        <option value="En progreso">En Progreso</option>
                        <option value="En comisión">En comisión</option>
                        <option value="En espera">En espera</option>
                        <option value="Realizado">Realizado</option>
                      </select>
                      {errors.estado && <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Fecha de Vencimiento <span className="text-gray-500">(Opcional)</span>
                      </label>
                      <div className="mt-1">
                        <Calendario
                          fechaSeleccionada={fechaVencimientoValue || format(new Date(), 'yyyy-MM-dd')}
                          onSelectDate={(date) => setValue('fecha_vencimiento', date, { shouldValidate: true })}
                        />
                        {errors.fecha_vencimiento && <p className="mt-1 text-sm text-red-600">{errors.fecha_vencimiento.message}</p>}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="notas" className="block text-sm font-medium text-gray-700">Notas <span className="text-gray-500">(Opcional)</span></label>
                      <textarea
                        id="notas"
                        {...register('notas')}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Tarea')}
                    </Button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <Categorias
        isOpen={isCategoriaModalOpen}
        onClose={() => setIsCategoriaModalOpen(false)}
        onSelectCategoria={(cat) => {
          setValue('categoria_id', cat.id, { shouldValidate: true });
        }}
      />
    </>
  );
}