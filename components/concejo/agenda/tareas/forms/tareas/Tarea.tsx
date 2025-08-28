'use client';

import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tareaSchema, TareaFormData, CategoriaItem, Tarea as TareaType } from '../../../lib/esquemas';
import { crearTarea, editarTarea, fetchCategorias } from '../../../lib/acciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Categorias from '../Categorias';
import Estado from './Estado';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface TareaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  agendaConcejoId: string;
  tareaAEditar?: TareaType | null;
}

const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-100 text-green-800 hover:bg-green-200',
  'No aprobado': 'bg-red-100 text-red-800 hover:bg-red-200',
  'En progreso': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'En comisión': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  'En espera': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'No iniciado': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  'Realizado': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
};

const votacionStyles: Record<string, string> = {
  'P1': 'bg-red-100 text-red-800 hover:bg-red-200',
  'Unanimidad': 'bg-green-100 text-green-800 hover:bg-green-200',
  'Ver Notas': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'Realizado': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  'No Emitido': 'bg-white text-gray-800 hover:bg-gray-100',
};

const getStatusClasses = (status: string) => statusStyles[status] || 'bg-gray-200 text-gray-700 hover:bg-gray-300';
const getVotacionClasses = (votacion: string) => votacionStyles[votacion] || 'bg-gray-200 text-gray-700 hover:bg-gray-300';

export default function Tarea({ isOpen, onClose, onSave, agendaConcejoId, tareaAEditar }: TareaProps) {
  const isEditing = !!tareaAEditar;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TareaFormData>({
    resolver: zodResolver(tareaSchema),
    defaultValues: isEditing ? {
      titulo_item: tareaAEditar.titulo_item,
      categoria_id: tareaAEditar.categoria.id,
      estado: tareaAEditar.estado,
      votacion: tareaAEditar.votacion || '',
    } : {
      titulo_item: '',
      categoria_id: '',
      estado: 'No iniciado',
      votacion: 'No Emitido',
    },
  });

  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false);
  const [isVotacionModalOpen, setIsVotacionModalOpen] = useState(false);

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

  const categoriaIdValue = watch('categoria_id');
  const estadoValue = watch('estado');
  const votacionValue = watch('votacion');
  const categoriaSeleccionada = categorias.find(c => c.id === categoriaIdValue);
  
  const valoresActuales = watch();
  
  const tieneCambios = useMemo(() => {
    if (!isEditing || !tareaAEditar) return false;

    return (
      valoresActuales.titulo_item !== tareaAEditar.titulo_item ||
      valoresActuales.categoria_id !== tareaAEditar.categoria.id ||
      valoresActuales.estado !== tareaAEditar.estado ||
      valoresActuales.votacion !== (tareaAEditar.votacion || '')
    );
  }, [valoresActuales, isEditing, tareaAEditar]);

  const handleSelectEstado = (estado: string) => {
    setValue('estado', estado, { shouldValidate: true });
    setIsEstadoModalOpen(false);
  };

  const handleSelectVotacion = (votacion: string) => {
    setValue('votacion', votacion, { shouldValidate: true });
    setIsVotacionModalOpen(false);
  };
  
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <DialogTitle className="text-xl font-bold">{isEditing ? 'Editar Punto a Tratar' : 'Crear Nuevo Punto a Tratar'}</DialogTitle>
                    <Button variant="link" onClick={onClose}>
                      Salir
                    </Button>
                  </div>

                  <div>
                    <label htmlFor="titulo_item" className="block text-sm font-medium text-gray-700">Título del punto a tratar</label>
                    <Input
                      id="titulo_item"
                      {...register('titulo_item')}
                      placeholder="Ej. Nombre de la Tarea"
                      className={errors.titulo_item ? 'border-red-500' : ''}
                    />
                    {errors.titulo_item && <p className="mt-1 text-sm text-red-600">{errors.titulo_item.message}</p>}
                  </div>

                  <div className="flex gap-4">
                    <div className="w-3/5">
                      <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700">Categoría</label>
                      <Button type="button" variant="outline" onClick={() => setIsCategoriaModalOpen(true)} className="mt-1 w-full justify-start">
                        {categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Seleccione una categoría'}
                      </Button>
                      {errors.categoria_id && <p className="mt-1 text-sm text-red-600">{errors.categoria_id.message}</p>}
                    </div>
                    
                    {isEditing && (
                      <div className="w-2/5">
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <Button
                          type="button"
                          className={`mt-1 w-full justify-start ${getStatusClasses(estadoValue)}`}
                          onClick={() => setIsEstadoModalOpen(true)}
                        >
                          {estadoValue || 'Seleccione un estado'}
                        </Button>
                        {errors.estado && <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Votación
                      </label>
                      <Button
                        type="button"
                          className={`mt-1 w-full justify-start ${getVotacionClasses(votacionValue || '')}`}
                          onClick={() => setIsVotacionModalOpen(true)}
                        >
                          {votacionValue || 'Seleccione una votación'}
                        </Button>
                        {errors.votacion && <p className="mt-1 text-sm text-red-600">{errors.votacion.message}</p>}
                    </div>
                  )}
                  
                  <hr className="my-4" />

                  <div className="mt-6 flex justify-end gap-2">
                    <Button type="submit" disabled={isSubmitting || (isEditing && !tieneCambios)} className="w-full">
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
      
      {/* Modal para seleccionar el estado */}
      <Estado
        isOpen={isEstadoModalOpen}
        onClose={() => setIsEstadoModalOpen(false)}
        onSelect={handleSelectEstado}
        type="estado"
        currentValue={estadoValue}
      />

      {/* Modal para seleccionar la votación */}
      <Estado
        isOpen={isVotacionModalOpen}
        onClose={() => setIsVotacionModalOpen(false)}
        onSelect={handleSelectVotacion}
        type="votacion"
        currentValue={votacionValue || ''}
      />
    </>
  );
}