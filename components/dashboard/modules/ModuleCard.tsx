'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import { registrarLog } from '@/utils/registrarLog';
import { TODOS_LOS_MODULOS } from '../constants';

interface ModuleCardProps {
  modulo: typeof TODOS_LOS_MODULOS[0];
  loadingModule: string | null;
  setLoadingModule: (id: string) => void;
}

export default function ModuleCard({ modulo, loadingModule, setLoadingModule }: ModuleCardProps) {
  const router = useRouter();
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

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

  const isLoadingThisModule = loadingModule === modulo.id;
  const isDummy = modulo.ruta === '#';

  return (
    <motion.div
      className={`group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl py-4 px-2 flex flex-row items-center text-left transition-opacity duration-300 w-full ${loadingModule && !isLoadingThisModule ? 'opacity-25 pointer-events-none' : ''} ${isDummy ? 'cursor-default' : 'cursor-pointer'}`}
      variants={cardVariants}
      animate={isLoadingThisModule ? 'loading' : 'idle'}
      whileHover={!loadingModule && !isDummy ? hoverEffect : {}}
      transition={isLoadingThisModule ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      onClick={loadingModule ? undefined : () => irA(modulo.id, modulo.ruta)}
      onMouseEnter={() => setHoveredModule(modulo.id)}
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
            if (!loadingModule) irA(modulo.id, modulo.ruta);
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
            trigger={hoveredModule === modulo.id ? 'loop' : undefined}
            {...modulo.colorProps} 
          />
      </div>
      <div className="w-4/5 pl-4">
          <h2 className="text-base lg:text-xl font-bold text-gray-800 dark:text-gray-100">{modulo.titulo}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 transition-opacity duration-300 group-hover:opacity-0">{modulo.descripcion}</p>
      </div>
    </motion.div>
  );
}