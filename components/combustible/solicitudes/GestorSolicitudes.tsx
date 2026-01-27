// features/solicitudes/RequestManager.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { CreateRequestModal } from './modals/CrearSolicitud';
import { RequestList } from './SolicitudesList';
import { SolicitudCombustible } from './types';
import { getMySolicitudes } from './actions'; 

export default function RequestManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudCombustible[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. NUEVO ESTADO: Para saber qué solicitud estamos editando (null = modo crear)
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudCombustible | null>(null);

  const fetchSolicitudes = async () => {
    try {
      const data = await getMySolicitudes();
      setSolicitudes(data);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Función para abrir el modal en modo "Crear"
  const handleOpenCreate = () => {
    setEditingSolicitud(null); // Aseguramos que no haya datos basura
    setIsModalOpen(true);
  };

  // Función para abrir el modal en modo "Editar" (se pasa a la lista)
  const handleEdit = (sol: SolicitudCombustible) => {
    setEditingSolicitud(sol);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 w-[95%] max-w-[1450px] mx-auto min-h-screen bg-transparent transition-colors">
        
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gestión de Combustible</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Administre sus solicitudes y comisiones.</p>
        </div>
        
        <button 
          onClick={handleOpenCreate} // Usamos el nuevo handler
          className="bg-slate-900 dark:bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20 dark:shadow-blue-900/20 flex items-center gap-2 font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Nueva Solicitud
        </button>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="space-y-4 animate-pulse w-full">
            <div className="h-12 bg-gray-200 dark:bg-neutral-800 rounded w-full"></div>
            <div className="h-24 bg-gray-200 dark:bg-neutral-800 rounded w-full"></div>
            <div className="h-24 bg-gray-200 dark:bg-neutral-800 rounded w-full"></div>
        </div>
      ) : (
        <RequestList 
            solicitudes={solicitudes} 
            onRefresh={fetchSolicitudes} 
            onEdit={handleEdit} // 2. PASAMOS LA FUNCIÓN AL HIJO
        />
      )}

      {/* MODAL */}
      {isModalOpen && (
        <CreateRequestModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
             fetchSolicitudes();
          }}
          solicitudToEdit={editingSolicitud} // 3. PASAMOS LA DATA AL MODAL
        />
      )}
    </div>
  );
}