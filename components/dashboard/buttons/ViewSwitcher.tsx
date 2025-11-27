'use client';

import { Vistas } from '../constants';

interface ViewSwitcherProps {
  vistaActiva: Vistas;
  setVistaActiva: (vista: Vistas) => void;
  isSuper: boolean;
}

export default function ViewSwitcher({ vistaActiva, setVistaActiva, isSuper }: ViewSwitcherProps) {
  return (
    <div className={`flex rounded-lg border p-1 bg-gray-100 dark:bg-gray-800 h-14 order-1 md:order-3 ${isSuper ? 'md:col-span-4' : 'md:col-span-6'}`}>
      <button 
        type="button" 
        onClick={() => setVistaActiva('modulos')} 
        className={`flex-1 rounded-md transition-all duration-200 ${vistaActiva === 'modulos' ? 'bg-blue-100 text-blue-600 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
      >
        Módulos
      </button>
      <button 
        type="button" 
        onClick={() => setVistaActiva('asistencia')} 
        className={`flex-1 rounded-md transition-all duration-200 ${vistaActiva === 'asistencia' ? 'bg-green-100 text-green-800 shadow text-sm font-bold' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
      >
        Asistencia
      </button>
      <button 
        type="button" 
        onClick={() => setVistaActiva('comisiones')} 
        className={`flex-1 rounded-md transition-all duration-200 ${vistaActiva === 'comisiones' ? 'bg-purple-100 text-purple-600 font-bold shadow text-sm' : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold'}`}
      >
        Comisiones
      </button>
    </div>
  );
}