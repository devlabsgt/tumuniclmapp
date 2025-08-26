'use client';

import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tareaSchema, TareaFormData, CategoriaItem, Tarea as TareaType } from '../../lib/esquemas';
import { crearTarea, editarTarea, fetchCategorias } from '../../lib/acciones';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Categorias from './Categorias';
import Swal from 'sweetalert2';
import { AnimatePresence, motion } from 'framer-motion';

interface TareaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  agendaConcejoId: string;
  tareaAEditar?: TareaType | null;
}

const estadoOpciones = ['No iniciado', 'Aprobado', 'No aprobado', 'En progreso', 'En comisión', 'En espera', 'Realizado'];
const votacionOpciones = ['P1', 'Unanimidad', 'Ver Notas', 'Realizado', 'No Emitido'];

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
    reset,
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
                    <Button type="button" variant="link" onClick={onClose} disabled={isSubmitting} className="w-1/2">
                      Salir
                    </Button>
                    <Button type="submit" disabled={isSubmitting || (isEditing && !tieneCambios)} className="w-1/2">
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
      <Transition show={isEstadoModalOpen} as={Fragment}>
        <Dialog onClose={() => setIsEstadoModalOpen(false)} className="relative z-50">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Seleccionar Estado</h2>
                    <button onClick={() => setIsEstadoModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {estadoOpciones.map(estado => (
                      <motion.button
                        key={estado}
                        type="button"
                        onClick={() => {
                          setValue('estado', estado, { shouldValidate: true });
                          setIsEstadoModalOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-md shadow-sm text-center ${getStatusClasses(estado)} text-xs md:text-xs ${estadoValue === estado ? 'border-t-4 border-blue-500' : ''}`}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="font-semibold">{estado}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <hr className="my-4" />
                <div >
                  <Button variant="link" onClick={() => setIsEstadoModalOpen(false)} className="w-full">
                    Salir
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Modal para seleccionar la votación */}
      <Transition show={isVotacionModalOpen} as={Fragment}>
        <Dialog onClose={() => setIsVotacionModalOpen(false)} className="relative z-50">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Seleccionar Votación</h2>
                    <button onClick={() => setIsVotacionModalOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {votacionOpciones.map(votacion => (
                      <motion.button
                        key={votacion}
                        type="button"
                        onClick={() => {
                          setValue('votacion', votacion, { shouldValidate: true });
                          setIsVotacionModalOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-md shadow-sm text-center ${getVotacionClasses(votacion)} text-base`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="font-semibold">{votacion}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <hr className="my-4" />
                <div>
                  <Button variant="link" onClick={() => setIsVotacionModalOpen(false)} className="w-full">
                    Salir
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}