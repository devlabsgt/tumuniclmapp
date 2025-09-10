'use client';

import { useState, Fragment } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import EditarModuloForm from './EditarModuloForm';
import AsignarRolesModuloForm from './AsignarRolesModuloForm';

interface Modulo {
  id: string;
  nombre: string;
}

interface Props {
  modulos: Modulo[];
  onModuloActualizado: (modulo: Modulo) => void;
}

export default function TablaModulos({ modulos, onModuloActualizado }: Props) {
  const [moduloEnEdicion, setModuloEnEdicion] = useState<Modulo | null>(null);
  const [moduloParaRoles, setModuloParaRoles] = useState<Modulo | null>(null);

  if (!modulos || modulos.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        No hay módulos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="min-w-full divide-y divide-gray-300 text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold border-r border-gray-200">
                Nombre del Módulo
              </th>
              <th className="px-4 py-2 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modulos.map((modulo) => (
              <tr key={modulo.id} className="border-t border-gray-200">
                <td className="px-4 py-2">{modulo.nombre}</td>
                <td className="px-4 py-2 text-right space-x-2">
                 <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModuloEnEdicion(modulo)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModuloParaRoles(modulo)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Asignar Roles
                  </Button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Editar Módulo */}
      <Transition show={!!moduloEnEdicion} as={Fragment}>
        <Dialog onClose={() => setModuloEnEdicion(null)} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">
                  Editar Módulo
                </DialogTitle>
                {moduloEnEdicion && (
                  <EditarModuloForm
                    modulo={moduloEnEdicion}
                    onClose={() => setModuloEnEdicion(null)}
                    onModuloActualizado={onModuloActualizado}
                  />
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Asignar Roles */}
      <Transition show={!!moduloParaRoles} as={Fragment}>
        <Dialog onClose={() => setModuloParaRoles(null)} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">
                  Asignar Roles al módulo{' '}
                  <span className="text-blue-600 underline">
                    {moduloParaRoles?.nombre}
                  </span>
                </DialogTitle>
                {moduloParaRoles && (
                  <AsignarRolesModuloForm
                    moduloId={moduloParaRoles.id}
                    onClose={() => setModuloParaRoles(null)}
                  />
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
