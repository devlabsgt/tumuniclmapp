'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Gauge, Calendar, FileSignature, Undo2, Trash2, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLiquidacionAdminData, useInventario, useHistorialEntregas, useEntregaMutations } from '../lib/hooks'; 
import { SolicitudEntrega, InventarioCupon } from '../lib/schemas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solicitud: SolicitudEntrega;
}

const AlertMixin = Swal.mixin({
    target: 'body',
    confirmButtonColor: '#3b82f6',
    returnFocus: false,
    didOpen: () => {
        const container = Swal.getContainer();
        if (container) {
            container.style.setProperty('z-index', '2147483647', 'important');
        }
    }
});

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#fff',
    color: '#1f2937',
    iconColor: '#10b981',
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
        toast.style.setProperty('z-index', '2147483647', 'important');
        const container = Swal.getContainer();
        if (container) container.style.setProperty('z-index', '2147483647', 'important');
    },
    customClass: {
        popup: 'colored-toast font-sans text-sm font-medium border border-gray-100 shadow-xl rounded-lg'
    }
});

export default function ValidarLiquidacion({ isOpen, onClose, onSuccess, solicitud }: Props) {
  const { data: liqData, isLoading: loadLiq } = useLiquidacionAdminData(solicitud.id);
  
  const tipoCombustible = solicitud.vehiculo?.tipo_combustible === 'Diesel' ? 'Diesel' : 'Gasolina';
  const { data: inventario = [], isLoading: loadInv } = useInventario(tipoCombustible);
  
  const { data: historialEntregas = [], isLoading: loadHist } = useHistorialEntregas(solicitud.id);
  
  const { aprobarFinal } = useEntregaMutations();
  
  const loading = loadLiq || loadInv || loadHist;
  const procesando = aprobarFinal.isPending;

  const [devolverCupones, setDevolverCupones] = useState(false);
  
  const [itemsDevolucion, setItemsDevolucion] = useState<{ 
      id: string; 
      cantidad: number; 
      denominacion: number; 
      inicio: string; 
      fin: string; 
  }[]>([{ id: '', cantidad: 0, denominacion: 0, inicio: '', fin: '' }]);

  const inventarioAgrupado = useMemo(() => {
      const grupos: Record<number, InventarioCupon[]> = {};
      inventario.forEach(item => {
          const cantidad = item.cantidad_actual;
          if (!grupos[cantidad]) grupos[cantidad] = [];
          grupos[cantidad].push(item);
      });
      const gruposArray = Object.entries(grupos).map(([cantidad, items]) => {
          items.sort((a, b) => a.denominacion - b.denominacion);
          return { label: `${cantidad} DISPONIBLES`, items: items, minDenom: items[0].denominacion };
      });
      return gruposArray.sort((a, b) => a.minDenom - b.minDenom);
  }, [inventario]);

  const updateItem = (index: number, field: string, value: any) => {
      const newItems = [...itemsDevolucion];
      // @ts-ignore
      newItems[index][field] = value;

      if (field === 'inicio' && value) {
          const numInicio = parseInt(value);
          const encontrado = historialEntregas.find((e: any) => numInicio >= e.inicio && numInicio <= e.fin);
          if (encontrado) {
              newItems[index].id = encontrado.id; 
              newItems[index].denominacion = encontrado.denominacion;
          }
      }

      if ((field === 'inicio' || field === 'fin')) {
          const inicioVal = newItems[index].inicio;
          const finVal = newItems[index].fin;
          if (inicioVal && finVal) {
              const i = parseInt(inicioVal);
              const f = parseInt(finVal);
              if (!isNaN(i) && !isNaN(f) && f >= i) {
                  newItems[index].cantidad = (f - i) + 1;
              }
          }
      }

      if (field === 'id') {
          const selected = inventario.find(inv => inv.id === value);
          newItems[index].denominacion = selected?.denominacion || 0;
      }
      setItemsDevolucion(newItems);
  };

  const addItem = () => setItemsDevolucion([...itemsDevolucion, { id: '', cantidad: 0, denominacion: 0, inicio: '', fin: '' }]);
  
  const removeItem = (index: number) => {
      if (itemsDevolucion.length === 1) setItemsDevolucion([{ id: '', cantidad: 0, denominacion: 0, inicio: '', fin: '' }]);
      else setItemsDevolucion(itemsDevolucion.filter((_, i) => i !== index));
  };

  const totalDevolucion = itemsDevolucion.reduce((acc, item) => acc + (item.cantidad * item.denominacion), 0);

  const handleAprobar = async () => {
    if (devolverCupones) {
        const invalidos = itemsDevolucion.filter(i => !i.id || i.cantidad <= 0);
        if (invalidos.length > 0) {
             if (itemsDevolucion.length === 1 && !itemsDevolucion[0].id && !itemsDevolucion[0].inicio) {
             } else {
                 return AlertMixin.fire({ title: 'Datos Incompletos', text: 'Verifique los datos de devolución.', icon: 'warning' });
             }
        }
    }

    const itemsProcesados = devolverCupones ? itemsDevolucion.filter(i => i.id && i.cantidad > 0) : [];

    const result = await Swal.fire({
        title: '¿Aprobar Liquidación?',
        html: `
            <p style="font-size: 0.9em; color: #666;">Al aprobar, se liberará la solvencia del usuario.</p>
            ${devolverCupones && itemsProcesados.length > 0 
                ? `<div style="margin-top: 10px; background: #ecfdf5; padding: 12px; border-radius: 8px; color: #065f46; font-weight: bold; font-size: 0.95em; border: 1px solid #a7f3d0;">
                    💰 Se reintegrarán Q${totalDevolucion.toFixed(2)} al inventario.
                   </div>` 
                : ''}
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981', 
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar',
        target: 'body',
        didOpen: () => {
            const container = Swal.getContainer();
            if (container) {
                container.style.setProperty('z-index', '2147483647', 'important');
                container.style.setProperty('pointer-events', 'auto', 'important');
            }
        },
        returnFocus: false
    });

    if (!result.isConfirmed) return;

    try {
        const res = await aprobarFinal.mutateAsync({ 
            id: solicitud.id, 
            devolucion: itemsProcesados 
        });

        if (res.success) {
            await Toast.fire({ icon: 'success', title: '¡Proceso Completado!' });
            onSuccess();
            onClose();
        } else {
            await AlertMixin.fire({ title: 'Error', text: res.error || 'No se pudo procesar.', icon: 'error' });
        }
    } catch (error) {
        await AlertMixin.fire({ title: 'Error', text: 'Error de comunicación con el servidor', icon: 'error' });
    }
  };

  if (!isOpen) return null;

  const totalRecorrido = liqData ? (liqData.km_final - solicitud.kilometraje_inicial) : 0;
  const fechaLiq = liqData?.fecha_comision ? new Date(liqData.fecha_comision).toLocaleDateString('es-GT', { dateStyle: 'long' }) : '---';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl bg-white dark:bg-neutral-900 border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        
        <DialogHeader className="p-5 bg-slate-900 text-white flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
                    <FileSignature size={20} />
                </div>
                <div>
                    <DialogTitle className="text-base font-bold text-white tracking-tight">Validar Liquidación</DialogTitle>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Verifique los datos reportados
                    </p>
                </div>
            </div>
        </DialogHeader>

        <div className="flex-1 p-6 bg-gray-50/50 dark:bg-black/20 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 animate-pulse gap-3">
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium">Cargando...</span>
                </div>
            ) : liqData ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Solicitud No.</span>
                            <div className="text-sm font-black text-slate-800 dark:text-white font-mono">
                                #{solicitud.correlativo || '---'}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Fecha Reportada</span>
                            <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500" />
                                {fechaLiq}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Vehículo</span>
                            <div className="text-xs font-bold text-slate-800 dark:text-white uppercase truncate">
                                {solicitud.placa} - {solicitud.vehiculo?.modelo}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-slate-200 dark:border-neutral-700 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-slate-100 dark:text-neutral-700/50">
                            <Gauge size={120} />
                        </div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Registro de Kilometraje
                        </h3>
                        <div className="grid grid-cols-3 gap-4 relative z-10">
                            <div className="flex flex-col border-r border-slate-100 dark:border-neutral-700 pr-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Inicial</span>
                                <span className="text-lg font-mono font-bold text-slate-600 dark:text-slate-300">
                                    {solicitud.kilometraje_inicial.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col border-r border-slate-100 dark:border-neutral-700 pr-4">
                                <span className="text-[10px] font-bold text-blue-500 uppercase">Final</span>
                                <span className="text-xl font-mono font-black text-blue-600 dark:text-blue-400">
                                    {liqData.km_final.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Recorrido</span>
                                <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                                    {totalRecorrido.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">km</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-900/50 overflow-hidden transition-all duration-300">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="text-gray-400 dark:text-neutral-500">
                                    <Undo2 size={16} />
                                </div>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    ¿Devolución de Material?
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input type="checkbox" className="sr-only peer" checked={devolverCupones} onChange={(e) => setDevolverCupones(e.target.checked)} />
                                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-600"></div>
                            </label>
                        </div>

                        {devolverCupones && (
                            <div className="px-4 pb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                                <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md overflow-hidden shadow-sm">
                                    
                                    <div className="grid grid-cols-12 bg-gray-50 dark:bg-neutral-700/50 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase py-2 px-2 border-b border-gray-200 dark:border-neutral-700">
                                        <div className="col-span-2 text-center">Cant.</div>
                                        <div className="col-span-4 text-center">Tipo de Cupón</div>
                                        <div className="col-span-2 text-center">Monto</div>
                                        <div className="col-span-3 text-center">Serie (Del/Al)</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    
                                    <div className="divide-y divide-gray-100 dark:divide-neutral-700 max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {itemsDevolucion.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-12 items-center px-2 py-1.5 gap-2 text-xs">
                                                
                                                <div className="col-span-2">
                                                    <input 
                                                        type="number" 
                                                        className="w-full text-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-600 text-slate-800 dark:text-white rounded px-1 py-1 focus:border-slate-400 outline-none font-medium h-7" 
                                                        placeholder="0"
                                                        min="0"
                                                        value={item.cantidad > 0 ? item.cantidad : ''}
                                                        onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                                                    />
                                                </div>

                                                <div className="col-span-4">
                                                    <select 
                                                        className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-600 rounded px-1 py-1 text-slate-800 dark:text-white focus:border-slate-400 outline-none h-7 text-[10px]"
                                                        value={item.id}
                                                        onChange={(e) => updateItem(idx, 'id', e.target.value)}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        {inventarioAgrupado.map((grupo) => (
                                                            <optgroup key={grupo.label} label={grupo.label} className="bg-white dark:bg-neutral-800 text-slate-500 font-bold uppercase text-[9px]">
                                                                {grupo.items.map(inv => (
                                                                    <option key={inv.id} value={inv.id} className="text-slate-800 dark:text-white font-medium text-[11px]">
                                                                        Q{inv.denominacion} - {inv.producto}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-span-2 text-center font-mono font-bold text-gray-600 dark:text-gray-400 text-[10px]">
                                                    Q{(item.cantidad * item.denominacion).toFixed(0)}
                                                </div>

                                                <div className="col-span-3 flex gap-1">
                                                    <input type="text" placeholder="Del" className="w-1/2 text-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-600 rounded px-1 py-1 h-7 text-[9px] outline-none" value={item.inicio} onChange={(e) => updateItem(idx, 'inicio', e.target.value)} />
                                                    <input type="text" placeholder="Al" className="w-1/2 text-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-600 rounded px-1 py-1 h-7 text-[9px] outline-none" value={item.fin} onChange={(e) => updateItem(idx, 'fin', e.target.value)} />
                                                </div>

                                                <div className="col-span-1 text-center">
                                                    <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-neutral-700/30 p-2 flex justify-between items-center border-t border-gray-200 dark:border-neutral-700">
                                        <button 
                                            onClick={addItem} 
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={12} strokeWidth={3} /> Fila
                                        </button>
                                        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 pr-2">
                                            Total: <span className="text-emerald-600 dark:text-emerald-400 ml-1">Q{totalDevolucion.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 items-center bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                        <AlertCircle className="text-orange-600 dark:text-orange-500 shrink-0" size={16} />
                        <div className="text-[11px] text-orange-800 dark:text-orange-200 leading-snug">
                            <strong>Atención:</strong> Marque el botón de devolución en caso de que el usuario devuelva algún  <strong>CUPÓN</strong> 
                        </div>
                    </div>

                </div>
            ) : (
                <div className="py-12 text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-full inline-flex mb-3">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Sin datos de liquidación</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">El usuario aún no ha llenado el formulario.</p>
                    <Button onClick={onClose} variant="secondary" size="sm">Cerrar</Button>
                </div>
            )}
        </div>

        {liqData && (
            <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex justify-end gap-2 shrink-0">
                <Button 
                    onClick={handleAprobar} 
                    disabled={procesando}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 shadow-sm text-xs tracking-wide flex items-center gap-2"
                >
                    {procesando ? 'Procesando...' : (
                        <>
                            <CheckCircle2 size={16} />
                            {devolverCupones ? 'Aprobar con Devolución' : 'Aprobar Liquidación'}
                        </>
                    )}
                </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}