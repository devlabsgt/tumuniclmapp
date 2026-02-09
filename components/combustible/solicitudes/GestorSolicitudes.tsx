// features/solicitudes/RequestManager.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { CreateRequestModal } from './modals/CrearSolicitud';
import { RequestList } from './SolicitudesList';
import { SolicitudCombustible } from './types';
import { getMySolicitudes } from './actions'; 
import { AlertCircle, Lock } from 'lucide-react'; // Importamos iconos para la alerta

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

  // --- LÓGICA DE BLOQUEO ---
  // Buscamos si existe ALGUNA solicitud donde solvente sea explícitamente false
  // (Nota: Asegúrate de haber actualizado actions.ts para traer este campo)
  const hasPendingLiquidation = solicitudes.some(s => s.solvente === false);

  // Función para abrir el modal en modo "Crear"
  const handleOpenCreate = () => {
    if (hasPendingLiquidation) return; // Doble seguridad
    setEditingSolicitud(null); // Aseguramos que no haya datos basura
    setIsModalOpen(true);
  };

  // Función para abrir el modal en modo "Editar" (se pasa a la lista)
  const handleEdit = (sol: SolicitudCombustible) => {
    setEditingSolicitud(sol);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 w-[97%] max-w-[1450px] mx-auto min-h-screen bg-transparent transition-colors">
        
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Mis Solicitudes de Combustible</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Administre sus solicitudes y comisiones.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleOpenCreate} 
              disabled={hasPendingLiquidation || loading}
              className={`
                px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 font-medium text-sm shadow-lg
                ${hasPendingLiquidation
                    ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed border border-gray-300 dark:border-neutral-700 shadow-none'
                    : 'bg-slate-900 dark:bg-blue-700 text-white hover:bg-slate-800 dark:hover:bg-blue-600 shadow-slate-900/20 dark:shadow-blue-900/20'
                }
              `}
              title={hasPendingLiquidation ? "Debe liquidar sus comisiones pendientes antes de crear una nueva solicitud." : "Crear nueva solicitud"}
            >
              {hasPendingLiquidation ? <Lock size={16} /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>}
              Nueva Solicitud
            </button>

            {/* Mensaje de advertencia si está bloqueado */}
            {hasPendingLiquidation && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-md border border-orange-100 dark:border-orange-900/30 animate-in fade-in slide-in-from-right-2">
                    <AlertCircle size={12} />
                    <span>Tiene liquidaciones pendientes</span>
                </div>
            )}
        </div>
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
            onEdit={handleEdit} 
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
          solicitudToEdit={editingSolicitud} 
        />
      )}
    </div>
  );
}