import React from 'react';
import { UsuarioInfo } from '@/components/combustible/solicitudes/types'; // Ajusta la ruta según tu estructura
import { LUGARES_GT } from '@/components/utils/lugaresGT';

interface Props {
  user: UsuarioInfo | null;
  destino: { depto: string; muni: string };
  setDestino: (val: { depto: string; muni: string }) => void;
}

export const DataSolicitante: React.FC<Props> = ({ user, destino, setDestino }) => {
  
  const handleDeptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepto = e.target.value;
    const firstMuni = LUGARES_GT[newDepto]?.[0] || '';
    setDestino({ depto: newDepto, muni: firstMuni });
  };

  const municipiosDisponibles = LUGARES_GT[destino.depto] || [];

  return (
    <div className="lg:col-span-7 space-y-6">
      {/* SECCIÓN 1: DATOS SOLICITANTE */}
      <section className="bg-gray-50 dark:bg-neutral-800/40 rounded-lg p-5 border border-gray-100 dark:border-neutral-700/50">
        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Datos del Solicitante
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 dark:text-neutral-500 mb-1">Nombre</label>
            <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">
              {user?.nombre || <span className="animate-pulse bg-gray-200 dark:bg-neutral-700 h-4 w-24 rounded inline-block"></span>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-neutral-500 mb-1">Cargo / Dependencia</label>
            <div className="font-medium text-gray-700 dark:text-gray-300">
              {user?.dependencia?.nombre || '...'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-neutral-500 mb-1">Dirección / Oficina</label>
            <div className="font-medium text-gray-700 dark:text-gray-300">
              {user?.dependencia?.padre?.nombre || 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: DESTINO */}
      <section>
        <h3 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-3 pl-1">Destino Principal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="group">
            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1.5 ml-1 group-focus-within:text-blue-600 transition-colors">Departamento</label>
            <select 
              className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[color-scheme:dark]"
              value={destino.depto} 
              onChange={handleDeptoChange}
            >
              {Object.keys(LUGARES_GT).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="group">
            <label className="block text-xs font-semibold text-gray-600 dark:text-neutral-400 mb-1.5 ml-1 group-focus-within:text-blue-600 transition-colors">Municipio</label>
            <select 
              className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm dark:[color-scheme:dark]"
              value={destino.muni} 
              onChange={e => setDestino({...destino, muni: e.target.value})} 
            >
              {municipiosDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};