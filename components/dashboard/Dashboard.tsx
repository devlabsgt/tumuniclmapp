'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, BookOpen, Leaf, Building, Users, Settings, FileText, User, CalendarDays } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion, AnimatePresence } from 'framer-motion';
import useUserData from '@/hooks/useUserData';
import Asistencia from '@/components/asistencia/Asistencia';
import Ver from '@/components/perfil/Ver';

const TODOS_LOS_MODULOS = [
  { nombre: 'EDUCACION', titulo: 'Educación', descripcion: 'Administre programas, niveles, maestros y alumnos.', ruta: '/protected/educacion', icono: <BookOpen className="h-8 w-8 text-blue-500" /> },
  { nombre: 'FERTILIZANTE', titulo: 'Desarrollo Económico Social', descripcion: 'Gestione beneficiarios, entregas y estadísticas.', ruta: '/protected/fertilizante/beneficiarios', icono: <Leaf className="h-8 w-8 text-teal-500" /> },
  { nombre: 'ORGANOS', titulo: 'Jerarquía Municipal', descripcion: 'Gestione Órganos y políticas municipales.', ruta: '/protected/admin/organos', icono: <Building className="h-8 w-8 text-orange-700" /> },
  { nombre: 'AGENDA_CONCEJO', titulo: 'Agenda de Concejo', descripcion: 'Consulte y gestione las próximas reuniones del concejo.', ruta: '/protected/concejo/', icono: <CalendarDays className="h-8 w-8 text-purple-500" /> },
];

type Vistas = 'modulos' | 'asistencia' | 'perfil';

export default function Dashboard() {
  const router = useRouter();
  const { rol, modulos, permisos, nombre } = useUserData();
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState<Vistas>('modulos');
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);
  const usuariosRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (usuariosRef.current && !usuariosRef.current.contains(event.target as Node)) setMostrarUsuarios(false);
      if (configRef.current && !configRef.current.contains(event.target as Node)) setMostrarOpciones(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const irA = async (nombreModulo: string, ruta: string) => {
    await registrarLog({ accion: 'INGRESO_MODULO', descripcion: `Accedió al módulo de ${nombreModulo.toLowerCase()}`, nombreModulo });
    router.push(ruta);
  };

  const irAConLog = async (ruta: string, nombreModulo: string, descripcion: string) => {
    await registrarLog({ accion: 'INGRESO_MODULO', descripcion, nombreModulo });
    router.push(ruta);
  };

  const modulosDisponibles = useMemo(() =>
    TODOS_LOS_MODULOS
      .filter(m => {
        if (rol === 'SUPER') return true;
        if (m.nombre === 'AGENDA_CONCEJO') {
          return ['ADMINISTRADOR', 'CONCEJAL'].includes(rol);
        }
        return modulos.includes(m.nombre);
      })
      .sort((a, b) => a.titulo.localeCompare(b.titulo))
  , [rol, modulos]);

  const modulosFiltrados = modulosDisponibles.filter(m =>
    m.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-2">
      <div className="w-full grid grid-cols-1 sm:grid-cols-7 gap-4 mb-4">
        {permisos.includes('CONFIGURACION') && (rol === 'ADMINISTRADOR' || rol === 'SUPER') && (
          <div className="relative sm:col-span-2" ref={configRef}>
            <Button onClick={() => { setMostrarOpciones(p => !p); setMostrarUsuarios(false); }} className="w-full gap-2 text-xl h-14">
              <Settings size={25} /> Configuraciones
            </Button>
            {mostrarOpciones && (
              <motion.div className="absolute top-full mt-2 right-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded-lg border dark:border-gray-700 p-2 flex flex-col items-start gap-2 w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                <Button variant="ghost" className="w-full justify-center gap-2 text-xl" onClick={() => router.push('/protected/admin/configs/roles')}> <Users size={20} /> Roles </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-xl" onClick={() => router.push('/protected/admin/configs/modulos')}> <Settings size={20} /> Módulos </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-xl" onClick={() => router.push('/protected/admin/logs')}> <FileText size={20} /> Logs </Button>
              </motion.div>
            )}
          </div>
        )}

        <div className="relative sm:col-span-2" ref={usuariosRef}>
          <Button onClick={() => { setMostrarUsuarios(p => !p); setMostrarOpciones(false); }} className="w-full gap-2 text-xl h-14 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Users size={25} /> Gestionar Usuarios
          </Button>
          {mostrarUsuarios && (
            <motion.div className="absolute top-full mt-2 left-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded-lg border dark:border-gray-700 p-2 flex flex-col items-start gap-2 w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
             {(rol === 'ADMIN' || rol === 'SUPER') && (
              <Button variant="ghost" className="w-full justify-center gap-2 text-xl" onClick={() => irAConLog('/protected/admin/users', 'USUARIOS', 'Accedió al módulo de usuarios')}>
                <Users size={25} /> Ver Usuarios
              </Button>
                )}
              <Button variant="ghost" className="w-full justify-center gap-2 text-xl" onClick={() => { setMostrarUsuarios(false); setVistaActiva('perfil'); }}>
                <User size={25} /> Ver mi perfil
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 sm:col-span-3">
          <button
            type="button"
            onClick={() => setVistaActiva('modulos')}
            className={`flex-1 rounded-md text-base font-semibold transition-all duration-200 ${
              vistaActiva === 'modulos' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Módulos
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('asistencia')}
            className={`flex-1 rounded-md text-base font-semibold transition-all duration-200 ${
              vistaActiva === 'asistencia' ? 'bg-blue-100 text-blue-800 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Asistencia
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {vistaActiva === 'modulos' ? (
          <motion.div key="modulos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              {modulosFiltrados.map((modulo, index) => (
                <motion.div key={modulo.nombre} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 flex flex-col justify-between h-full hover:shadow-lg transition-shadow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}>
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      {modulo.icono}
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{modulo.titulo}</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{modulo.descripcion}</p>
                  </div>
                  <Button onClick={() => irA(modulo.nombre, modulo.ruta)} className="w-full mt-auto"> Entrar <ArrowRight className="h-4 w-4 ml-2" /> </Button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : vistaActiva === 'asistencia' ? (
          <motion.div key="asistencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Asistencia />
          </motion.div>
        ) : (
          <motion.div key="perfil" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Ver />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}