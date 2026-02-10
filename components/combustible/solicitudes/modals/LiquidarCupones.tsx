import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, Save, X, FileSignature, AlertCircle, Gauge, Lock, Edit, CheckCircle2, User, Briefcase, Building2 } from 'lucide-react'; 
import Swal from 'sweetalert2';

import { useLiquidacionData, useLiquidacionMutations } from '../hook'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialSolicitudId?: number | null;
  mode?: 'create' | 'view'; 
}

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

const formatNumber = (num: number | string) => {
    if (!num) return '';
    const cleanNum = num.toString().replace(/,/g, '');
    return Number(cleanNum).toLocaleString('en-US');
};

export default function LiquidarCupones({ isOpen, onClose, onSuccess, initialSolicitudId, mode = 'create' }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null); 
  const [searchId, setSearchId] = useState(''); 

  const [kmFinal, setKmFinal] = useState<number | ''>('');
  const [fechaComision, setFechaComision] = useState('');
  const [isEditing, setIsEditing] = useState(true);

  const [kmFinalDisplay, setKmFinalDisplay] = useState('');

  const { data: combinedData, isLoading, isError } = useLiquidacionData(activeId);
  const { guardar, actualizar } = useLiquidacionMutations();

  const solicitudData = combinedData?.solicitudData;
  const liquidacionData = combinedData?.liquidacionData;
  const hasExistingRecord = !!liquidacionData;

  useEffect(() => {
    if (isOpen) {
        setSearchId('');
        if (initialSolicitudId) {
            setActiveId(initialSolicitudId);
            setSearchId(initialSolicitudId.toString());
        } else {
            setActiveId(null);
        }
    }
  }, [isOpen, initialSolicitudId]);

  useEffect(() => {
    if (combinedData) {
        if (liquidacionData) {
            setKmFinal(liquidacionData.km_final);
            setKmFinalDisplay(formatNumber(liquidacionData.km_final)); 
            if (liquidacionData.fecha_comision) {
                setFechaComision(new Date(liquidacionData.fecha_comision).toISOString().split('T')[0]);
            }
            setIsEditing(false); 
        } 
        else if (solicitudData) {
            setKmFinal(solicitudData.kilometraje_inicial); 
            setKmFinalDisplay(formatNumber(solicitudData.kilometraje_inicial)); 
            setFechaComision('');
            setIsEditing(true);
        }
    } else {
        setKmFinal('');
        setKmFinalDisplay('');
        setFechaComision('');
    }
  }, [combinedData, solicitudData, liquidacionData]);

  const handleManualSearch = () => {
      if(searchId) setActiveId(Number(searchId)); 
  };

  const handleChangeKm = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/,/g, '');
      
      if (!/^\d*$/.test(rawValue)) return;

      const numValue = rawValue === '' ? '' : Number(rawValue);
      setKmFinal(numValue);

      setKmFinalDisplay(rawValue === '' ? '' : Number(rawValue).toLocaleString('en-US'));
  };

  const handleBlurKm = () => {
      if (!solicitudData) return;
      const val = Number(kmFinal);
      if (kmFinal === '' || val < solicitudData.kilometraje_inicial) {
          setKmFinal(solicitudData.kilometraje_inicial);
          setKmFinalDisplay(formatNumber(solicitudData.kilometraje_inicial));
      }
  };

  const totalRecorrido = (typeof kmFinal === 'number' && solicitudData) 
    ? kmFinal - solicitudData.kilometraje_inicial 
    : 0;

  const isInvalidKm = totalRecorrido < 0;
  const inputsDisabled = !isEditing; 
  const isSolvente = solicitudData?.solvente === true;
  const isSubmitting = guardar.isPending || actualizar.isPending; 

  const handleSubmit = async () => {
    if (!solicitudData || typeof kmFinal !== 'number') return;
    
    if (!fechaComision) {
        return Toast.fire({ icon: 'warning', title: 'Seleccione la fecha real de la comisión.' });
    }

    if (isInvalidKm) {
        return Toast.fire({ icon: 'error', title: 'El Km Final no puede ser menor al Inicial.' });
    }

    try {
        if (hasExistingRecord && liquidacionData) {
             await actualizar.mutateAsync({
                id: liquidacionData.id,
                data: {
                    km_final: kmFinal,
                    cupones_devueltos: 0, 
                    fecha_comision: fechaComision
                }
            });
            Toast.fire({ icon: 'success', title: 'Liquidación actualizada correctamente.' });
        } else {
            await guardar.mutateAsync({
                id_solicitud: solicitudData.id,
                km_final: kmFinal,
                cupones_devueltos: 0,
                fecha_comision: fechaComision
            });
            Toast.fire({ icon: 'success', title: 'Liquidación registrada correctamente.' });
        }

        if (onSuccess) onSuccess();
        onClose();
    } catch (error: any) {
        Toast.fire({ icon: 'error', title: error.message || 'Error al procesar la solicitud.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none bg-white dark:bg-[#1a1a1a] border-none shadow-none rounded-none flex flex-col overflow-hidden p-0">
        
        <DialogHeader className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] flex flex-row items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-900 dark:bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                    <FileSignature size={16} />
                </div>
                <div>
                    <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {hasExistingRecord ? 'Detalle de Liquidación' : 'Nueva Liquidación'}
                    </DialogTitle>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                        {isSolvente 
                            ? 'Liquidación finalizada y aprobada' 
                            : hasExistingRecord 
                                ? 'Registro guardado previamente' 
                                : 'Registro oficial de cierre'}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-all">
                <X size={20} />
            </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 md:pt-8 pb-40 bg-gray-50/50 dark:bg-[#111111] custom-scrollbar flex justify-center">
            
            <div className="w-full max-w-6xl space-y-6">
                
                {!activeId && !solicitudData && (
                    <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in zoom-in duration-300">
                        <div className="w-full max-w-sm space-y-3 bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-neutral-800">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center block mb-2">
                                Buscar Solicitud
                            </label>
                            <div className="flex gap-2 relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                                <input 
                                    type="number" 
                                    className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm transition-all"
                                    placeholder="ID..."
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                    autoFocus
                                />
                                <Button 
                                    onClick={handleManualSearch} 
                                    disabled={isLoading || !searchId} 
                                    className="px-4 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-lg shadow-md text-xs"
                                >
                                    {isLoading ? '...' : 'Buscar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {solicitudData && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 bg-white dark:bg-[#1a1a1a] p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-neutral-800 relative">
                        
                        <div className="absolute top-4 right-4 flex gap-2">
                            {isSolvente ? (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                                    <CheckCircle2 size={10} /> LIQUIDADO
                                </div>
                            ) : inputsDisabled ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                                    <Lock size={10} /> LECTURA
                                </div>
                            ) : null}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1.5">
                                    Fecha Comisión:
                                </label>
                                <div className="w-auto">
                                    <input 
                                        type="date"
                                        disabled={inputsDisabled}
                                        value={fechaComision}
                                        onChange={(e) => setFechaComision(e.target.value)}
                                        className={`w-40 bg-transparent border-b py-0.5 px-1 text-sm font-bold outline-none transition-colors text-center sm:text-left
                                            ${inputsDisabled 
                                                ? 'border-transparent text-slate-600 dark:text-slate-400' 
                                                : 'border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white focus:border-blue-500'
                                            } dark:[color-scheme:dark]`}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-end gap-2 flex-1 md:justify-end">
                                <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1">
                                    Solicitud No.
                                </label>
                                <div className="border-b border-slate-300 dark:border-neutral-600 py-0.5 px-3 text-base font-black text-sky-600 dark:text-sky-400 font-mono text-center">
                                    {solicitudData.correlativo || solicitudData.id}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-neutral-900/50 rounded-xl p-5 border border-slate-100 dark:border-neutral-800 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User size={12} className="text-gray-400" />
                                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Responsable</label>
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-gray-200 uppercase tracking-tight">
                                        {solicitudData.usuario?.nombre || '---'}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase size={12} className="text-gray-400" />
                                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Cargo</label>
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase leading-snug">
                                        {solicitudData.usuario?.cargo || '---'}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 size={12} className="text-gray-400" />
                                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Unidad / Dirección</label>
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase leading-snug">
                                        {solicitudData.usuario?.unidad || '---'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-xl p-6 border relative overflow-hidden mb-8 transition-colors
                            ${inputsDisabled 
                                ? 'bg-gray-50/50 dark:bg-neutral-900/30 border-gray-100 dark:border-neutral-800' 
                                : 'bg-slate-50 dark:bg-neutral-900/50 border-slate-200 dark:border-neutral-800'
                            }
                        `}>
                            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] dark:opacity-[0.05]">
                                <Gauge size={140} />
                            </div>
                            
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSolvente ? 'bg-emerald-500' : (inputsDisabled ? 'bg-gray-400' : 'bg-blue-500')}`}></span>
                                Registro de Recorrido
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-end">
                                <div className="flex flex-col border-b border-slate-200 dark:border-neutral-700 pb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Km Inicial</span>
                                    <div className="text-lg font-mono font-bold text-slate-600 dark:text-slate-400">
                                        {formatNumber(solicitudData.kilometraje_inicial)}
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className={`text-[10px] font-bold uppercase mb-1 ${inputsDisabled ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                        Km Final
                                    </label>
                                    <div className="relative">
                                        
                                        <input 
                                            type="text" 
                                            placeholder="0"
                                            disabled={inputsDisabled}
                                            onBlur={handleBlurKm}
                                            className={`w-full bg-white dark:bg-neutral-900 border-b-2 rounded-t-md px-3 py-2 text-xl font-mono font-bold outline-none transition-all shadow-sm
                                                ${inputsDisabled 
                                                    ? 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 cursor-not-allowed' 
                                                    : isInvalidKm 
                                                        ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/10' 
                                                        : 'border-blue-500 text-slate-900 dark:text-white focus:bg-blue-50 dark:focus:bg-blue-900/10'
                                                }
                                            `}
                                            value={kmFinalDisplay}
                                            onChange={handleChangeKm}
                                        />
                                        {isInvalidKm && !inputsDisabled && <p className="absolute -bottom-5 left-0 text-[9px] text-red-500 font-bold animate-pulse">Menor al inicial</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end md:text-right border-b border-slate-200 dark:border-neutral-700 pb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl font-black tracking-tight ${inputsDisabled ? 'text-gray-600' : 'text-slate-800 dark:text-white'}`}>
                                            {formatNumber(totalRecorrido)}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">KM</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>

        {solicitudData && (
            <div className="px-6 py-4 mb-2 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-neutral-800 flex justify-between items-center shrink-0 z-10">
                
                {hasExistingRecord && !isEditing && !isSolvente ? (
                    <Button 
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 px-4 rounded-lg font-bold transition-all"
                    >
                        <Edit size={14} className="mr-2" />
                        Editar
                    </Button>
                ) : (
                    <div></div>
                )}

                <div className="flex gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={onClose} 
                        disabled={isSubmitting}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-4"
                    >
                        {hasExistingRecord && !isEditing ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    
                    {isEditing && !isSolvente && (
                        <Button 
                            onClick={handleSubmit} 
                            size="sm"
                            disabled={isSubmitting || isInvalidKm || kmFinal === '' || !fechaComision}
                            className={`text-white font-bold px-6 rounded-lg shadow-md transition-all active:scale-95 text-xs
                                ${hasExistingRecord 
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/10' 
                                    : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-emerald-900/10'
                                }
                            `}
                        >
                            {isSubmitting ? 'Guardando...' : (
                                <span className="flex items-center gap-2">
                                    <Save size={16} /> {hasExistingRecord ? 'Actualizar' : 'Guardar'}
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}