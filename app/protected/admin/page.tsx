'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, BookOpen, Leaf, Building, Users, Settings, FileText, User, Clock } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion, AnimatePresence } from 'framer-motion';
import useUserData from '@/hooks/useUserData';
import LoadingAnimation from '@/components/ui/animations/LoadingAnimation';
import Asistencia from '@/components/asistencia/Asistencia';
import Ver from '@/components/perfil/Ver';

// --- Definición de Módulos ---
const TODOS_LOS_MODULOS = [
  {
    nombre: 'EDUCACION',
    titulo: 'Educación',
    descripcion: 'Administre programas, niveles, maestros y alumnos.',
    ruta: '/protected/educacion',
    icono: <BookOpen className="h-8 w-8 text-blue-500" />,
  },
  {
    nombre: 'FERTILIZANTE',
    titulo: 'Desarrollo Enonómico Social',
    descripcion: 'Gestione beneficiarios, entregas y estadísticas.',
    ruta: '/protected/fertilizante/beneficiarios',
    icono: <Leaf className="h-8 w-8 text-teal-500" />,
  },
  {
    nombre: 'ORGANOS',
    titulo: 'Jerarquía Municipal',
    descripcion: 'Gestione Órganos y políticas municipales.',
    ruta: '/protected/admin/organos',
    icono: <Building className="h-8 w-8 text-orange-700" />,
  },
];

// Definición de las vistas
type Vistas = 'modulos' | 'asistencia' | 'perfil';

export default function AdminDashboard() {
  const router = useRouter();
  const { rol, modulos, permisos, nombre } = useUserData();
  const [busqueda, setBusqueda] = useState('');

  // Estados para los menús desplegables
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);
  const usuariosRef = useRef<HTMLDivElement>(null);

  // Estado para las vistas
  const [vistaActiva, setVistaActiva] = useState<Vistas>('modulos');

  // Hook para cerrar los menús al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (usuariosRef.current && !usuariosRef.current.contains(event.target as Node)) {
        setMostrarUsuarios(false);
      }
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setMostrarOpciones(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const irA = async (nombreModulo: string, ruta: string) => {
    await registrarLog({
      accion: 'INGRESO_MODULO',
      descripcion: `Accedió al módulo de ${nombreModulo.toLowerCase()}`,
      nombreModulo: nombreModulo,
    });
    router.push(ruta);
  };

  const irAUsuarios = async () => {
    await registrarLog({
      accion: 'INGRESO_MODULO',
      descripcion: 'Accedió al módulo de usuarios',
      nombreModulo: 'USUARIOS',
    });
    router.push('/protected/admin/users');
  };

  const handlePerfilClick = () => {
    setMostrarUsuarios(false); // Cierra el menú desplegable si está abierto
    setVistaActiva('perfil');
  };
  
  const handleAsistenciaClick = () => {
    setVistaActiva('asistencia');
  };
  
  const TituloPrincipal = () => {
    switch (vistaActiva) {
      case 'asistencia':
        return { titulo: 'Control de Asistencia', subtitulo: `Gestionando la asistencia para ${nombre || 'el usuario'}` };
      case 'perfil':
        return { titulo: 'Mi Perfil', subtitulo: `Información del usuario ${nombre || ''}` };
      default:
        return { titulo: 'Dashboard de Administrador', subtitulo: 'Seleccione un módulo para empezar a gestionar.' };
    }
  };

  const modulosDisponibles = useMemo(() => {
    return TODOS_LOS_MODULOS
      .filter(modulo => rol === 'SUPER' || modulos.includes(modulo.nombre))
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [rol, modulos]);

  const modulosFiltrados = modulosDisponibles.filter(modulo =>
    modulo.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    modulo.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <LoadingAnimation duration={1000} />
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-8">
        
        {vistaActiva === 'modulos' && (
          <motion.div
            className="w-full flex flex-col sm:flex-row sm:justify-between gap-4 items-stretch sm:items-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Botones */}
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className="relative w-full sm:w-auto" ref={usuariosRef}>
                <Button
                  onClick={() => {
                    setMostrarUsuarios((prev) => !prev);
                    setMostrarOpciones(false);
                  }}
                  className="w-full sm:w-auto gap-2"
                >
                  <Users size={20} />
                  Gestionar Usuarios
                </Button>
                {mostrarUsuarios && (
                  <motion.div
                    className="absolute top-12 left-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded border border-gray-200 dark:border-gray-700 p-2 flex flex-col items-start gap-2 w-56"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={irAUsuarios}>
                      <Users size={20} /> Ver Usuarios
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={handlePerfilClick}>
                      <User size={20} /> Ver mi perfil
                    </Button>
                  </motion.div>
                )}
              </div>
              
              <Button onClick={handleAsistenciaClick} className="w-full sm:w-auto text-lg p-6 gap-2 bg-green-600 hover:bg-green-700">
                <Clock size={22} />
                Marcar Mi Asistencia
              </Button>
            </div>


            {permisos.includes('CONFIGURACION') && (
              <div className="relative w-full sm:w-auto" ref={configRef}>
                <Button
                  onClick={() => {
                    setMostrarOpciones((prev) => !prev);
                    setMostrarUsuarios(false);
                  }}
                  className="w-full sm:w-auto gap-2"
                >
                  <Settings size={20} />
                  Configuraciones
                </Button>
                {mostrarOpciones && (
                  <motion.div
                    className="absolute top-12 right-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded border border-gray-200 dark:border-gray-700 p-2 flex flex-col items-start gap-2 w-56"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/protected/admin/configs/roles')}>
                      <Users size={20} /> Roles
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/protected/admin/configs/modulos')}>
                      <Settings size={20} /> Módulos
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/protected/admin/logs')}>
                      <FileText size={20} /> Logs
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* --- TÍTULO Y BUSCADOR --- */}
        <div className="relative text-center mb-6">
          {vistaActiva !== 'modulos' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 mb-4 sm:mb-0"
            >
              <Button
                variant="link"
                onClick={() => setVistaActiva('modulos')}
                className="w-full sm:w-auto text-blue-600 text-xl flex items-center gap-2 px-0 justify-center sm:justify-start"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver
              </Button>
            </motion.div>
          )}

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold">{TituloPrincipal().titulo}</h1>
            <p className="text-muted-foreground text-lg mt-2">{TituloPrincipal().subtitulo}</p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {vistaActiva === 'modulos' ? (
            <motion.div key="modulos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Input
                  type="text"
                  placeholder="Buscar módulo..."
                  className="w-full max-w-lg mx-auto text-lg p-6"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </motion.div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {modulosFiltrados.map((modulo, index) => (
                  <motion.div
                    key={modulo.nombre}
                    className="bg-white border rounded-xl p-6 flex flex-col justify-between h-full hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        {modulo.icono}
                        <h2 className="text-xl font-bold text-gray-800">{modulo.titulo}</h2>
                      </div>
                      <p className="text-gray-600 mb-6">{modulo.descripcion}</p>
                    </div>
                    <Button onClick={() => irA(modulo.nombre, modulo.ruta)} className="w-full mt-auto">
                      Entrar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
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
    </>
  );
}