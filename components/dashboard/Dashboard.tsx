'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Settings, FileText } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion, AnimatePresence } from 'framer-motion';
import useUserData from '@/hooks/sesion/useUserData';
import Asistencia from '@/components/asistencia/Asistencia';
import VerMiPerfil from '@/components/perfil/Ver';
import AnimatedIcon from '@/components/ui/AnimatedIcon';

const TODOS_LOS_MODULOS = [
  { 
    nombre: 'EDUCACION', 
    titulo: 'Educación', 
    descripcion: 'Administre programas, niveles, maestros y alumnos.', 
    ruta: '/protected/educacion', 
    iconoKey: 'upgronsr',
    colorProps: { primaryColor: '#4bb3fd' } 
  },
  { 
    nombre: 'FERTILIZANTE', 
    titulo: 'Desarrollo Económico Social', 
    descripcion: 'Gestione beneficiarios, entregas y estadísticas.', 
    ruta: '/protected/fertilizante/beneficiarios', 
    iconoKey: 'bikvuqcq',
    colorProps: { primaryColor: '#ffc738', secondaryColor: '#4ade80'} 
  },
  { 
    nombre: 'ORGANOS', 
    titulo: 'Jerarquía Municipal', 
    descripcion: 'Gestione Órganos y políticas municipales.', 
    ruta: '/protected/admin/organos', 
    iconoKey: 'ilrifayj',
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#b26836' } 
  },
  { 
    nombre: 'AGENDA_CONCEJO', 
    titulo: 'Agenda de Concejo', 
    descripcion: 'Consulte y gestione las próximas reuniones del concejo.', 
    ruta: '/protected/concejo/agenda/', 
    iconoKey: 'yxsbonud',
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#4bb3fd' } 
  },
  { 
    nombre: 'PERSONAL', 
    titulo: 'Gestión de Personal', 
    descripcion: 'Gestione los datos y el historial de los empleados.', 
    ruta: '/protected/admin/users', 
    iconoKey: 'daeumrty',
  },
];

type Vistas = 'modulos' | 'asistencia';

export default function Dashboard() {
  const router = useRouter();
  const userData = useUserData();
  const { rol, modulos, permisos } = userData;
  const [vistaActiva, setVistaActiva] = useState<Vistas>('modulos');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [mostrarPerfilModal, setMostrarPerfilModal] = useState(false);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const configRef = useRef<HTMLDivElement>(null);

  // Efecto para deshabilitar el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (mostrarPerfilModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mostrarPerfilModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) setMostrarOpciones(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const irA = async (nombreModulo: string, ruta: string) => {
    await registrarLog({ accion: 'INGRESO_MODULO', descripcion: `Accedió al módulo de ${nombreModulo.toLowerCase()}`, nombreModulo });
    if (window.innerWidth < 768) {
      setTimeout(() => router.push(ruta), 1000);
    } else {
      router.push(ruta);
    }
  };

  const irAConLog = async (ruta: string, nombreModulo: string, descripcion: string) => {
    await registrarLog({ accion: 'INGRESO_MODULO', descripcion, nombreModulo });
    router.push(ruta);
  };

  const modulosDisponibles = useMemo(() =>
    TODOS_LOS_MODULOS
      .filter(m => {
        if (rol === 'SUPER' || rol === 'RRHH') {
          // 💡 Los roles SUPER y RRHH tienen acceso a todos excepto a los módulos específicos.
          if (rol === 'RRHH' && (m.nombre === 'ORGANOS' || m.nombre === 'AGENDA_CONCEJO')) {
            return false;
          }
          return true;
        }
        if (m.nombre === 'AGENDA_CONCEJO') {
          return ['ADMINISTRADOR', 'CONCEJAL', 'SECRETARIA'].includes(rol as string);
        }
        return modulos.includes(m.nombre);
      })
      .sort((a, b) => a.titulo.localeCompare(b.titulo))
  , [rol, modulos]);

  return (
    <section className="w-full max-w-4xl mx-auto px-4 md:px-8 pt-2">
      <div className="w-full grid grid-cols-1 sm:grid-cols-7 gap-4 mb-8">
        {(permisos.includes('CONFIGURACION') && (rol === 'ADMINISTRADOR' || rol === 'SUPER')) && (
          <div 
            className="relative sm:col-span-2" 
            ref={configRef}
            onMouseEnter={() => setHoveredButton('config')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Button onClick={() => { setMostrarOpciones(p => !p); }} className="w-full gap-2 text-base md:text-xl h-14">
              <AnimatedIcon iconKey="cgolfevh" primaryColor="#fff" className="w-7 h-7" trigger={hoveredButton === 'config' ? 'loop' : undefined} />
              Configuraciones
            </Button>
            {mostrarOpciones && (
              <motion.div className="absolute top-full mt-2 right-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded-lg border dark:border-gray-700 p-2 flex flex-col items-start gap-2 w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => router.push('/protected/admin/configs/roles')}> <Users size={20} /> Roles </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => router.push('/protected/admin/configs/modulos')}> <Settings size={20} /> Módulos </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => router.push('/protected/admin/logs')}> <FileText size={20} /> Logs </Button>
              </motion.div>
            )}
          </div>
        )}

        <div className="relative sm:col-span-2" onMouseEnter={() => setHoveredButton('profile')} onMouseLeave={() => setHoveredButton(null)}>
          <Button onClick={() => setMostrarPerfilModal(true)} className="w-full gap-2 text-base md:text-xl h-14 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <AnimatedIcon iconKey="hroklero" className="w-8 h-8" trigger={hoveredButton === 'profile' ? 'loop' : undefined}  />
            Ver mi perfil
          </Button>
        </div>

        <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 sm:col-span-3">
          <button type="button" onClick={() => setVistaActiva('modulos')} className={`flex-1 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'modulos' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Módulos
          </button>
          <button type="button" onClick={() => setVistaActiva('asistencia')} className={`flex-1 rounded-md text-sm md:text-base font-semibold transition-all duration-200 ${vistaActiva === 'asistencia' ? 'bg-blue-100 text-blue-800 shadow' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Asistencia
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {vistaActiva === 'modulos' ? (
          <motion.div key="modulos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-1 gap-6">
              {modulosDisponibles.map((modulo) => (
                <motion.div 
                  key={modulo.nombre} 
                  className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 sm:p-6 flex flex-row items-center gap-4 sm:gap-6 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-300" 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4 }}
                  onClick={() => irA(modulo.nombre, modulo.ruta)}
                  onMouseEnter={() => setHoveredModule(modulo.nombre)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <AnimatedIcon
                    iconKey={modulo.iconoKey}
                    className="w-14 h-14 sm:w-20 sm:h-20"
                    trigger={hoveredModule === modulo.nombre ? 'loop' : undefined}
                    {...modulo.colorProps}
                  />
                  <div className="flex-grow">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{modulo.titulo}</h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{modulo.descripcion}</p>
                  </div>
                  <Button className="pointer-events-none hidden sm:inline-flex"> Entrar <ArrowRight className="h-4 w-4 ml-2" /> </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="asistencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Asistencia />
          </motion.div>
        )}
      </AnimatePresence>

      {mostrarPerfilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/50 backdrop-blur-sm"> {/* Fondo gris claro y borroso */}
          <motion.div
            className="relative bg-white dark:bg-gray-800 p-8 pt-16 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button
              onClick={() => setMostrarPerfilModal(false)}
              className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full p-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <VerMiPerfil userData={userData} />
          </motion.div>
        </div>
      )}
    </section>
  );
}