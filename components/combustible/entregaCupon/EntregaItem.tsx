// components/combustible/entregaCupon/modals/EntregaItem.tsx
import React, { useState } from 'react';
import { SolicitudEntrega } from './lib/schemas';

interface Props {
  sol: SolicitudEntrega;
  onClick?: (sol: SolicitudEntrega) => void; 
}

export const EntregaItem: React.FC<Props> = ({ sol, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Cálculos auxiliares
  const totalKms = sol.detalles?.reduce((acc, d) => acc + (d.kilometros_recorrer || 0), 0) || 0;
  
  // Formato fecha simple
  const formatDate = (dateStr: string) => {
    if(!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' });
  };

  return (
    <div className={`
        group w-full bg-white dark:bg-neutral-900 rounded-xl border transition-all duration-300 overflow-hidden
        ${isOpen 
            ? 'border-blue-500/50 shadow-lg ring-1 ring-blue-500/20' 
            : 'border-gray-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-neutral-700 hover:shadow-md'
        }
    `}>
        
        {/* --- HEADER (Siempre Visible) --- */}
        <div 
            onClick={() => setIsOpen(!isOpen)}
            className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none bg-white dark:bg-neutral-900 relative z-10"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Status Icon */}
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0 border
                    ${sol.estado === 'pendiente' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30' : 
                      sol.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : 
                      'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'}
                `}>
                    {sol.estado === 'pendiente' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {sol.estado === 'aprobado' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                    {sol.estado === 'rechazado' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                </div>

                {/* Info Principal */}
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">#{sol.id}</span>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{sol.municipio_destino}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="truncate">{sol.usuario?.nombre}</span>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <span className="hidden sm:inline bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700">
                            {sol.placa}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions & Chevron */}
            <div className="flex items-center gap-3 self-end sm:self-center ml-auto sm:ml-0">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                    sol.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 
                    sol.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                    'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                }`}>
                    {sol.estado}
                </span>

                <div className={`transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>

        {/* --- BODY (Acordeón) --- */}
        <div className={`
            bg-gray-50 dark:bg-neutral-950/50 border-t border-gray-100 dark:border-neutral-800 transition-all duration-300 ease-in-out
            ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMNA 1: RESUMEN */}
                <div className="lg:col-span-1 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest border-b border-gray-200 dark:border-neutral-800 pb-2">
                        Resumen del Viaje
                    </h4>
                    
                    <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-800 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Km Inicial</span>
                                <span className="text-lg font-mono font-medium text-gray-800 dark:text-gray-200">{sol.kilometraje_inicial}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Total Km</span>
                                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{totalKms} km</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Vehículo</span>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{sol.vehiculo?.modelo || 'No especificado'}</div>
                            <div className="flex gap-2 mt-1.5">
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-[10px] rounded border border-gray-200 dark:border-neutral-700 font-mono">
                                    {sol.placa}
                                </span>
                                {sol.vehiculo?.tipo_combustible && (
                                    <span className={`px-1.5 py-0.5 text-[10px] rounded border capitalize font-medium
                                        ${sol.vehiculo.tipo_combustible === 'Diesel' 
                                            ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700' 
                                            : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'}
                                    `}>
                                        {sol.vehiculo.tipo_combustible}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Justificación</span>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed bg-gray-50 dark:bg-neutral-800/50 p-2 rounded">
                                "{sol.justificacion || 'Sin justificación'}"
                            </p>
                        </div>
                    </div>

                    {/* Botón Acción Principal */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClick && onClick(sol); }}
                        disabled={!onClick || sol.estado !== 'pendiente'}
                        className={`w-full py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all
                            ${!onClick || sol.estado !== 'pendiente'
                                ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}
                        `}
                    >
                         {sol.estado === 'pendiente' ? 'Procesar Solicitud' : 'Solicitud Procesada'}
                    </button>
                </div>

                {/* COLUMNA 2: ITINERARIO */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-2 mb-4">
                        <h4 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">
                            Itinerario
                        </h4>
                        <span className="text-[10px] bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-gray-500 font-bold border border-gray-200 dark:border-neutral-700">
                            {sol.detalles?.length || 0} destinos
                        </span>
                    </div>

                    <div className="space-y-3">
                        {sol.detalles?.map((det, idx) => (
                            <div key={idx} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex-1">
                                    <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase mb-1">
                                        {det.lugar_visitar}
                                    </h5>
                                    <span className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                        {det.kilometros_recorrer} km
                                    </span>
                                </div>

                                <div className="flex gap-3 text-[10px] text-gray-500 dark:text-gray-400 w-full md:w-auto bg-gray-50 dark:bg-neutral-800/50 p-2 rounded-md border border-gray-100 dark:border-neutral-800">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-green-600 dark:text-green-500 mb-0.5">SALIDA</span>
                                        <span>{formatDate(det.fecha_inicio)}</span>
                                    </div>
                                    <div className="w-px bg-gray-200 dark:bg-neutral-700"></div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-red-500 mb-0.5">RETORNO</span>
                                        <span>{formatDate(det.fecha_fin)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {(!sol.detalles || sol.detalles.length === 0) && (
                            <div className="text-center py-8 text-gray-400 text-xs italic bg-gray-50 dark:bg-neutral-900 rounded-lg border border-dashed border-gray-200 dark:border-neutral-800">
                                No hay detalles de itinerario registrados.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};