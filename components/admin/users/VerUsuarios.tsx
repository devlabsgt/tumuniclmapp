'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UsersTable from '@/components/admin/users/UsersTable';
import { motion, AnimatePresence } from 'framer-motion';
import AsistenciaTable from '@/components/admin/users/AsistenciaTable';
import useUserData from '@/hooks/sesion/useUserData';
import { useObtenerAsistencias } from '@/hooks/asistencia/useObtenerAsistencias';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';
import Cargando from '@/components/ui/animations/Cargando';

type Vistas = 'usuarios' | 'asistencia';

export default function VerUsuarios() {
  const router = useRouter();
  const { rol: rolActual, cargando: cargandoUsuario } = useUserData();
  
  const [vistaActiva, setVistaActiva] = useState<Vistas>('usuarios');
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFinal, setFechaFinal] = useState<string | null>(null);
  const [oficinaId, setOficinaId] = useState<string | null>(null);

  const { asistencias, loading: cargandoAsistencias } = useObtenerAsistencias(oficinaId, fechaInicio, fechaFinal);
  const { usuarios, loading: cargandoUsuarios } = useListaUsuarios();

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

  if (cargandoUsuario || cargandoUsuarios) {
    return <Cargando texto='Cargando...'/>;
  }

  return (
    <div className='p-0 lg:p-5'>
      <div className="flex flex-col gap-4 w-full mx-auto pb-6 md:flex-row md:justify-between  md:px-4 ">  
            <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setVistaActiva('usuarios')}
                className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${vistaActiva === 'usuarios' ? 'bg-blue-100 text-blue-600 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
              >
                Usuarios
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('asistencia')}
                className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${vistaActiva === 'asistencia' ? 'bg-green-100 text-green-800 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
              >
                Asistencia
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
            <AsistenciaTable 
              registros={asistenciasFiltradas} 
              rolActual={rolActual} 
              loading={cargandoAsistencias}
              setOficinaId={setOficinaId}
              setFechaInicio={setFechaInicio}
              setFechaFinal={setFechaFinal}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}