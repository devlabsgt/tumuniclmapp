'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UsersTable from '@/components/admin/users/UsersTable';
import { motion, AnimatePresence } from 'framer-motion';
import AsistenciaTable from '@/components/admin/users/AsistenciaTable';
import useUserData from '@/hooks/sesion/useUserData';
import { useObtenerAsistencias } from '@/hooks/asistencia/useObtenerAsistencias';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';
import VerComision from '../../comisiones/Ver';
import Cargando from '@/components/ui/animations/Cargando';

type Vistas = 'usuarios' | 'asistencia' | 'comisiones';

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

  if (cargandoUsuario || cargandoAsistencias || cargandoUsuarios) {
    return <Cargando texto='Cargando...'/>;
  }

  return (
    <div >
      <div className="flex flex-col gap-4 w-full mx-auto pb-6 md:flex-row md:justify-between  md:px-4 ">  
          
            <Button
              variant="ghost"
              onClick={() => router.push("/protected/admin")}
              className="text-blue-600 text-base underline w-full md:w-auto flex-shrink-0"
            >
              Volver
            </Button>
          
            <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setVistaActiva('usuarios')}
                className={`flex-1 px-4 py-2 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'usuarios' ? 'bg-blue-100 text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                Usuarios
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('asistencia')}
                className={`flex-1 px-4 py-2 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'asistencia' ? 'bg-green-100 text-green-800 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                Asistencia
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('comisiones')}
                className={`flex-1 px-4 py-2 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'comisiones' ? 'bg-purple-100 text-purple-600 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                Comisiones
              </button>
            </div>
      </div>

      <AnimatePresence mode="wait">
        {vistaActiva === 'usuarios' && (
          <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <UsersTable usuarios={usuariosFiltrados} rolActual={rolActual} />
          </motion.div>
        )}
        {vistaActiva === 'asistencia' && (
          <motion.div key="asistencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <AsistenciaTable registros={asistenciasFiltradas} rolActual={rolActual} />
          </motion.div>
        )}
        {vistaActiva === 'comisiones' && (
          <motion.div key="comisiones" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <VerComision usuarios={usuariosFiltrados} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}