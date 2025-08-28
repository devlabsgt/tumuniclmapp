'use client';

import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { fetchCategorias, crearCategoria, editarCategoria } from '../../lib/acciones';
import { CategoriaItem } from '../../lib/esquemas';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Pencil, PlusCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import CargandoAnimacion from '@/components/ui/animations/Cargando';

interface CategoriasProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategoria: (categoria: CategoriaItem) => void;
}

export default function Categorias({ isOpen, onClose, onSelectCategoria }: CategoriasProps) {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState('');

  const cargarCategorias = async () => {
    setLoading(true);
    const cats = await fetchCategorias();
    setCategorias(cats);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      cargarCategorias();
    }
  }, [isOpen]);

  const categoriasOrdenadas = useMemo(() =>
    [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre))
  , [categorias]);

  const handleCrearCategoria = async () => {
    if (nuevaCategoriaNombre.trim() !== '') {
      await crearCategoria(nuevaCategoriaNombre);
      setNuevaCategoriaNombre('');
      cargarCategorias();
    }
  };

  const handleEditarCategoria = async (categoria: CategoriaItem) => {
    const { value: nombre } = await Swal.fire({
      title: 'Editar Categoría',
      input: 'text',
      inputValue: categoria.nombre,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡El nombre no puede estar vacío!';
        }
      }
    });

    if (nombre && nombre !== categoria.nombre) {
      await editarCategoria(categoria.id, nombre);
      cargarCategorias();
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl flex flex-col h-[600px]">
              
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Categorías
                </DialogTitle>
                <Button onClick={onClose} variant="link">
                  Cerrar
                </Button>
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Escriba aquí la nueva categoría..."
                  value={nuevaCategoriaNombre}
                  onChange={(e) => setNuevaCategoriaNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCrearCategoria();
                    }
                  }}
                  className="flex-grow"
                />
                <Button onClick={handleCrearCategoria} className="bg-green-500 hover:bg-green-600" size="icon">
                  <PlusCircle size={20} />
                </Button>
              </div>

              <div className="flex-grow overflow-y-auto">
                {loading ? <CargandoAnimacion texto="Cargando..." /> : (
                  <ul className="space-y-2">
                    {categoriasOrdenadas.map(cat => (
                      <li key={cat.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                        <span
                          className="flex-grow cursor-pointer"
                          onClick={() => {
                            onSelectCategoria(cat);
                            onClose();
                          }}
                        >
                          {cat.nombre}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleEditarCategoria(cat)}>
                          <Pencil size={16} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}