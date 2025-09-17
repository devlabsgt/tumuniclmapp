'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  User, AtSign, Briefcase, CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUsuario } from '@/lib/usuarios/acciones';
import useUserData from '@/hooks/sesion/useUserData';

interface UsuarioPageProps {
  id: string | null;
  onClose: () => void;
}

export default function UsuarioPage({ id, onClose }: UsuarioPageProps) {
  const { permisos } = useUserData();
  const [mostrarAcordeon, setMostrarAcordeon] = useState(false);
  
  const { data: usuario, error, isLoading, mutate } = useSWR(
    id ? ['usuario', id] : null,
    () => fetchUsuario(id!)
  );

  if (!id) return null;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    onClose();
    return null;
  }
  if (!usuario) return null;

  return (
    <div className="w-full">
      <h1 className="text-xl text-center font-bold mb-6">Informe de Empleado Municipal</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-md flex items-center gap-2">
          <User className="h-8 w-8 text-blue-600"/>
          <div>
            <p className="text-xs text-gray-500">Nombre</p>
            <h3 className="text-sm font-semibold text-gray-800">{usuario.nombre || 'Sin nombre registrado'}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-md flex items-center gap-2">
          <AtSign className="h-8 w-8 text-indigo-600"/>
          <div>
            <p className="text-xs text-gray-500">Usuario</p>
            <h3 className="text-sm font-semibold text-gray-800">{usuario.email}</h3>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-md flex items-center gap-2 ${usuario.activo === true || usuario.activo === 'true' ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
          {usuario.activo === true || usuario.activo === 'true' ? (
            <CheckCircle className="h-8 w-8 text-green-600"/>
          ) : (
            <XCircle className="h-8 w-8 text-red-600"/>
          )}
          <div>
            <p className="text-xs text-gray-500">Estado</p>
            <h3 className={`text-sm font-semibold ${usuario.activo === true || usuario.activo === 'true' ? 'text-green-800' : 'text-red-800'}`}>
              {usuario.activo === true || usuario.activo === 'true' ? 'Activo' : 'Inactivo'}
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-md flex flex-col justify-between items-start gap-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Rol</p>
                <h3 className="text-sm font-semibold text-gray-800">{usuario.rol || 'Sin rol'}</h3>
              </div>
            </div>
            <Button variant="link" onClick={() => setMostrarAcordeon(!mostrarAcordeon)} className="text-purple-600 text-sm p-0 h-auto">
              {mostrarAcordeon ? 'Ocultar detalles' : 'Ver detalles'}
              {mostrarAcordeon ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
          {mostrarAcordeon && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-6"
              >
                  <div className="grid grid-cols-1 gap-6 p-4 border rounded-xl bg-gray-50">
                      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                          <h3 className="text-sm font-semibold mb-3 text-gray-700">Permisos del Rol</h3>
                          <div className="flex flex-wrap gap-2">
                              {usuario.permisos?.length ? (
                                  usuario.permisos.map((permiso: string) => (
                                      <span
                                          key={permiso}
                                          className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-sm border border-blue-300"
                                      >
                                          {permiso}
                                      </span>
                                  ))
                              ) : (
                                  <span className="text-xs text-gray-500">Sin permisos</span>
                              )}
                          </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                          <h3 className="text-sm font-semibold mb-3 text-gray-700">Módulos con acceso</h3>
                          <div className="flex flex-wrap gap-2">
                              {usuario.modulos?.length ? (
                                  usuario.modulos.map((modulo: string) => (
                                      <span
                                          key={modulo}
                                          className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-sm border border-green-300"
                                      >
                                          {modulo}
                                      </span>
                                  ))
                              ) : (
                                  <span></span>
                              )}
                          </div>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}