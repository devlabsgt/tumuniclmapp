// features/solicitudes/modals/LiquidarCupones.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Agregamos CheckCircle2 para el indicador visual
import { Search, Save, X, FileSignature, AlertCircle, Calendar, Hash, User, Briefcase, MapPin, Gauge, Lock, Edit, CheckCircle2 } from 'lucide-react'; 
import Swal from 'sweetalert2';
import { getSolicitudParaLiquidacion, saveLiquidacion, getLiquidacionBySolicitudId, updateLiquidacion } from '../actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialSolicitudId?: number | null;
  mode?: 'create' | 'view'; 
}

export default function LiquidarCupones({ isOpen, onClose, onSuccess, initialSolicitudId, mode = 'create' }: Props) {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [solicitudData, setSolicitudData] = useState<any>(null);
  const [liquidacionData, setLiquidacionData] = useState<any>(null);

  const [kmFinal, setKmFinal] = useState<number | ''>('');
  const [fechaComision, setFechaComision] = useState('');

  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    if (isOpen) {
        setLiquidacionData(null);
        setSolicitudData(null);
        setKmFinal('');
        setFechaComision('');
        setHasExistingRecord(false);
        setIsEditing(true); 

        if (initialSolicitudId) {
            setSearchId(initialSolicitudId.toString());
            cargarDatos(initialSolicitudId);
        } else {
            setSearchId('');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSolicitudId]); 

  const cargarDatos = async (id: number) => {
    setLoading(true);
    try {
        const solData = await getSolicitudParaLiquidacion(id);
        
        if (!solData) {
            Swal.fire('Error', 'Solicitud no encontrada o no aprobada.', 'error');
            onClose();
            return;
        }
        setSolicitudData(solData);

        const liqData = await getLiquidacionBySolicitudId(id);
        
        if (liqData) {
            setLiquidacionData(liqData);
            setKmFinal(liqData.km_final);
            if (liqData.fecha_comision) {
                setFechaComision(new Date(liqData.fecha_comision).toISOString().split('T')[0]);
            }
            
            setHasExistingRecord(true); 
            setIsEditing(false); // Por defecto bloqueado al cargar
        } else {
            setHasExistingRecord(false);
            setIsEditing(true);         
            setFechaComision('');       
        }

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Error cargando datos.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleManualSearch = () => {
      if(searchId) cargarDatos(Number(searchId));
  };

  const totalRecorrido = (typeof kmFinal === 'number' && solicitudData) 
    ? kmFinal - solicitudData.kilometraje_inicial 
    : 0;

  const isInvalidKm = totalRecorrido < 0;
  
  const inputsDisabled = !isEditing; 

  // --- LÓGICA DE BLOQUEO POR SOLVENCIA ---
  // Si solvente es true, significa que el admin ya validó.
  const isSolvente = solicitudData?.solvente === true;

  const handleSubmit = async () => {
    if (!solicitudData || typeof kmFinal !== 'number') return;
    
    if (!fechaComision) {
        return Swal.fire('Atención', 'Debe seleccionar la fecha real de la comisión.', 'warning');
    }

    if (isInvalidKm) return Swal.fire('Error', 'El Kilometraje Final no puede ser menor al Inicial.', 'error');

    setSubmitting(true);
    try {
        if (hasExistingRecord && liquidacionData) {
             await updateLiquidacion(liquidacionData.id, {
                km_final: kmFinal,
                cupones_devueltos: 0, 
                fecha_comision: fechaComision
            });
            await Swal.fire('Actualizado', 'La liquidación ha sido corregida.', 'success');
        } else {
            await saveLiquidacion({
                id_solicitud: solicitudData.id,
                km_final: kmFinal,
                cupones_devueltos: 0,
                fecha_comision: fechaComision
            });
            await Swal.fire({
                title: 'Registrado Correctamente',
                text: 'Recuerde entregar la hoja física al encargado para liberar su solvencia.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });
        }

        if (onSuccess) onSuccess();
        onClose();
    } catch (error: any) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none bg-white dark:bg-[#1a1a1a] border-none shadow-none rounded-none flex flex-col overflow-hidden p-0">
        
        {/* HEADER */}
        <DialogHeader className="px-8 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] flex flex-row items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-900 dark:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20">
                    <FileSignature size={20} />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {hasExistingRecord ? 'Detalle de Liquidación' : 'Nueva Liquidación'}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5">
                        {/* Mensaje dinámico según estado */}
                        {isSolvente 
                            ? 'Liquidación finalizada y aprobada por administración' 
                            : hasExistingRecord 
                                ? 'Registro guardado previamente' 
                                : 'Registro oficial de cierre de solicitud'}
                    </p>
                </div>
            </div>
            <button 
                onClick={onClose} 
                className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-all"
            >
                <X size={24} />
            </button>
        </DialogHeader>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-gray-50/50 dark:bg-[#111111] custom-scrollbar flex justify-center">
            
            <div className="w-full max-w-5xl space-y-8">
                
                {/* BUSCADOR INICIAL */}
                {!initialSolicitudId && !solicitudData && (
                    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in zoom-in duration-300">
                        {/* ... (Buscador igual que antes) ... */}
                        <div className="w-full max-w-md space-y-4 bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center block mb-4">
                                Buscar Solicitud
                            </label>
                            <div className="flex gap-2 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input 
                                    type="number" 
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-lg transition-all"
                                    placeholder="ID..."
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                    autoFocus
                                />
                                <Button 
                                    onClick={handleManualSearch} 
                                    disabled={loading || !searchId} 
                                    className="px-6 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    {loading ? '...' : 'Buscar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FORMULARIO */}
                {solicitudData && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 bg-white dark:bg-[#1a1a1a] p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 relative">
                        
                        {/* --- INDICADOR DE MODO LECTURA / APROBADO --- */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            {isSolvente ? (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 size={12} /> LIQUIDADO
                                </div>
                            ) : inputsDisabled ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                    <Lock size={12} /> MODO LECTURA
                                </div>
                            ) : null}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-16 border-b border-gray-100 dark:border-neutral-800 pb-8 mb-8">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1.5">
                                    FECHA DE COMISIÓN:
                                </label>
                                <div className="flex-1 relative">
                                    <input 
                                        type="date"
                                        disabled={inputsDisabled} // Siempre disabled si isSolvente (porque inputsDisabled será true)
                                        value={fechaComision}
                                        onChange={(e) => setFechaComision(e.target.value)}
                                        className={`w-full bg-transparent border-b-2 py-1 px-2 text-lg font-bold outline-none transition-colors text-center sm:text-left
                                            ${inputsDisabled 
                                                ? 'border-transparent text-slate-600 dark:text-slate-400' 
                                                : 'border-slate-300 dark:border-neutral-600 text-slate-900 dark:text-white focus:border-blue-500'
                                            } dark:[color-scheme:dark]`}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1 md:justify-end">
                                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1.5">
                                    SOLICITUD No.
                                </label>
                                <div className="border-b-2 border-slate-300 dark:border-neutral-600 py-1 px-4 text-xl font-black text-sky-600 dark:text-sky-400 font-mono min-w-[100px] text-center">
                                    {solicitudData.correlativo || solicitudData.id}
                                </div>
                            </div>
                        </div>

                        {/* DATOS DE USUARIO */}
                        <div className="grid grid-cols-12 gap-y-8 gap-x-6 mb-10 opacity-90">
                            <div className="col-span-12">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1">
                                        NOMBRE DE QUIEN LIQUIDA:
                                    </label>
                                    <div className="flex-1 border-b border-slate-200 dark:border-neutral-700 py-1 text-base font-bold text-slate-800 dark:text-gray-200 uppercase truncate">
                                        {solicitudData.usuario?.nombre || '---'}
                                    </div>
                                </div>
                            </div>
                            {/* ... Resto de campos de usuario igual ... */}
                            <div className="col-span-12 md:col-span-5">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1">
                                        CARGO:
                                    </label>
                                    <div className="flex-1 border-b border-slate-200 dark:border-neutral-700 py-1 text-xs font-bold text-slate-700 dark:text-gray-300 uppercase">
                                        {solicitudData.usuario?.cargo || '---'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-7">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap mb-1">
                                        UNIDAD/DIRECCIÓN:
                                    </label>
                                    <div className="flex-1 border-b border-slate-200 dark:border-neutral-700 py-1 text-xs font-bold text-slate-700 dark:text-gray-300 uppercase">
                                        {solicitudData.usuario?.unidad || '---'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TARJETA KILOMETRAJE */}
                        <div className={`rounded-2xl p-8 border relative overflow-hidden mb-8 transition-colors
                            ${inputsDisabled 
                                ? 'bg-gray-50/50 dark:bg-neutral-900/30 border-gray-100 dark:border-neutral-800' 
                                : 'bg-slate-50 dark:bg-neutral-900/50 border-slate-200 dark:border-neutral-800'
                            }
                        `}>
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05]">
                                <Gauge size={180} />
                            </div>
                            
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
                                <span className={`w-2 h-2 rounded-full ${isSolvente ? 'bg-emerald-500' : (inputsDisabled ? 'bg-gray-400' : 'bg-blue-500')}`}></span>
                                Registro de Recorrido
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10 items-end">
                                <div className="flex flex-col border-b-2 border-slate-200 dark:border-neutral-700 pb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kilometraje Inicial</span>
                                    <div className="text-2xl font-mono font-bold text-slate-600 dark:text-slate-400">
                                        {solicitudData.kilometraje_inicial.toLocaleString()}
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className={`text-[10px] font-bold uppercase mb-2 ${inputsDisabled ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                        Kilometraje Final
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            placeholder="0"
                                            disabled={inputsDisabled}
                                            className={`w-full bg-white dark:bg-neutral-900 border-b-4 rounded-t-lg px-4 py-3 text-3xl font-mono font-black outline-none transition-all shadow-sm
                                                ${inputsDisabled 
                                                    ? 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 cursor-not-allowed' 
                                                    : isInvalidKm 
                                                        ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/10' 
                                                        : 'border-blue-500 text-slate-900 dark:text-white focus:bg-blue-50 dark:focus:bg-blue-900/10'
                                                }
                                            `}
                                            value={kmFinal}
                                            onChange={(e) => setKmFinal(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                        {isInvalidKm && !inputsDisabled && <p className="absolute -bottom-6 left-0 text-[10px] text-red-500 font-bold animate-pulse">Menor al inicial</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end md:text-right border-b-2 border-slate-200 dark:border-neutral-700 pb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Recorrido</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-black tracking-tight ${inputsDisabled ? 'text-gray-600' : 'text-slate-800 dark:text-white'}`}>
                                            {totalRecorrido.toLocaleString()}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400">KM</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ALERTA / NOTA (Solo si NO es solvente) */}
                        {!isSolvente && (
                            <div className="rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-5 flex gap-4 items-center">
                                <AlertCircle className="text-orange-600 dark:text-orange-500 shrink-0" size={24} />
                                <div className="text-sm text-orange-800 dark:text-orange-200 leading-snug">
                                    <strong className="font-bold uppercase block text-xs mb-0.5">Nota Importante</strong>
                                    Al guardar, su solvencia permanecerá inactiva. Deberá entregar la <span className="font-bold underline decoration-orange-400">hoja física firmada</span> al encargado para habilitar nuevas solicitudes.
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>

        {/* FOOTER ACCIONES */}
        {solicitudData && (
            <div className="px-8 py-5 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-neutral-800 flex justify-between items-center shrink-0 z-10">
                
                {/* Botón Editar: Se muestra SOLO si hay datos, no estamos editando y NO ES SOLVENTE */}
                {hasExistingRecord && !isEditing && !isSolvente ? (
                    <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 h-12 px-6 rounded-xl font-bold transition-all"
                    >
                        <Edit size={18} className="mr-2" />
                        Editar Datos
                    </Button>
                ) : (
                    <div></div> // Espaciador
                )}

                <div className="flex gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        disabled={submitting}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white h-12 px-6"
                    >
                        {hasExistingRecord && !isEditing ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    
                    {/* Botón Guardar: Se muestra SOLO si estamos editando (y lógicamente no será solvente porque el botón de editar no habría aparecido) */}
                    {isEditing && !isSolvente && (
                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting || isInvalidKm || kmFinal === '' || !fechaComision}
                            className={`text-white font-bold px-8 h-12 rounded-xl shadow-xl transition-all active:scale-95 text-base
                                ${hasExistingRecord 
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/10' 
                                    : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-emerald-900/10'
                                }
                            `}
                        >
                            {submitting ? 'Guardando...' : (
                                <span className="flex items-center gap-2">
                                    <Save size={20} /> {hasExistingRecord ? 'Actualizar Liquidación' : 'Guardar Liquidación'}
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