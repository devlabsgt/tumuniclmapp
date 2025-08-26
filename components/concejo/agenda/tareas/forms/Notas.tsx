'use client';

import React, { Fragment, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { actualizarNotas } from '../../lib/acciones';
import { Tarea } from '../../lib/esquemas';import { Input } from '@/components/ui/input';
import Swal from 'sweetalert2';

interface NotasProps {
  isOpen: boolean;
  onClose: (hasChanged: boolean) => void;
  tarea: Tarea;
}

export default function Notas({ isOpen, onClose, tarea }: NotasProps) {
  const [notas, setNotas] = useState<string[]>(tarea.notas || []);
  const [nuevaNota, setNuevaNota] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const handleAdd = async () => {
    if (!nuevaNota.trim()) return;
    setIsSubmitting(true);
    const nuevasNotas = [...notas, nuevaNota];
    await actualizarNotas(tarea.id, nuevasNotas);
    setNotas(nuevasNotas);
    setNuevaNota('');
    setHasChanged(true);
    setIsSubmitting(false);
  };

  const handleEdit = async (index: number) => {
    const { value: notaEditada } = await Swal.fire({
      title: 'Editar Nota',
      input: 'textarea',
      inputValue: notas[index],
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });

    if (notaEditada && notaEditada.trim() !== notas[index]) {
      setIsSubmitting(true);
      const notasActualizadas = [...notas];
      notasActualizadas[index] = notaEditada;
      await actualizarNotas(tarea.id, notasActualizadas);
      setNotas(notasActualizadas);
      setHasChanged(true);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (index: number) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);
        const notasFiltradas = notas.filter((_, i) => i !== index);
        await actualizarNotas(tarea.id, notasFiltradas);
        setNotas(notasFiltradas);
        setHasChanged(true);
        setIsSubmitting(false);
        Swal.fire('Eliminada!', 'La nota ha sido eliminada.', 'success');
      }
    });
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={() => onClose(hasChanged)} className="relative z-50">
        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <DialogPanel className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Añadir nueva nota..." 
                    value={nuevaNota} 
                    onChange={(e) => setNuevaNota(e.target.value)} 
                  />
                  <Button onClick={handleAdd} disabled={!nuevaNota.trim() || isSubmitting}>
                    <Plus size={16} />
                  </Button>
                </div>
                
                {notas.length === 0 ? (
                  <p className="text-gray-500 text-center">No hay notas para esta tarea.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {notas.map((nota, index) => (
                      <li key={index} className="flex justify-between items-center p-2 rounded bg-gray-100">
                        <span className="text-sm flex-1 mr-2">{nota}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(index)} disabled={isSubmitting}>
                            <Pencil size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(index)} disabled={isSubmitting}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button onClick={() => onClose(hasChanged)} variant="link" className="w-full text-center">
                  Cerrar
                </Button>
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}