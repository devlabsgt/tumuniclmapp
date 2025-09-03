'use client';

import useUserData from '@/hooks/sesion/useUserData';
import { User, Briefcase, Lock, BookOpen, Leaf, Building, CheckSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, Fragment } from 'react';
import Cargando from '@/components/ui/animations/Cargando'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';

export default function Ver() {
  const { nombre, email, rol, permisos, modulos, programas, cargando } = useUserData();
  const [mostrarModal, setMostrarModal] = useState(false);

  if (cargando) {
    return <Cargando texto='Cargando Perfil...'/>;
  }
  
  const getModuloIcon = (modulo: string) => {
    switch (modulo) {
      case 'EDUCACION': return <BookOpen size={16} />;
      case 'FERTILIZANTE': return <Leaf size={16} />;
      case 'ORGANOS': return <Building size={16} />;
      case 'CONFIGURACION': return <Settings size={16} />;
      default: return <CheckSquare size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6">
        {/* Tarjeta de Nombre */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4">
          <User className="h-8 w-8 md:h-10 md:w-10 text-blue-600"/>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Nombre</p>
            <h3 className="text-sm md:text-xl font-semibold text-gray-800">{nombre || 'No asignado'}</h3>
          </div>
        </div>

        {/* Tarjeta de Email */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4">
          <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-indigo-600"/>
          <div>
            <p className="text-xs md:text-sm text-gray-500">Email</p>
            <h3 className="text-sm md:text-xl font-semibold text-gray-800">{email || 'No disponible'}</h3>
          </div>
        </div>

        {/* Tarjeta de Rol */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl shadow-md flex flex-col justify-between items-start gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Lock className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
            <div>
              <p className="text-xs md:text-sm text-gray-500">Rol</p>
              <h3 className="text-sm md:text-xl font-semibold text-gray-800 capitalize">{rol || 'No asignado'}</h3>
            </div>
          </div>
          <Button variant="default" onClick={() => setMostrarModal(true)} className="w-full text-sm md:text-lg">
            Ver detalles del rol
          </Button>
        </div>

        {/* Tarjeta de Programas */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl shadow-md flex flex-col justify-between items-start gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <CheckSquare className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
            <div>
              <p className="text-xs md:text-sm text-gray-500">Programas</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {programas && programas.length > 0 ? (
                  programas.map(p => <span key={p} className="px-3 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-md border border-green-300">{p}</span>)
                ) : (
                  <span className="text-sm text-gray-500">Ninguno</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Permisos y Módulos */}
      <Transition show={mostrarModal} as={Fragment}>
        <Dialog onClose={() => setMostrarModal(false)} className="relative z-50">
          <TransitionChild as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100" leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
                <DialogTitle className="text-base md:text-lg font-bold mb-4 text-center">
                  Permisos y Módulos que tiene el Rol: <span className='text-blue-500'>{rol}</span>
                </DialogTitle>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                    <h3 className="text-sm md:text-base font-semibold mb-3 text-gray-700">Permisos del Rol</h3>
                    <div className="flex flex-wrap gap-2">
                      {permisos?.length ? (
                        permisos.map(permiso => (
                          <span
                            key={permiso}
                            className="bg-blue-100 text-blue-800 text-xs md:text-sm px-3 py-1 rounded-sm border border-blue-300"
                          >
                            {permiso}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs md:text-sm text-gray-500">Sin permisos</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                    <h3 className="text-sm md:text-base font-semibold mb-3 text-gray-700">Módulos con acceso</h3>
                    <div className="flex flex-wrap gap-2">
                      {modulos?.length ? (
                        modulos.map(m => (
                          <span
                            key={m}
                            className="bg-green-100 text-green-800 text-xs md:text-sm px-3 py-1 rounded-sm border border-green-300 flex items-center gap-1"
                          >
                            {getModuloIcon(m)}
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs md:text-sm text-gray-500">Sin módulos</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-right">
                  <Button variant="outline" onClick={() => setMostrarModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}