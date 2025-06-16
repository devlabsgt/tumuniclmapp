'use client';

import { useState, useMemo, Fragment } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import AsignarPermisosForm from './AsignarPermisosForm';
import EditarRolForm from './EditarRolForm';
import { Button } from '@/components/ui/button';
import { Shield, Pencil } from 'lucide-react';

type Rol = {
  id: string;
  nombre: string;
};

type Props = {
  roles: Rol[];
  onRolActualizado: (rol: Rol) => void;
};

export default function TablaRoles({ roles, onRolActualizado }: Props) {
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null);
  const [rolEditar, setRolEditar] = useState<Rol | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const rolesFiltrados = useMemo(() => {
    return roles
      .filter((rol) =>
        rol.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [roles, busqueda]);

  if (!roles || roles.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8">
        No hay roles registrados.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar rol..."
        className="w-full border rounded px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="min-w-full divide-y divide-gray-300 text-sm border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold border-r border-gray-200">
                Nombre del Rol
              </th>
              <th className="px-4 py-2 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rolesFiltrados.map((rol) => (
              <tr key={rol.id} className="border-t border-gray-200">
                <td className="px-4 py-2">{rol.nombre}</td>
                <td className="px-4 py-2 text-right space-x-2">

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRolEditar(rol)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                                    <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRolSeleccionado(rol)}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Permisos
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Permisos */}
      <Transition show={!!rolSeleccionado} as={Fragment}>
        <Dialog onClose={() => setRolSeleccionado(null)} className="relative z-50">
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
              <DialogPanel className="bg-white rounded-lg p-6 w-full max-w-xs shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">
                  Asignar Permisos para{' '}
                  <span className="text-blue-500 underline">{rolSeleccionado?.nombre}</span>
                </DialogTitle>
                {rolSeleccionado && (
                  <AsignarPermisosForm
                    rolId={rolSeleccionado.id}
                    onClose={() => setRolSeleccionado(null)}
                  />
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Editar */}
      <Transition show={!!rolEditar} as={Fragment}>
        <Dialog onClose={() => setRolEditar(null)} className="relative z-50">
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
              <DialogPanel className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">
                  Editar Rol
                </DialogTitle>
                {rolEditar && (
                  <EditarRolForm
                    rol={rolEditar}
                    onClose={() => setRolEditar(null)}
                    onRolActualizado={onRolActualizado}
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
