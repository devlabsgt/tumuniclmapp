'use client'

import React, { useState, useEffect } from 'react';
import { CreateRequestModal } from './modals/CrearSolicitud';
import { RequestList } from './SolicitudesList';
import { SolicitudCombustible } from './types';
import { getMySolicitudes } from './actions'; 
import { AlertCircle, Lock, Plus } from 'lucide-react'; 

export default function RequestManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudCombustible[]>([]);
  const [loading, setLoading] = useState(true);

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

  const hasPendingLiquidation = solicitudes.some(s => s.solvente === false);

  const handleOpenCreate = () => {
    if (hasPendingLiquidation) return;
    setEditingSolicitud(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sol: SolicitudCombustible) => {
    setEditingSolicitud(sol);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8 lg:px-10">
        
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8 md:mb-10">
          
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Mis Solicitudes
            </h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-neutral-400 font-medium">
              Administre sus solicitudes de combustible y comisiones.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
              
              <button 
                onClick={handleOpenCreate} 
                disabled={hasPendingLiquidation || loading}
                className={`
                  w-full sm:w-auto
                  px-6 py-3 md:py-2.5 rounded-xl transition-all duration-200
                  flex items-center justify-center gap-2.5 
                  font-bold text-sm shadow-lg active:scale-95
                  ${hasPendingLiquidation
                      ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed border border-gray-200 dark:border-neutral-700 shadow-none'
                      : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 shadow-slate-900/20 dark:shadow-blue-900/20 hover:shadow-xl'
                  }
                `}
                title={hasPendingLiquidation ? "Debe liquidar sus comisiones pendientes antes de crear una nueva solicitud." : "Crear nueva solicitud"}
              >
                {hasPendingLiquidation ? <Lock size={18} /> : <Plus size={18} strokeWidth={3} />}
                <span>Nueva Solicitud</span>
              </button>

              {hasPendingLiquidation && (
                  <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2 text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-900/30 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="text-center sm:text-right leading-tight">Tiene liquidaciones pendientes</span>
                  </div>
              )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse w-full max-w-4xl mx-auto sm:mx-0">
              <div className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-2xl w-full"></div>
              <div className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-2xl w-full"></div>
              <div className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-2xl w-full"></div>
          </div>
        ) : (
          <div className="w-full">
            <RequestList 
                solicitudes={solicitudes} 
                onRefresh={fetchSolicitudes} 
                onEdit={handleEdit} 
            />
          </div>
        )}

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
    </div>
  );
}