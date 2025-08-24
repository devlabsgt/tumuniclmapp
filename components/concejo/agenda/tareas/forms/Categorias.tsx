'use client';

import React, { Fragment, useEffect, useState, useMemo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { fetchCategorias, crearCategoria, editarCategoria, CategoriaItem } from '../lib/acciones';
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
  const [busqueda, setBusqueda] = useState('');

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

  const categoriasFiltradas = useMemo(() =>
    categorias.filter(cat => cat.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  , [categorias, busqueda]);

  const handleNuevaCategoria = async () => {
    const { value: nombre } = await Swal.fire({
      title: 'Nueva Categoría',
      input: 'text',
      inputLabel: 'Nombre de la nueva categoría',
      inputPlaceholder: 'Ej. Asuntos Legales',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesita escribir un nombre!';
        }
      }
    });

    if (nombre) {
      await crearCategoria(nombre);
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
            <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl flex flex-col h-[70vh]">
              <DialogTitle className="text-xl font-bold mb-4 flex justify-between items-center">
                Gestionar Categorías
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
              </DialogTitle>
              
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Buscar categoría..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={handleNuevaCategoria} className="bg-green-500 hover:bg-green-600">
                  <PlusCircle size={20} />
                </Button>
              </div>

              <div className="flex-grow overflow-y-auto">
                {loading ? <CargandoAnimacion texto="Cargando..." /> : (
                  <ul className="space-y-2">
                    {categoriasFiltradas.map(cat => (
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
                        <Button variant="ghost" size="sm" onClick={() => handleEditarCategoria(cat)}>
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