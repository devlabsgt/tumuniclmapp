'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Users } from 'lucide-react';
import { obtenerEstructuraCompleta } from './actions';
import Cargando from '@/components/ui/animations/Cargando';
import Estructura from './Estructura';
import Jefes from './Jefes';
import { Button } from '@/components/ui/button';

export default function VerJefes() {
  const [datos, setDatos] = useState<{dependencias: any[], usuarios: any[]}>({ dependencias: [], usuarios: [] });
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'estructura' | 'jefes'>('estructura');

  const cargar = async () => {
    setLoading(true);
    const res = await obtenerEstructuraCompleta();
    setDatos(res);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="w-full lg:w-[85%] mx-auto md:px-4 transition-all duration-300">
      <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-gray-100 dark:border-neutral-800 transition-colors duration-200">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-2 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              {vista === 'estructura' ? <LayoutGrid size={20} /> : <Users size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">
                {vista === 'estructura' ? 'Estructura de Mando' : 'Listado de Jefes'}
              </h2>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Gestión Administrativa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex bg-slate-100 dark:bg-neutral-950 p-1 rounded-md w-full md:w-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setVista('estructura')}
              className={`text-xs font-bold uppercase h-8 md:h-7 ${vista === 'estructura' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Estructura
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setVista('jefes')}
              className={`text-xs font-bold uppercase h-8 md:h-7 ${vista === 'jefes' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Jefes
            </Button>
          </div>
        </div>

        {loading ? <Cargando texto="Cargando datos..." /> : (
          vista === 'estructura' 
            ? <Estructura datos={datos} onReload={cargar} />
            : <Jefes datos={datos} />
        )}
      </div>
    </div>
  );
}