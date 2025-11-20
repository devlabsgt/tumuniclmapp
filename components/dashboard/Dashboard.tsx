'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Settings, FileText, Clock } from 'lucide-react';
import { registrarLog } from '@/utils/registrarLog';
import { motion, AnimatePresence } from 'framer-motion';

import useUserData from '@/hooks/sesion/useUserData';

import Asistencia from '@/components/asistencia/Asistencia';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import MisComisiones from '@/components/comisiones/asistencia/MisComisiones';
import HorarioSistema from '@/components/admin/sistema/HorarioSistema';
import TarjetaEmpleado from '@/components/admin/dependencias/TarjetaEmpleado';
import SubscribeButton from '@/components/SubscribeButton';

const TODOS_LOS_MODULOS = [
  {
    nombre: 'EDUCACION',
    titulo: 'Política de Educación',
    descripcion: 'Administre programas, niveles, maestros y alumnos.',
    ruta: '/protected/educacion',
    iconoKey: 'upgronsr',
    colorProps: { primaryColor: '#4bb3fd' },
    categoria: 'Políticas Públicas',
  },
  {
    nombre: 'FERTILIZANTE',
    titulo: 'Política de Desarrollo Económico Local',
    descripcion: 'Gestione beneficiarios, entregas y estadísticas.',
    ruta: '/protected/fertilizante/beneficiarios',
    iconoKey: 'bikvuqcq',
    colorProps: { primaryFrom: '#ffc738', secondaryColor: '#4ade80' },
    categoria: 'Políticas Públicas'
  },
  {
    nombre: 'ORGANOS',
    titulo: 'Estructura Organizacional',
    descripcion: 'Gestione Órganos y políticas municipales.',
    ruta: '/protected/admin/dependencias',
    iconoKey: 'ilrifayj',
    colorProps: { primaryFrom: '#ebe6ef', primaryTo: '#b26836' },
    categoria: 'Gestión Administrativa',
  },
  {
    nombre: 'AGENDA_CONCEJO',
    titulo: 'Agenda de Concejo',
    descripcion: 'Consulte y gestione las próximas reuniones del concejo.',
    ruta: '/protected/concejo/agenda/',
    iconoKey: 'yxsbonud',
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#4bb3fd' },
    categoria: 'Gestión Administrativa'
  },
  {
    nombre: 'RRHH',
    titulo: 'Gestión de Personal',
    descripcion: 'Gestione los datos y el historial de los empleados.',
    ruta: '/protected/admin/users',
    iconoKey: 'daeumrty',
    categoria: 'Gestión Administrativa'
  },
  {
    nombre: 'ASISTENCIA',
    titulo: 'Control de Asistencia',
    descripcion: 'Supervise la asistencia de su equipo.',
    ruta: '/protected/asistencias',
    iconoKey: 'sgtmgpft',
    categoria: 'Gestión Administrativa'
  },
  {
    nombre: 'COMISIONES',
    titulo: 'Gestión de Comisiones',
    descripcion: 'Cree, apruebe y gestione las comisiones.',
    ruta: '/protected/comisiones',
    iconoKey: 'vqkaxtlm',
    categoria: 'Gestión Administrativa'
  },
];

type Vistas = 'modulos' | 'asistencia' | 'comisiones';

export default function Dashboard() {
  const router = useRouter();
  
  const { rol, modulos = [], permisos = [], userId, esjefe } = useUserData();

  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [mostrarTarjetaModal, setMostrarTarjetaModal] = useState(false);
  const [mostrarHorarioModal, setMostrarHorarioModal] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<Vistas>('modulos');
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mostrarTarjetaModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mostrarTarjetaModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) setMostrarOpciones(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const irA = (nombreModulo: string, ruta: string) => {
    if (ruta === '#') return;
    setLoadingModule(nombreModulo);
    if (nombreModulo && ruta) {
      registrarLog({ accion: 'INGRESO_MODULO', descripcion: `Accedió al módulo de ${nombreModulo.toLowerCase()}`, nombreModulo });
      setTimeout(() => {
        router.push(ruta);
      }, 0);
    }
  };

  const modulosDisponibles = useMemo(() =>
    TODOS_LOS_MODULOS
      .filter(m => {
        if (rol === 'SUPER') return true;

        if (rol === 'INVITADO') return true;

        const tieneModuloAsignado = modulos.includes(m.nombre);
       
        if (m.nombre === 'COMISIONES') {
          return esjefe || rol === 'RRHH' || rol === 'SECRETARIO' || tieneModuloAsignado;
        }

        if (m.nombre === 'ASISTENCIA') {
            return esjefe || tieneModuloAsignado;
        }
        
        return tieneModuloAsignado;
      })
      .sort((a, b) => a.titulo.localeCompare(b.titulo))
    , [rol, modulos, esjefe]);

  const modulosPoliticas = useMemo(() =>
    modulosDisponibles.filter(m => m.categoria === 'Políticas Públicas'),
    [modulosDisponibles]
  );

  const modulosGestion = useMemo(() =>
    modulosDisponibles.filter(m => m.categoria === 'Gestión Administrativa'),
    [modulosDisponibles]
  );

  const cardVariants = {
    loading: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 10px 15px -3px rgba(107, 114, 128, 0.1)",
        "0 20px 25px -5px rgba(107, 114, 128, 0.25)",
        "0 10px 15px -3px rgba(107, 114, 128, 0.1)",
      ],
    },
    idle: {
      scale: 1,
      boxShadow: "0 0px 0px 0px rgba(0,0,0,0)",
    }
  };

  const hoverEffect = {
    scale: 1.01,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  };

  const renderModuleCard = (modulo: typeof TODOS_LOS_MODULOS[0]) => {
    const isLoadingThisModule = loadingModule === modulo.nombre;
    const isDummy = modulo.ruta === '#';
    return (
      <motion.div
        key={modulo.nombre}
        className={`group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl py-4 px-2 flex flex-row items-center text-left transition-opacity duration-300 w-full ${loadingModule && !isLoadingThisModule ? 'opacity-25 pointer-events-none' : ''} ${isDummy ? 'cursor-default' : 'cursor-pointer'}`}
        variants={cardVariants}
        animate={isLoadingThisModule ? 'loading' : 'idle'}
        whileHover={!loadingModule && !isDummy ? hoverEffect : {}}
        transition={isLoadingThisModule ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        onClick={loadingModule ? undefined : () => irA(modulo.nombre, modulo.ruta)}
        onMouseEnter={() => setHoveredModule(modulo.nombre)}
        onMouseLeave={() => setHoveredModule(null)}
      >
        {!isDummy && (
          <Button
            variant="ghost"
            className="absolute bottom-3 right-3 h-8 p-0 flex items-center justify-center rounded-full w-8 bg-transparent 
                       group-hover:w-24 group-hover:bg-blue-500 opacity-0 group-hover:opacity-100
                       transition-all duration-300 ease-in-out overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              if (!loadingModule) irA(modulo.nombre, modulo.ruta);
            }}
            aria-label={`Entrar al módulo ${modulo.titulo}`}
          >
            <span className="flex items-center px-2">
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-blue-500 group-hover:text-white transition-colors duration-200" />
              <span className="ml-2 text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-150 duration-200">
                Entrar
              </span>
            </span>
          </Button>
        )}
        
        <div className="w-1/5 flex-shrink-0 flex items-center justify-center">
            <AnimatedIcon
              iconKey={modulo.iconoKey}
              className="w-14 h-14"
              trigger={hoveredModule === modulo.nombre ? 'loop' : undefined}
              {...modulo.colorProps}
            />
        </div>
        <div className="w-4/5 pl-4">
            <h2 className="text-base lg:text-xl font-bold text-gray-800 dark:text-gray-100">{modulo.titulo}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-opacity duration-300 group-hover:opacity-0">{modulo.descripcion}</p>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="w-full mx-auto px-4 md:px-8 pt-2">

<div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-8 gap-4 mb-6">

        {(permisos.includes('CONFIGURACION') && rol === 'SUPER') && (
          <div
            className="relative sm:col-span-2 order-3 sm:order-1"
            ref={configRef}
            onMouseEnter={() => setHoveredButton('config')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Button onClick={() => { setMostrarOpciones(p => !p); }} className="w-full gap-2 text-base md:text-xl h-14">
              <AnimatedIcon iconKey="cgolfevh" primaryColor="#fff" className="w-7 h-7" trigger={hoveredButton === 'profile' ? 'loop' : undefined} />
              Configuraciones
            </Button>
            {mostrarOpciones && (
              <motion.div className="absolute top-full mt-2 right-0 z-10 bg-white dark:bg-gray-900 shadow-xl rounded-lg border dark:border-gray-700 p-2 flex flex-col items-start gap-2 w-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => router.push('/protected/admin/configs/roles')}> <Users size={20} /> Roles </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => router.push('/protected/admin/configs/modulos')}> <Settings size={20} /> Módulos </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => router.push('/protected/admin/logs')}> <FileText size={20} /> Logs </Button>
                <Button variant="ghost" className="w-full justify-center gap-2 text-base" onClick={() => { setMostrarHorarioModal(true); setMostrarOpciones(false); }}> <Clock size={20} /> Horario Sistema </Button>
              </motion.div>
            )}
          </div>
        )}

        <div className="flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 sm:col-span-3 order-1 sm:order-2">
          <button type="button" onClick={() => setVistaActiva('modulos')} className={`flex-1 rounded-md transition-all duration-200 ${vistaActiva === 'modulos' ? 'bg-blue-100 text-blue-600 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}>
            Módulos
          </button>
          <button type="button" onClick={() => setVistaActiva('asistencia')} className={`flex-1 rounded-md transition-all duration-200 ${vistaActiva === 'asistencia' ? 'bg-green-100 text-green-800 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}>
            Asistencia
          </button>
          <button type="button" onClick={() => setVistaActiva('comisiones')} className={`flex-1 rounded-md transition-all duration-200 ${vistaActiva === 'comisiones' ? 'bg-purple-100 text-purple-600 font-bold shadow text-sm' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}>
            Comisiones
          </button>
        </div>

        <div className="relative sm:col-span-3 order-2 sm:order-3 flex gap-2" onMouseEnter={() => setHoveredButton('profile')} onMouseLeave={() => setHoveredButton(null)}>
          <Button onClick={() => setMostrarTarjetaModal(p => !p)} className="w-[80%] gap-2 text-base md:text-xl h-14 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <AnimatedIcon iconKey="hroklero" className="w-8 h-8" trigger={hoveredButton === 'profile' ? 'loop' : undefined} />
            Mi Información
          </Button>
          <div className="w-[20%] min-w-[3.5rem]">
            {userId && <SubscribeButton userId={userId} />}
          </div>
        </div>

      </div>

      <TarjetaEmpleado
        isOpen={mostrarTarjetaModal}
        onClose={() => setMostrarTarjetaModal(false)}
        userId={userId} 
      />

      <AnimatePresence mode="wait">
        {vistaActiva === 'modulos' ? (
            <motion.div key="modulos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            
            <div className="w-full lg:max-w-[100%] xl:max-w-[90%] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                
                {modulosPoliticas.length > 0 && (
                  <div className="space-y-4 mb-4">
                    <h2 className="text-2xl font-bold text-blue-600 dark:text-gray-100 mb-4">Políticas Públicas</h2>
                    <div className="space-y-4">
                      {modulosPoliticas.map((modulo) => renderModuleCard(modulo))}
                    </div>
                  </div>
                )}

                {modulosGestion.length > 0 && (
                  <div className="space-y-4 ">
                    <h2 className="text-2xl font-bold text-blue-600 dark:text-gray-100 mb-4">Gestión Administrativa</h2>
                    <div className="space-y-4">
                      {modulosGestion.map((modulo) => renderModuleCard(modulo))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        ) : vistaActiva === 'asistencia' ? (
          <motion.div key="asistencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Asistencia />
          </motion.div>
        ) : (
          <motion.div key="comisiones" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>

            <MisComisiones />
          
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarHorarioModal && <HorarioSistema onClose={() => setMostrarHorarioModal(false)} />}
      </AnimatePresence>
    </section>
  );
}