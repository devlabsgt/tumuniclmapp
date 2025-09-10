'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/Button';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import BotonEditar from '@/components/ui/botones/BotonEditar';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import useUserData from '@/hooks/sesion/useUserData'; 
import { User, AtSign, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUsuario } from '@/lib/usuarios/acciones';
import useBodyScrollLock from '@/hooks/ui/useBodyScrollLock';


export function UsuarioPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [mostrarModal, setMostrarModal] = useState(false);

  const { permisos } = useUserData();

  const { data: usuario, error, isLoading } = useSWR(
    id ? ['usuario', id] : null,
    () => fetchUsuario(id!)
  );
  
  useBodyScrollLock(mostrarModal);

  if (!id) return <p>No se proporcionó un ID.</p>;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    router.push('/protected/admin/users');
    return null;
  }
  if (!usuario) return null;


  return (
    <>
      <div className="max-w-4xl mx-auto p-4 md:p-6 border rounded-xl shadow-lg bg-background text-foreground">
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-0">
            <div className="flex gap-2 w-full md:w-1/4">
              <BotonVolver ruta="/protected/admin/users" />
              {(permisos.includes('TODO') || permisos.includes('EDITAR')) && (
                <BotonEditar ruta={`/protected/admin/users/editar?id=${usuario.id}`} />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="informe"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl md:text-3xl font-bold mb-6 text-center">Informe de Empleado Municipal</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta de Nombre */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4">
                <User className="h-8 w-8 md:h-10 md:w-10 text-blue-600"/>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Nombre</p>
                  <h3 className="text-sm md:text-xl font-semibold text-gray-800">{usuario.nombre || 'Sin nombre registrado'}</h3>
                </div>
              </div>

              {/* Tarjeta de Email */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4">
                <AtSign className="h-8 w-8 md:h-10 md:w-10 text-indigo-600"/>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Usuario</p>
                  <h3 className="text-sm md:text-xl font-semibold text-gray-800">{usuario.email}</h3>
                </div>
              </div>

              {/* Tarjeta de Rol */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl shadow-md flex flex-col justify-between items-start gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                      <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
                      <div>
                          <p className="text-xs md:text-sm text-gray-500">Rol</p>
                          <h3 className="text-sm md:text-xl font-semibold text-gray-800">{usuario.rol || 'Sin rol'}</h3>
                      </div>
                  </div>
                  <Button variant="default" onClick={() => setMostrarModal(true)} className="w-full text-sm md:text-lg">
                      Ver detalles
                  </Button>
              </div>

              {/* Tarjeta de Estado */}
              <div className={`p-4 md:p-6 rounded-xl shadow-md flex items-center gap-2 md:gap-4 ${usuario.activo === true || usuario.activo === 'true' ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
                {usuario.activo === true || usuario.activo === 'true' ? (
                  <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-600"/>
                ) : (
                  <XCircle className="h-8 w-8 md:h-10 md:w-10 text-red-600"/>
                )}
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Estado</p>
                  <h3 className={`text-sm md:text-xl font-semibold ${usuario.activo === true || usuario.activo === 'true' ? 'text-green-800' : 'text-red-800'}`}>
                    {usuario.activo === true || usuario.activo === 'true' ? 'Activo' : 'Inactivo'}
                  </h3>
                </div>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <Transition show={mostrarModal} as={Fragment}>
        <Dialog onClose={() => setMostrarModal(false)} className="relative z-50">
          <TransitionChild as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100" leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
                <DialogTitle className="text-base md:text-lg font-bold mb-4 text-center">
                  Permisos y Módulos que tiene el Rol: <span className='text-blue-500'>{usuario.rol}</span>
                </DialogTitle>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                    <h3 className="text-sm md:text-base font-semibold mb-3 text-gray-700">Permisos del Rol</h3>
                    <div className="flex flex-wrap gap-2">
                      {usuario.permisos?.length ? (
                        usuario.permisos.map((permiso: string) => (
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
                      {usuario.modulos?.length ? (
                        usuario.modulos.map((modulo: string) => (
                          <span
                            key={modulo}
                            className="bg-green-100 text-green-800 text-xs md:text-sm px-3 py-1 rounded-sm border border-green-300"
                          >
                            {modulo}
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
    </>
  );
}