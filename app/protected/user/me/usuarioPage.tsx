'use client';

import { useEffect, useState, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import BotonVolver from '@/components/ui/botones/BotonVolver';

interface Usuario {
  id: string;
  email: string;
  rol: string | null;
  permisos: string[];
  modulos: string[];
}

export function UsuarioPageContent() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarContenido, setMostrarContenido] = useState(false);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        if (!res.ok || !data?.email) throw new Error(data.error || 'No autorizado');
        setUsuario(data);
      } catch (err) {
        console.error('Error al obtener el usuario actual:', err);
        setUsuario(null);
      } finally {
        setIsLoading(false);
        setTimeout(() => setMostrarContenido(true), 50); // Pequeño delay para la transición
      }
    };

    fetchUsuario();
  }, []);

  if (isLoading) return <p className="text-center mt-10">Cargando usuario...</p>;
  if (!usuario) return <p className="text-center mt-10 text-red-500">No se pudo cargar el usuario actual.</p>;

  return (
    <Transition show={mostrarContenido} as={Fragment}>
      <TransitionChild
        enter="transition ease-out duration-500"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-300"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="max-w-4xl mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-6">
            <BotonVolver ruta="/protected" />
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
          </div>

          {/* Tabla de datos */}
          <div className="mt-4 border-[2.5px] border-gray-400 overflow-x-auto text-xl">
            <table className="w-full border-collapse border-[2.5px] border-gray-300">
              <thead className="bg-gray-200">
                <tr className="text-left text-2xl font-semibold">
                  <th className="p-2 border-[1.5px] border-gray-300">Campo</th>
                  <th className="p-2 border-[1.5px] border-gray-300">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold min-w-[140px]">Usuario</td>
                  <td className="p-2 border-[1.5px] border-gray-300">{usuario.email}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Rol</td>
                  <td className="p-2 border-[1.5px] border-gray-300">
                    <Button variant="ghost" className="text-black-600 text-lg py-0 px-1" onClick={() => setMostrarModal(true)}>
                      {usuario.rol || 'Sin rol'}
                    </Button>
                  </td>
                </tr>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Estado</td>
                  <td className="p-2 border-[1.5px] border-gray-300">🟢 Activo</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Modal igual que antes */}
          <Transition show={mostrarModal} as={Fragment}>
            <Dialog onClose={() => setMostrarModal(false)} className="relative z-50">
              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black/30" />
              </TransitionChild>

              <div className="fixed inset-0 flex items-center justify-center p-4">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95">
                  <DialogPanel className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
                    <DialogTitle className="text-lg font-bold mb-4 text-center">
                      Permisos y Módulos del Rol: <span className='text-blue-500'>{usuario.rol}</span>
                    </DialogTitle>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-gray-200 rounded-sm shadow-sm p-4">
                        <h3 className="text-base font-semibold mb-3 text-gray-700">Permisos</h3>
                        <div className="flex flex-wrap gap-2">
                          {usuario.permisos.length > 0 ? (
                            usuario.permisos.map((permiso) => (
                              <span key={permiso} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-sm border border-blue-300">
                                {permiso}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Sin permisos</span>
                          )}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-sm shadow-sm p-4">
                        <h3 className="text-base font-semibold mb-3 text-gray-700">Módulos</h3>
                        <div className="flex flex-wrap gap-2">
                          {usuario.modulos.length > 0 ? (
                            usuario.modulos.map((modulo) => (
                              <span key={modulo} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-sm border border-green-300">
                                {modulo}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Sin módulos</span>
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
      </TransitionChild>
    </Transition>
  );
}
