'use client';

import { Vistas } from '../constants';

interface ViewSwitcherProps {
  vistaActiva: Vistas;
  setVistaActiva: (vista: Vistas) => void;
  isSuper: boolean;
}

export default function ViewSwitcher({ vistaActiva, setVistaActiva, isSuper }: ViewSwitcherProps) {
  return (
    <div className={`flex rounded-lg border border-gray-200 dark:border-neutral-800 p-1 bg-gray-100 dark:bg-neutral-900 h-14 order-1 md:order-3 transition-colors duration-200 ${isSuper ? 'md:col-span-4' : 'md:col-span-6'}`}>
      <button 
        type="button" 
        onClick={() => setVistaActiva('modulos')} 
        className={`flex-1 rounded-md transition-all duration-200 ${
          vistaActiva === 'modulos' 
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm text-sm font-bold' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 text-xs font-semibold'
        }`}
      >
        Módulos
      </button>
      <button 
        type="button" 
        onClick={() => setVistaActiva('asistencia')} 
        className={`flex-1 rounded-md transition-all duration-200 ${
          vistaActiva === 'asistencia' 
            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 shadow-sm text-sm font-bold' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 text-xs font-semibold'
        }`}
      >
        Asistencia
      </button>
      <button 
        type="button" 
        onClick={() => setVistaActiva('comisiones')} 
        className={`flex-1 rounded-md transition-all duration-200 ${
          vistaActiva === 'comisiones' 
            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-bold shadow-sm text-sm' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 text-xs font-semibold'
        }`}
      >
        Comisiones
      </button>
    </div>
  );
}