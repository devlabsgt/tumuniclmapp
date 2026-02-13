'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SolicitudEntrega, InventarioCupon, ItemEntrega } from '../lib/schemas';
import { useInventario, useEntregaMutations } from '../lib/hooks'; 
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nuevoEstado: 'aprobado' | 'rechazado') => void; 
  solicitud: SolicitudEntrega;
}

const EMPTY_ITEM: ItemEntrega = {
    detalle_contrato_id: '',
    cantidad_asignada: 0,
    correlativo_inicio: 0,
    correlativo_fin: 0,
    total_valor: 0,
    denominacion_valor: 0
};

interface CouponSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: InventarioCupon[];
}

const CouponSelect: React.FC<CouponSelectProps> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const groupedOptions = useMemo(() => {
        const groups: Record<number, InventarioCupon[]> = {};
        options.forEach(opt => {
            const qty = opt.cantidad_actual;
            if (!groups[qty]) groups[qty] = [];
            groups[qty].push(opt);
        });
        return Object.entries(groups)
            .map(([qty, items]) => {
                items.sort((a, b) => a.denominacion - b.denominacion);
                return [qty, items] as [string, InventarioCupon[]];
            })
            .sort((a, b) => {
                const minA = a[1][0]?.denominacion || 0;
                const minB = b[1][0]?.denominacion || 0;
                return minA - minB;
            });
    }, [options]);

    const selectedOption = options.find(o => o.id === value);
    
    return (
        <div className="relative w-full" ref={containerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className={`w-full text-sm bg-white dark:bg-neutral-900 border cursor-pointer rounded-lg px-3 py-2.5 flex justify-between items-center transition-all shadow-sm ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : 'border-gray-300 dark:border-neutral-700 hover:border-blue-400'}`}>
                <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>{selectedOption ? `Q${selectedOption.denominacion} — ${selectedOption.producto}` : 'Seleccione cupón...'}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                    {options.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center italic">No hay inventario disponible</div>
                    ) : (
                        groupedOptions.map(([qty, items]) => (
                            <div key={qty} className="border-b border-gray-100 dark:border-neutral-700 last:border-0">
                                <div className="bg-gray-50 dark:bg-neutral-900/80 px-3 py-1.5 text-[10px] font-extrabold text-gray-500 dark:text-neutral-400 uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                    {qty} Disponibles
                                </div>
                                <ul>
                                    {items.map((item) => (
                                        <li key={item.id} onClick={() => { onChange(item.id); setIsOpen(false); }} className={`px-4 py-2.5 cursor-pointer flex justify-between items-center group transition-colors border-l-4 ${value === item.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50 border-transparent hover:border-gray-300'}`}>
                                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Q{item.denominacion}</span>
                                            <span className="text-xs text-gray-500 dark:text-neutral-500">{item.producto}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default function AprobacionSolicitud({ isOpen, onClose, onSuccess, solicitud }: Props) {
  const [step, setStep] = useState<'menu' | 'aprobar'>('menu');
  const [tipoCombustible, setTipoCombustible] = useState<'Gasolina' | 'Diesel'>(
    solicitud.vehiculo?.tipo_combustible === 'Diesel' ? 'Diesel' : 'Gasolina'
  );
  
  const { data: inventario = [] } = useInventario(tipoCombustible);
  
  const { entregar, rechazar } = useEntregaMutations();
  
  const loading = entregar.isPending || rechazar.isPending;

  const [items, setItems] = useState<ItemEntrega[]>([{ ...EMPTY_ITEM }]);

  const kmsSolicitados = useMemo(() => {
    return solicitud.detalles?.reduce((acc, d) => acc + (d.kilometros_recorrer || 0), 0) || 0;
  }, [solicitud]);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (step === 'aprobar') {
        setItems([{ ...EMPTY_ITEM }]);
    }
  }, [step]);

  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  
  const removeItem = (idx: number) => {
    if (items.length === 1) setItems([{ ...EMPTY_ITEM }]);
    else setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ItemEntrega, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[idx], [field]: value };

    if (field === 'detalle_contrato_id') {
      const selectedInv = inventario.find(inv => inv.id === value);
      if (selectedInv) item.denominacion_valor = selectedInv.denominacion;
    }

    if (field === 'cantidad_asignada' || field === 'correlativo_inicio') {
        const start = Number(item.correlativo_inicio);
        const qty = Number(item.cantidad_asignada);
        if (start > 0 && qty > 0) item.correlativo_fin = start + qty - 1;
    }

    item.total_valor = item.cantidad_asignada * item.denominacion_valor;
    newItems[idx] = item;
    setItems(newItems);
  };

  const granTotal = useMemo(() => items.reduce((acc, curr) => acc + curr.total_valor, 0), [items]);

  const handleSave = async () => {
    const itemsValidos = items.filter(i => i.detalle_contrato_id && i.cantidad_asignada > 0);
    if (itemsValidos.length === 0) return Swal.fire('Error', 'Debe registrar al menos un cupón válido', 'warning');

    try {
        const res = await entregar.mutateAsync({
            solicitud_id: solicitud.id,
            tipo_combustible: tipoCombustible,
            items: itemsValidos
        });

        if (res.success) {
            Swal.fire({ title: '¡Aprobada!', text: 'Cupones asignados correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
            onSuccess('aprobado'); 
        } else {
            Swal.fire('Error', res.error || 'No se pudo guardar', 'error');
        }
    } catch (error: any) {
        Swal.fire('Error', error.message || 'Error de red o servidor', 'error');
    }
  };

  const handleReject = async () => {
      const result = await Swal.fire({
          title: '¿Rechazar solicitud?',
          text: "Esta acción cambiará el estado a rechazado.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#3b82f6',
          confirmButtonText: 'Sí, rechazar',
          cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;
      
      try {
          const res = await rechazar.mutateAsync({ id: solicitud.id, motivo: '' }); 
          
          if (res.success) {
              Swal.fire({ title: 'Rechazada', text: 'La solicitud ha sido rechazada.', icon: 'info', timer: 1500, showConfirmButton: false });
              onSuccess('rechazado'); 
          } else {
              Swal.fire('Error', res.error || 'No se pudo rechazar', 'error');
          }
      } catch (error: any) {
          Swal.fire('Error', error.message || 'Error al rechazar', 'error');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-neutral-800 relative transition-all duration-300
          ${step === 'aprobar' ? 'w-full max-w-[95vw] h-[90vh]' : 'w-full max-w-2xl'}
      `}>
        
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Solicitud #{solicitud.id}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 uppercase">{solicitud.placa}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 uppercase">
                    {kmsSolicitados} KM
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Gestión de solicitud de combustible.</p>
          </div>
          
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 transition-colors">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {step === 'menu' && (
            <div className="p-10 flex flex-col gap-6 items-center justify-center min-h-[300px]">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">¿Qué acción desea realizar con esta solicitud?</h3>
                
                <div className="grid grid-cols-2 gap-6 w-full">
                    <button 
                        onClick={() => setStep('aprobar')}
                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-300 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">Aprobar Solicitud</span>
                        <span className="text-xs text-emerald-600/70 text-center">Asignar cupones y procesar entrega.</span>
                    </button>

                    <button 
                        onClick={handleReject} 
                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="font-bold text-red-700 dark:text-red-300 text-lg">Rechazar Solicitud</span>
                        <span className="text-xs text-red-600/70 text-center">Denegar la petición inmediatamente.</span>
                    </button>
                </div>
            </div>
        )}

        {step === 'aprobar' && (
            <>
                <div className="px-8 py-3 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
                    <button onClick={() => setStep('menu')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">← Cambiar decisión</button>
                    
                    <div className="flex bg-white dark:bg-neutral-800 p-1 rounded-lg border border-gray-200 dark:border-neutral-700">
                        <button 
                            onClick={() => setTipoCombustible('Gasolina')} 
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                tipoCombustible === 'Gasolina' 
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Gasolina
                        </button>
                        <button 
                            onClick={() => setTipoCombustible('Diesel')} 
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                tipoCombustible === 'Diesel' 
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Diesel
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-black/20">
                    <div className="max-w-[1600px] mx-auto pb-20"> 
                        <div className="border border-gray-300 dark:border-neutral-700 rounded-xl shadow-sm bg-white dark:bg-neutral-900 overflow-visible">
                            <div className="grid grid-cols-12 bg-gray-50 dark:bg-neutral-800/50 text-xs font-extrabold text-gray-500 dark:text-neutral-400 uppercase py-3 px-4 border-b border-gray-200 dark:border-neutral-700 rounded-t-xl">
                                <div className="col-span-3">Denominación</div>
                                <div className="col-span-2 text-center">Cant.</div>
                                <div className="col-span-2 text-center">Inicio</div>
                                <div className="col-span-2 text-center">Fin</div>
                                <div className="col-span-2 text-right pr-4">Subtotal</div>
                                <div className="col-span-1"></div>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 gap-4 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors group relative overflow-visible z-10">
                                        <div className="col-span-3 relative" style={{ zIndex: 50 - idx }}><CouponSelect value={item.detalle_contrato_id} options={inventario} onChange={(val) => updateItem(idx, 'detalle_contrato_id', val)} /></div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number" 
                                                className="w-full text-center font-bold text-gray-900 dark:text-white bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg py-2.5 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                placeholder="0" 
                                                value={item.cantidad_asignada > 0 ? item.cantidad_asignada : ''} 
                                                onChange={(e) => updateItem(idx, 'cantidad_asignada', Number(e.target.value))} 
                                                onFocus={(e) => e.target.select()} 
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    className="w-full text-center bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg py-2.5 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                    placeholder="Del..." 
                                                    value={item.correlativo_inicio > 0 ? item.correlativo_inicio : ''} 
                                                    onChange={(e) => updateItem(idx, 'correlativo_inicio', Number(e.target.value))} 
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">#</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    className="w-full text-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg py-2.5 text-gray-500 font-medium cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                                    placeholder="Al..." 
                                                    readOnly 
                                                    value={item.correlativo_fin > 0 ? item.correlativo_fin : ''} 
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">#</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-right pr-4"><div className="font-mono font-bold text-lg text-gray-900 dark:text-white">Q{item.total_valor.toFixed(2)}</div></div>
                                        <div className="col-span-1 text-right pl-2"><button onClick={() => removeItem(idx)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={addItem} 
                                    className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-widest transition-all border-t border-dashed border-blue-200 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center gap-2 group"
                                >
                                    <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-[10px] group-hover:scale-110 transition-transform">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                    </div>
                                    Agregar otra tipo de cupon
                                </button>

                            </div>
                            <div className="bg-gray-50 dark:bg-neutral-800/80 p-6 border-t border-gray-200 dark:border-neutral-700 flex justify-end items-center rounded-b-xl gap-4">
                                <span className="text-sm font-bold text-gray-500 uppercase">Total:</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-white">Q{granTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-neutral-800 flex justify-end gap-3 bg-white dark:bg-neutral-900 shrink-0 z-20 rounded-b-2xl">
                   <button 
                        onClick={onClose} 
                        className="px-6 py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-colors dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Cancelar
                    </button>
                   <button 
                        onClick={handleSave} 
                        disabled={loading} 
                        className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-200 dark:shadow-none flex items-center gap-2 transition-all transform active:scale-95"
                    >
                        {loading ? 'Procesando...' : 'Confirmar Entrega'}
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
}