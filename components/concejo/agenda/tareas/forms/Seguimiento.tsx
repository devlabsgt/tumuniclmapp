'use client';

import React, { Fragment, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { actualizarSeguimiento } from '../../lib/acciones';
import { Tarea } from '../../lib/esquemas';
import { Input } from '@/components/ui/input';
import Swal from 'sweetalert2';

interface SeguimientoProps {
  isOpen: boolean;
  onClose: (hasChanged: boolean) => void;
  tarea: Tarea;
}

export default function Seguimiento({ isOpen, onClose, tarea }: SeguimientoProps) {
  const [seguimiento, setSeguimiento] = useState<string[]>(tarea.seguimiento || []);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const handleAdd = async () => {
    if (!nuevoSeguimiento.trim()) return;
    setIsSubmitting(true);
    const nuevosSeguimientos = [...seguimiento, nuevoSeguimiento];
    await actualizarSeguimiento(tarea.id, nuevosSeguimientos);
    setSeguimiento(nuevosSeguimientos);
    setNuevoSeguimiento('');
    setHasChanged(true);
    setIsSubmitting(false);
  };

  const handleEdit = async (index: number) => {
    const { value: seguimientoEditado } = await Swal.fire({
      title: 'Editar Seguimiento',
      input: 'textarea',
      inputValue: seguimiento[index],
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });

    if (seguimientoEditado && seguimientoEditado.trim() !== seguimiento[index]) {
      setIsSubmitting(true);
      const seguimientosActualizados = [...seguimiento];
      seguimientosActualizados[index] = seguimientoEditado;
      await actualizarSeguimiento(tarea.id, seguimientosActualizados);
      setSeguimiento(seguimientosActualizados);
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
        const seguimientosFiltrados = seguimiento.filter((_, i) => i !== index);
        await actualizarSeguimiento(tarea.id, seguimientosFiltrados);
        setSeguimiento(seguimientosFiltrados);
        setHasChanged(true);
        setIsSubmitting(false);
        Swal.fire('Eliminado!', 'El seguimiento ha sido eliminado.', 'success');
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
                    placeholder="Añadir nuevo seguimiento..." 
                    value={nuevoSeguimiento} 
                    onChange={(e) => setNuevoSeguimiento(e.target.value)} 
                  />
                  <Button onClick={handleAdd} disabled={!nuevoSeguimiento.trim() || isSubmitting}>
                    <Plus size={16} />
                  </Button>
                </div>
                
                {seguimiento.length === 0 ? (
                  <p className="text-gray-500 text-center">No hay seguimiento para esta tarea.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {seguimiento.map((seg, index) => (
                      <li key={index} className="flex justify-between items-center p-2 rounded bg-gray-100">
                        <span className="text-sm flex-1 mr-2">{seg}</span>
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