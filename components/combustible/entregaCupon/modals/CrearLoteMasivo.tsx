'use client'

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers, CheckSquare, Square, Calendar, Loader2, Search, X } from 'lucide-react';
import { SolicitudEntrega } from '../lib/schemas';
import { generarLoteMasivo } from '../lib/actions';
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solicitudes: SolicitudEntrega[];
}

export default function CrearLoteMasivo({ isOpen, onClose, onSuccess, solicitudes }: Props) {
  const elegibles = useMemo(() => {
     return solicitudes.filter(s => {
         if (s.estado !== 'aprobado' || s.liquidacion?.lote_masivo_id) return false;
         
         const userObj = Array.isArray(s.usuario) ? s.usuario[0] : s.usuario;
         const depNombre = (userObj as any)?.dependencia?.nombre || '';
         const depLower = depNombre.toLowerCase();

         // Filtramos de forma segura ignorando mayúsculas/minúsculas
         const isSpecialCargo = depLower.includes('director de servicios') || 
                                depLower.includes('mantenimiento de la red municipal') || 
                                depLower.includes('analista desarrollador');
         
         return isSpecialCargo;
     });
  }, [solicitudes]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredElegibles = useMemo(() => {
      if (!searchQuery.trim()) return elegibles;
      return elegibles.filter(s => {
          const nombre = (s.usuario?.nombre || '').toLowerCase();
          return nombre.includes(searchQuery.toLowerCase());
      });
  }, [elegibles, searchQuery]);

  const toggleSelect = (id: number) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const toggleAll = () => {
    if (selectedIds.length === filteredElegibles.length && filteredElegibles.length > 0) {
        setSelectedIds([]);
    } else {
        setSelectedIds(filteredElegibles.map(e => e.id));
    }
  };

  const handleGenerar = async () => {
     if(selectedIds.length === 0) return;
     setLoading(true);
     const res = await generarLoteMasivo(selectedIds);
     setLoading(false);
     
     if (res.success) {
         Swal.fire({
             title: '¡Reporte Generado!',
             text: `Se generó el Lote Masivo No. ${res.correlativo}. Puedes imprimirlo desde la lista principal con el icono nuevo.`,
             icon: 'success',
             confirmButtonColor: '#4f46e5'
         });
         onSuccess();
         onClose();
     } else {
         Swal.fire('Error', res.error, 'error');
     }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:w-[80vw] sm:max-w-[80vw] sm:h-[80vh] m-0 p-0 sm:rounded-2xl bg-white dark:bg-neutral-900 border-none flex flex-col overflow-hidden shadow-2xl [&>button]:hidden">
        
        <DialogHeader className="p-4 sm:p-5 bg-indigo-600 text-white shrink-0">
            <div className="flex items-center gap-4 w-full px-2 sm:px-4">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Layers size={24} />
                </div>
                 <div className="text-left flex-1">
                     <DialogTitle className="text-lg font-bold text-white tracking-tight">Generar Liquidación General</DialogTitle>
                     <p className="text-xs text-indigo-200 mt-1">Selecciona las liquidaciones sueltas para agruparlas (Omitiendo liquidaciones ya resueltas)</p>
                 </div>
                 <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-all text-indigo-100 hover:text-white"
                 >
                    <X size={28} strokeWidth={3} />
                 </button>
             </div>
         </DialogHeader>

        {/* Contenido (Lista) */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-neutral-950/50">
            <div className="max-w-full mx-auto w-full px-2 sm:px-6">
                {elegibles.length === 0 ? (
                    <div className="text-center py-10">
                        <Layers size={40} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-slate-600 dark:text-slate-400 font-bold">No hay liquidaciones disponibles</h3>
                        <p className="text-sm text-slate-500 mt-1">Todas las solicitudes aprobadas ya pertenecen a un lote masivo.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Barra de Búsqueda y Botones */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-neutral-800 p-3 rounded-lg border border-slate-200 dark:border-neutral-700 shadow-sm gap-3">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {filteredElegibles.length} Liquidaciones Disponibles
                            </span>
                            
                            <div className="flex bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 flex-1 max-w-sm w-full transition-colors focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400/50">
                                <Search size={16} className="text-slate-400 mr-2 shrink-0 self-center" />
                                <input 
                                   type="text"
                                   placeholder="Buscar por nombre..."
                                   value={searchQuery}
                                   onChange={e => setSearchQuery(e.target.value)}
                                   className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
                                />
                            </div>

                            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 whitespace-nowrap">
                                {selectedIds.length === filteredElegibles.length && filteredElegibles.length > 0 ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                            </Button>
                        </div>

                        {filteredElegibles.length === 0 && searchQuery.trim() !== '' ? (
                            <div className="text-center py-10">
                                <Search size={30} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 font-medium">No se encontraron resultados para "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredElegibles.map(sol => {
                                    const isSelected = selectedIds.includes(sol.id);
                                    return (
                                        <div 
                                            key={sol.id}
                                            onClick={() => toggleSelect(sol.id)}
                                            className={`
                                                flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                                ${isSelected 
                                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50 shadow-sm' 
                                                    : 'bg-white border-slate-200 hover:border-indigo-300 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-700'}
                                            `}
                                        >
                                            <div className="shrink-0 text-indigo-500">
                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300 dark:text-neutral-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                                                        No. {sol.correlativo || sol.id}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                        {sol.vehiculo?.modelo || 'Máquina No Registrada'} - {sol.placa}
                                                    </h4>
                                                </div>
                                                <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                                                    <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 font-mono"><Calendar size={12}/> {new Date(sol.created_at).toLocaleDateString('es-GT')}</span>
                                                    <span className="truncate flex-1 max-w-[200px]">{sol.municipio_destino}</span>
                                                    </div>
                                                    <div className="mt-1">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{sol.usuario?.nombre}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Footer Fijo */}
         <div className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800 shrink-0">
             <div className="w-full flex justify-end px-2 sm:px-6">
                 <Button 
                     onClick={handleGenerar} 
                     disabled={loading || selectedIds.length === 0}
                     className="w-full sm:w-[250px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 text-base shadow-lg transition-all active:scale-95"
                 >
                     {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Layers className="mr-2" size={20} />}
                     Agrupar {selectedIds.length} Registros
                 </Button>
             </div>
         </div>
      </DialogContent>
    </Dialog>
  );
}
