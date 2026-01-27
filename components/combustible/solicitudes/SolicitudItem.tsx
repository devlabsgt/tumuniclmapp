// features/solicitudes/SolicitudItem.tsx
import React, { useState } from 'react';
import { SolicitudCombustible } from './types';
import { deleteSolicitud } from './actions';
import Swal from 'sweetalert2';

interface Props {
  sol: SolicitudCombustible;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  onEdit: (sol: SolicitudCombustible) => void;
}

export const SolicitudItem: React.FC<Props> = ({ sol, isExpanded, onToggleExpand, onRefresh, onEdit }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // --- LÓGICA INTERNA ---
  const totalKilometros = sol.detalles?.reduce((acc, curr) => acc + (Number(curr.kilometros_recorrer) || 0), 0) || 0;

  // Configuración de estilos según estado
  const statusConfig = {
    aprobada: {
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        label: 'Aprobada'
    },
    rechazada: {
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        label: 'Rechazada'
    },
    pendiente: {
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        label: 'Pendiente'
    }
  };
  
  const currentStatus = statusConfig[sol.estado] || statusConfig.pendiente;

  // --- HANDLERS CON SWEETALERT2 ---
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // BLOQUEO: Solo permite eliminar si está pendiente
    if (sol.estado !== 'pendiente') {
        Swal.fire({
            title: 'Acción no permitida',
            text: 'Solo se pueden eliminar solicitudes en estado pendiente.',
            icon: 'error',
            confirmButtonColor: '#3b82f6',
        });
        return;
    }

    const isDark = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la solicitud. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444', // red-500
      cancelButtonColor: '#6b7280',  // gray-500
      background: isDark ? '#171717' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      reverseButtons: true,
      focusCancel: true
    });

    if (result.isConfirmed) {
      try {
        setIsDeleting(true);
        await deleteSolicitud(sol.id);
        
        Swal.fire({
          title: 'Eliminado',
          text: 'La solicitud ha sido borrada correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDark ? '#171717' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });

        onRefresh(); 
      } catch (error: any) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Hubo un error al intentar eliminar la solicitud.',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
          background: isDark ? '#171717' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      // BLOQUEO: Solo permite editar si está pendiente
      if (sol.estado !== 'pendiente') {
          Swal.fire({
              title: 'Atención',
              text: 'No se puede editar una solicitud ya procesada.',
              icon: 'info',
              confirmButtonColor: '#3b82f6',
          });
          return;
      }
      onEdit(sol);
  };

  // --- FORMATTERS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-GT', {
      timeZone: 'America/Guatemala',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateTimeParts = (dateString: string) => {
    if (!dateString) return { date: '-', time: '' };
    const date = new Date(dateString);
    
    const datePart = date.toLocaleDateString('es-GT', {
      timeZone: 'America/Guatemala',
      day: 'numeric',
      month: 'short',
    });

    const timePart = date.toLocaleTimeString('es-GT', {
      timeZone: 'America/Guatemala',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return { date: datePart, time: timePart };
  };

  return (
    <div 
        className={`
            group relative w-full bg-white dark:bg-neutral-900 rounded-xl transition-all duration-300
            border border-gray-200 dark:border-neutral-800 overflow-hidden
            ${isExpanded ? 'shadow-lg ring-1 ring-blue-500/20' : 'hover:shadow-md hover:border-blue-300 dark:hover:border-neutral-700'}
        `}
    >
        {/* --- HEADER (Visible siempre) --- */}
        <div 
            onClick={onToggleExpand}
            className="p-3 md:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center cursor-pointer select-none"
        >
            <div className={`
                flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center 
                ${currentStatus.iconBg} ${currentStatus.iconColor}
            `}>
                {sol.estado === 'aprobada' && <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                {sol.estado === 'rechazada' && <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                {sol.estado === 'pendiente' && <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            </div>

            <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
                        {sol.municipio_destino}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${currentStatus.badge}`}>
                        {currentStatus.label}
                    </span>
                </div>
                
                <p className="text-xs md:text-sm text-gray-500 dark:text-neutral-400 line-clamp-1 mb-1.5 break-words">
                    {sol.justificacion || 'Sin justificación'}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-xs text-gray-400 dark:text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {formatDate(sol.created_at)}
                    </span>
                    <span className="hidden sm:inline text-gray-300 dark:text-neutral-700">•</span>
                    <span className="flex items-center gap-1 bg-gray-50 dark:bg-neutral-800 px-2 py-0.5 rounded border border-gray-100 dark:border-neutral-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v9h1m8-9h2.414a1 1 0 01.707.293l3 3a1 1 0 01.293.707V16H13z" /></svg>
                        {sol.vehiculo?.placa || 'Sin Placa'}
                    </span>
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="absolute top-3 right-3 sm:static sm:self-center flex items-center gap-1 sm:ml-auto">
                
                {/* BLOQUEO VISUAL: Solo mostrar Editar si es pendiente */}
                {sol.estado === 'pendiente' && (
                    <button
                        onClick={handleEdit}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                )}

                {/* BLOQUEO VISUAL: Solo mostrar Eliminar si es pendiente */}
                {sol.estado === 'pendiente' && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        )}
                    </button>
                )}
                
                <div className={`p-2 text-gray-400 dark:text-neutral-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        </div>

        {/* --- CUERPO EXPANDIDO --- */}
        <div 
            className={`
                grid transition-all duration-300 ease-in-out bg-gray-50/50 dark:bg-black/20
                ${isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-gray-100 dark:border-neutral-800' : 'grid-rows-[0fr] opacity-0'}
            `}
        >
            <div className="overflow-hidden">
                <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm h-full">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-neutral-700 pb-2">
                                Resumen
                            </h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] uppercase text-gray-500 dark:text-neutral-400 block mb-1">Km Inicial</span>
                                        <span className="text-base font-mono font-medium text-gray-900 dark:text-white">{sol.kilometraje_inicial}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase text-gray-500 dark:text-neutral-400 block mb-1">Total Km</span>
                                        <span className="text-base font-mono font-bold text-blue-600 dark:text-blue-400">{totalKilometros} km</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500 dark:text-neutral-400 block mb-1">Vehículo</span>
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">{sol.vehiculo?.modelo}</div>
                                    <div className="text-xs text-gray-500 dark:text-neutral-500 mb-1.5 flex flex-wrap items-center gap-1">
                                        <span>{sol.vehiculo?.tipo_vehiculo || 'Vehículo'}</span>
                                        <span>•</span>
                                        <span className="font-mono">{sol.vehiculo?.placa}</span>
                                    </div>
                                    {sol.vehiculo?.tipo_combustible && (
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${sol.vehiculo.tipo_combustible === 'Diesel' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' : 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'}`}>
                                            {sol.vehiculo.tipo_combustible}
                                        </span>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-gray-100 dark:border-neutral-700">
                                    <span className="text-[10px] uppercase text-gray-500 dark:text-neutral-400 block mb-1">Justificación</span>
                                    <p className="text-xs md:text-sm text-gray-600 dark:text-neutral-300 italic leading-relaxed">"{sol.justificacion}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm h-full flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-700/30 flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                    Itinerario
                                </h4>
                                <span className="text-[10px] text-gray-400 bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-gray-200 dark:border-neutral-700">
                                    {sol.detalles?.length || 0} destinos
                                </span>
                            </div>
                            
                            <div className="p-3 flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                                {sol.detalles && sol.detalles.length > 0 ? (
                                    sol.detalles.map((det, idx) => {
                                        const startParts = getDateTimeParts(det.fecha_inicio);
                                        const endParts = getDateTimeParts(det.fecha_fin);
                                        return (
                                            <div key={idx} className="bg-gray-50 dark:bg-neutral-900/40 rounded-lg border border-gray-100 dark:border-neutral-700/50 p-3 hover:border-blue-500/30 transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                    <div className="flex-1 min-w-0 flex items-start justify-between md:block">
                                                        <div className="mr-2">
                                                            <span className="text-sm font-bold text-gray-800 dark:text-neutral-100 uppercase tracking-tight line-clamp-2 md:line-clamp-1" title={det.lugar_visitar}>
                                                                {det.lugar_visitar}
                                                            </span>
                                                        </div>
                                                        <div className="md:hidden shrink-0 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                            {det.kilometros_recorrer} km
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-3">
                                                        <div className="hidden md:block shrink-0">
                                                            <span className="bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 whitespace-nowrap">
                                                                {det.kilometros_recorrer} km
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:flex md:flex-row gap-3 w-full md:w-auto">
                                                            <div className="flex flex-col bg-white dark:bg-neutral-800 p-2 rounded border border-gray-100 dark:border-neutral-700/50 shadow-sm w-full md:w-auto md:min-w-[200px]">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Salida</span>
                                                                </div>
                                                                <div className="flex flex-row items-baseline gap-2 text-[10px] sm:text-xs font-mono text-gray-700 dark:text-neutral-200">
                                                                    <span className="font-semibold">{startParts.date}</span>
                                                                    <span className="text-gray-500 dark:text-neutral-400"><span className="mr-1">|</span>{startParts.time}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col bg-white dark:bg-neutral-800 p-2 rounded border border-gray-100 dark:border-neutral-700/50 shadow-sm w-full md:w-auto md:min-w-[200px]">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Retorno</span>
                                                                </div>
                                                                <div className="flex flex-row items-baseline gap-2 text-[10px] sm:text-xs font-mono text-gray-700 dark:text-neutral-200">
                                                                    <span className="font-semibold">{endParts.date}</span>
                                                                    <span className="text-gray-500 dark:text-neutral-400"><span className="mr-1">|</span>{endParts.time}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-gray-400 text-sm italic">No hay detalles registrados.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};