'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UsersTable from '@/components/admin/users/UsersTable';
import { motion, AnimatePresence } from 'framer-motion';
import AsistenciaTable from '@/components/admin/users/AsistenciaTable';
import useUserData from '@/hooks/sesion/useUserData';
import { useObtenerAsistencias } from '@/hooks/asistencia/useObtenerAsistencias';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';


type Vistas = 'usuarios' | 'asistencia';

export default function VerUsuarios() {
  const router = useRouter();
  const { rol: rolActual, cargando: cargandoUsuario } = useUserData();
  const { asistencias, loading: cargandoAsistencias } = useObtenerAsistencias();
  const { usuarios, loading: cargandoUsuarios } = useListaUsuarios();
  
  const [vistaActiva, setVistaActiva] = useState<Vistas>('usuarios');

  const usuariosFiltrados = useMemo(() => {
    if (rolActual === 'SUPER') {
      return usuarios;
    }
    return usuarios.filter(u => u.rol !== 'SUPER');
  }, [usuarios, rolActual]);

  const asistenciasFiltradas = useMemo(() => {
    if (rolActual === 'SUPER') {
      return asistencias;
    }
    const idsSuper = usuarios.filter(u => u.rol === 'SUPER').map(u => u.id);
    return asistencias.filter(a => !idsSuper.includes(a.user_id));
  }, [asistencias, usuarios, rolActual]);

  useEffect(() => {
    console.log('Registros recibidos por VerUsuarios:', asistencias);
  }, [asistencias]);

  if (cargandoUsuario || cargandoAsistencias || cargandoUsuarios) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div >
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-4 w-full">
        <Button
          variant="ghost"
          onClick={() => router.push("/protected/admin")}
          className="text-blue-600 text-base underline w-full md:w-auto"
        >
          Volver
        </Button>
      
        <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 min-w-[200px] md:w-auto">
          <button
            type="button"
            onClick={() => setVistaActiva('usuarios')}
            className={`w-1/2 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'usuarios' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Usuarios
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('asistencia')}
            className={`w-1/2 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'asistencia' ? 'bg-blue-100 text-blue-800 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            Asistencia
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {vistaActiva === 'usuarios' ? (
          <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <UsersTable usuarios={usuariosFiltrados} rolActual={rolActual} />
          </motion.div>
        ) : (
          <motion.div key="asistencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AsistenciaTable registros={asistenciasFiltradas} rolActual={rolActual} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}