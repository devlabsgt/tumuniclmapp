'use client';

import { useState, useMemo } from 'react';
import { Tarea, Usuario } from './types'; 
import TareaItem from './TareaItem';
import NewTarea from './modals/NewTarea'; 
import { Plus, Filter, SearchX } from 'lucide-react';

interface Props {
  tareas: Tarea[];
  usuarios: Usuario[];
  usuarioActual: string;
  esJefe: boolean;
}

export default function TareaList({ tareas, usuarios, usuarioActual, esJefe }: Props) {
  const [filtro, setFiltro] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleAccordion = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // --- 1. Calcular Estados ---
  const tareasConEstadoCalculado = useMemo(() => {
    return tareas.map(t => {
      const esVencida = new Date() > new Date(t.due_date) && t.status !== 'Completado';
      return { ...t, estadoFiltro: esVencida ? 'Vencido' : t.status };
    });
  }, [tareas]);

  // --- 2. Calcular Conteos ---
  const conteos = useMemo(() => {
    return {
      Todos: tareas.length,
      Asignado: tareasConEstadoCalculado.filter(t => t.estadoFiltro === 'Asignado').length,
      'En Proceso': tareasConEstadoCalculado.filter(t => t.estadoFiltro === 'En Proceso').length,
      'Completado': tareasConEstadoCalculado.filter(t => t.estadoFiltro === 'Completado').length,
      'Vencido': tareasConEstadoCalculado.filter(t => t.estadoFiltro === 'Vencido').length,
    };
  }, [tareasConEstadoCalculado, tareas.length]);

  // --- 3. Filtrar ---
  const listaVisual = tareasConEstadoCalculado.filter(t => {
    if (filtro === 'Todos') return true;
    return t.estadoFiltro === filtro;
  });

  const pestañas = ['Todos', 'Asignado', 'En Proceso', 'Completado', 'Vencido'];

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      
      {/* --- CONTROLES SUPERIORES --- */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        
        {/* Pestañas de Filtros - Sticky en móvil para mejor UX */}
        <div className="w-full sm:w-auto sticky top-2 z-30 sm:static">
            {/* Fondo con blur para que el contenido pase por debajo elegantemente */}
            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm w-full overflow-x-auto 
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"> {/* Ocultar scrollbar */}
                
                {pestañas.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setFiltro(tab);
                            // Scroll suave al inicio si cambias de tab
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0
                        ${filtro === tab 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 dark:shadow-none ring-1 ring-blue-500' 
                            : 'bg-transparent text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab === 'Todos' && <Filter size={12} className="opacity-70"/>}
                        {tab.toUpperCase()}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] min-w-[18px] text-center
                        ${filtro === tab 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-gray-500'}`}>
                            {conteos[tab as keyof typeof conteos]}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Botón Nueva Tarea - Arriba en móvil */}
        <div className="w-full sm:w-auto flex justify-end">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
            >
              <Plus size={20} />
              Nueva Tarea
            </button>
        </div>
      </div>

      {/* --- GRID DE TAREAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pb-20"> {/* pb-20 para dar aire al final en móvil */}
        {listaVisual.length === 0 ? (
           // Estado Vacío Optimizado
           <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-24 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800 text-center px-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <SearchX size={32} className="text-slate-300 dark:text-gray-600" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">No hay tareas aquí</h3>
                <p className="text-slate-400 dark:text-gray-500 text-sm mb-4 max-w-xs mx-auto">
                    No se encontraron tareas con el estado <span className="font-medium text-slate-600 dark:text-gray-400">"{filtro}"</span>.
                </p>
                {filtro !== 'Todos' && (
                    <button onClick={() => setFiltro('Todos')} className="px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors">
                        Limpiar filtros
                    </button>
                )}
           </div>
        ) : (
           listaVisual.map((tarea) => (
               <div key={tarea.id} className="h-full">
                   <TareaItem 
                     tarea={tarea} 
                     isExpanded={expandedId === tarea.id}
                     onToggle={() => toggleAccordion(tarea.id)}
                     isJefe={esJefe} 
                   />
               </div>
           ))
        )}
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <NewTarea 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          usuarios={usuarios}
          usuarioActual={usuarioActual}
          esJefe={esJefe}
        />
      )}

    </div>
  );
}