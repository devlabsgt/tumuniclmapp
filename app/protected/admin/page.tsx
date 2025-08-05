'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, BookOpen, Leaf, Building, Users, Settings, FileText, User } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion } from 'framer-motion';
import useUserData from '@/hooks/useUserData';

// --- Definición de Módulos ---
const TODOS_LOS_MODULOS = [
  {
    nombre: 'EDUCACION',
    titulo: 'Educación',
    descripcion: 'Administre programas, niveles, maestros y alumnos.',
    ruta: '/protected/admin/educacion',
    icono: <BookOpen className="h-8 w-8 text-blue-500" />,
  },
  {
    nombre: 'FERTILIZANTE',
    titulo: 'Fertilizante',
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

export default function AdminDashboard() {
  const router = useRouter();
  const { rol, modulos, permisos } = useUserData();
  const [busqueda, setBusqueda] = useState('');

  // Estados para los menús desplegables
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);
  const usuariosRef = useRef<HTMLDivElement>(null);

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

  const irAMiPerfil = () => {
    router.push('/protected/user/me');
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
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-8">
        {/* --- BOTONES DE GESTIÓN --- */}
        <motion.div
          className="w-full flex flex-col sm:flex-row sm:justify-between gap-4 items-stretch sm:items-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
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
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={irAMiPerfil}>
                  <User size={20} /> Ver mi perfil
                </Button>
              </motion.div>
            )}
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

        {/* --- TÍTULO Y BUSCADOR --- */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard de Administrador</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Seleccione un módulo para empezar a gestionar.
          </p>
        </motion.div>

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

        {/* --- LISTA DE MÓDULOS --- */}
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
      </section>
    </>
  );
}
