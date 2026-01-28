// components/combustible/entregaCupon/modals/ListSolicitud.tsx
'use client'

import React, { useState, useMemo } from 'react';
import { useSolicitudes } from './lib/hooks'; 
import { SolicitudEntrega } from './lib/schemas';
import { EntregaItem } from './EntregaItem';
import AprobacionSolicitud from './modals/AprobacionSolicitud'; 

interface Props {
  initialData: SolicitudEntrega[];
}

export default function ListSolicitud({ initialData }: Props) {
  const { solicitudes, loading, refresh, updateLocalSolicitud } = useSolicitudes(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEntrega | null>(null);

  const filteredSolicitudes = useMemo(() => {
    if (!searchTerm) return solicitudes;
    const lowerTerm = searchTerm.toLowerCase();
    return solicitudes.filter(s => 
      s.placa.toLowerCase().includes(lowerTerm) ||
      s.municipio_destino.toLowerCase().includes(lowerTerm) ||
      (s.usuario?.nombre || '').toLowerCase().includes(lowerTerm)
    );
  }, [solicitudes, searchTerm]);

  // CAMBIO CLAVE: Aceptamos el 'nuevoEstado' que envía el modal
  const handleCloseModal = (nuevoEstado?: 'aprobado' | 'rechazado') => {
    // Si 'nuevoEstado' tiene valor, es que la operación fue exitosa
    if (nuevoEstado && selectedSolicitud) {
        // 1. Actualización Optimista: ¡Cambio instantáneo en pantalla!
        updateLocalSolicitud(selectedSolicitud.id, { estado: nuevoEstado });
        
        // 2. Refrescar datos reales del servidor
        refresh();
    }
    
    setSelectedSolicitud(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full">
      {/* ... (Tu barra de control igual) ... */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm sticky top-0 z-30">
        <div className="relative w-full sm:w-96">
            <input 
                type="text"
                placeholder="Buscar por placa, destino o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button 
            onClick={refresh} 
            disabled={loading}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {loading ? 'Actualizando...' : 'Actualizar Lista'}
        </button>
      </div>

      {/* LISTA VERTICAL */}
      <div className="flex flex-col gap-4">
        {filteredSolicitudes.length > 0 ? (
            filteredSolicitudes.map((sol) => (
                <EntregaItem 
                    key={sol.id} 
                    sol={sol} 
                    onClick={(item) => setSelectedSolicitud(item)}
                />
            ))
        ) : (
            <div className="py-16 text-center bg-gray-50 dark:bg-neutral-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-800">
                <p className="text-gray-500">No se encontraron solicitudes.</p>
            </div>
        )}
      </div>

      {/* RENDERIZADO DEL MODAL */}
      {selectedSolicitud && (
        <AprobacionSolicitud 
            isOpen={!!selectedSolicitud}
            solicitud={selectedSolicitud}
            onClose={() => handleCloseModal()} // Cerrar sin cambios
            onSuccess={(estado) => handleCloseModal(estado)} // Éxito con estado nuevo
        />
      )}
    </div>
  );
}