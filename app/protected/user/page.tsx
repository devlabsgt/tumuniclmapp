'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, BookOpen, Leaf, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrarLog } from '@/utils/registrarLog';
import useUserData from '@/hooks/useUserData';
import Asistencia from '@/components/asistencia/Asistencia';
import Ver from '@/components/perfil/Ver';

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
    titulo: 'Fertilizante',
    descripcion: 'Gestione beneficiarios, entregas y estadísticas.',
    ruta: '/protected/fertilizante/beneficiarios',
    icono: <Leaf className="h-8 w-8 text-teal-500" />,
  },
];

export default function UserDashboard() {
  const router = useRouter();
  const { modulos, nombre } = useUserData();
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'modulos' | 'asistencia' | 'perfil'>('modulos');

  const irA = async (nombreModulo: string, ruta: string) => {
    await registrarLog({ accion: 'INGRESO_MODULO', descripcion: `Accedió al módulo de ${nombreModulo.toLowerCase()}`, nombreModulo });
    router.push(ruta);
  };
  
  const handlePerfilClick = () => setVistaActiva('perfil');
  const handleAsistenciaClick = () => setVistaActiva('asistencia');

  const modulosDisponibles = useMemo(() => {
    if (!modulos) return [];
    return TODOS_LOS_MODULOS
      .filter(modulo => modulos.includes(modulo.nombre))
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [modulos]);

  const modulosFiltrados = modulosDisponibles.filter(modulo =>
    modulo.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    modulo.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const TituloPrincipal = () => {
    switch (vistaActiva) {
      case 'asistencia':
        return { titulo: 'Control de Asistencia', subtitulo: `Gestionando la asistencia para ${nombre || 'el usuario'}` };
      case 'perfil':
        return { titulo: 'Mi Perfil', subtitulo: `Información del usuario ${nombre || ''}` };
      default:
        return { titulo: 'Dashboard Principal', subtitulo: 'Seleccione una acción o un módulo para comenzar.' };
    }
  };

  return (
    <section className="w-full max-w-6xl p-0">
      {vistaActiva === 'modulos' && (

        <motion.div
          className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button onClick={handlePerfilClick} className="w-full sm:w-auto gap-2">
            <User size={20} />
            Mi Perfil
          </Button>
          <Button onClick={handleAsistenciaClick} className="w-full sm:w-auto text-lg p-6 gap-2 bg-green-600 hover:bg-green-700">
            <Clock size={22} />
            Marcar Mi Asistencia
          </Button>
        </motion.div>
      )}

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
        
        <div className="text-center">
          <motion.h1 key={vistaActiva} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold">
            {TituloPrincipal().titulo}
          </motion.h1>
          <p className="text-muted-foreground text-lg mt-2">{TituloPrincipal().subtitulo}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {vistaActiva === 'modulos' ? (
          <motion.div key="modulos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <Input type="text" placeholder="O buscar un módulo..." className="w-full max-w-lg mx-auto text-lg p-6" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modulosFiltrados.length > 0 ? modulosFiltrados.map((modulo) => (
                <div 
                  key={modulo.nombre} 
                  onClick={() => irA(modulo.nombre, modulo.ruta)}
                  className="bg-white border rounded-xl p-6 flex flex-col justify-between h-full hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-3">{modulo.icono}<h2 className="text-xl font-bold text-gray-800">{modulo.titulo}</h2></div>
                    <p className="text-gray-600 mb-6">{modulo.descripcion}</p>
                  </div>
                  <Button 
                    onClick={(e) => { 
                      e.stopPropagation(); // Evita que el clic se propague al div padre
                      irA(modulo.nombre, modulo.ruta) 
                    }} 
                    className="w-full mt-auto"
                  >
                    Entrar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )) : <p className='col-span-full text-center text-gray-500'>No tiene módulos asignados.</p>}
            </div>
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