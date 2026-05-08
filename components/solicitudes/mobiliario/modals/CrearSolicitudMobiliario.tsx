'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useSolicitudMobiliarioMutations, useComunidades } from '../lib/hooks';
import { CrearSolicitudMobiliarioValues, SolicitudMobiliario } from '../lib/zod';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

function CreatableCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  labelNew = 'Agregar'
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  labelNew?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    return options.filter(opt => 
      opt.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div 
                key={i}
                onClick={() => {
                  setInputValue(opt);
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200 border-b border-gray-50 dark:border-neutral-700/50 last:border-0"
              >
                {opt}
              </div>
            ))
          ) : null}
          
          {inputValue.length > 0 && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase()) && (
            <div 
              onClick={() => {
                onChange(inputValue);
                setIsOpen(false);
              }}
              className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 border-t border-blue-100 dark:border-blue-900/30"
            >
              <Plus size={16} />
              <span>{labelNew}: <span className="underline">{inputValue}</span></span>
            </div>
          )}

          {filteredOptions.length === 0 && inputValue.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 italic">No hay opciones disponibles</div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: SolicitudMobiliario | null;
}

export default function CrearSolicitudMobiliario({ isOpen, onClose, onSuccess, editData }: Props) {
  const { crear, editar } = useSolicitudMobiliarioMutations();
  const { data: comunidades = [] } = useComunidades();
  const loading = crear.isPending || editar.isPending;
  const isEditMode = !!editData;

  const emptyItem = { cantidad: 0, descripcion: '' };

  const [formData, setFormData] = useState<CrearSolicitudMobiliarioValues>({
    nombre_responsable: '',
    telefono_contacto: '',
    aldea: '',
    caserio: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
    checklists: { items: [{ ...emptyItem }] },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (editData) {
        const existingItems = editData.checklists?.items && Array.isArray(editData.checklists.items) && editData.checklists.items.length > 0
          ? editData.checklists.items
          : [{ ...emptyItem }];
        setFormData({
          nombre_responsable: editData.nombre_responsable || '',
          telefono_contacto: editData.telefono_contacto || '',
          aldea: editData.aldea || '',
          caserio: editData.caserio || '',
          ubicacion: editData.ubicacion || '',
          fecha_inicio: editData.fecha_inicio ? new Date(editData.fecha_inicio).toISOString().split('T')[0] : '',
          fecha_fin: editData.fecha_fin ? new Date(editData.fecha_fin).toISOString().split('T')[0] : '',
          checklists: { items: existingItems },
        });
      } else {
        setFormData({
          nombre_responsable: '',
          telefono_contacto: '',
          aldea: '',
          caserio: '',
          ubicacion: '',
          fecha_inicio: '',
          fecha_fin: '',
          checklists: { items: [{ ...emptyItem }] },
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, editData]);

  const updateField = (field: keyof CrearSolicitudMobiliarioValues, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const current = formData.checklists?.items || [];
    updateField('checklists', { items: [...current, { ...emptyItem }] });
  };

  const removeItem = (index: number) => {
    const current = formData.checklists?.items || [];
    if (current.length <= 1) return;
    updateField('checklists', { items: current.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: 'cantidad' | 'descripcion', value: any) => {
    const current = [...(formData.checklists?.items || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('checklists', { items: current });
  };

  const aldeasUnicas = useMemo(() => {
    return Array.from(new Set(comunidades.map((c: any) => c.aldea_casco))).filter(Boolean) as string[];
  }, [comunidades]);

  const caseriosDisponibles = useMemo(() => {
    if (!formData.aldea) return [];
    return Array.from(new Set(comunidades
      .filter((c: any) => c.aldea_casco?.toLowerCase() === formData.aldea?.toLowerCase())
      .map((c: any) => c.barrio_caserio)
    )).filter(Boolean) as string[];
  }, [comunidades, formData.aldea]);


  const handleSubmit = async () => {
    if (!formData.nombre_responsable.trim()) {
      toast.warning('Debe ingresar el nombre del solicitante.');
      return;
    }
    if (!formData.ubicacion.trim()) {
      toast.warning('Debe ingresar la dirección.');
      return;
    }

    // Filtrar filas vacías o incompletas
    const itemsValidos = (formData.checklists?.items || []).filter(
      (item) => item.cantidad > 0 && item.descripcion.trim() !== ''
    );
    if (itemsValidos.length === 0) {
      toast.warning('Debe agregar al menos un elemento de mobiliario con cantidad y descripción.');
      return;
    }

    const dataToSubmit = {
      ...formData,
      checklists: { items: itemsValidos },
    };

    try {
      if (isEditMode && editData) {
        const res = await editar.mutateAsync({ solicitudId: editData.id, values: dataToSubmit });
        if (res.success) {
          toast.success('Solicitud actualizada correctamente');
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || 'No se pudo actualizar la solicitud');
        }
      } else {
        const res = await crear.mutateAsync(dataToSubmit);
        if (res.success) {
          toast.success('Solicitud registrada correctamente');
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || 'No se pudo crear la solicitud');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl flex flex-col sm:rounded-3xl shadow-2xl border-0 sm:border border-gray-100 dark:border-neutral-800 overflow-hidden">
        
        {/* Header Institucional */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-2 sm:py-3 border-b-2 border-blue-600">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo-muni.png"
              alt="Logo"
              className="h-14 sm:h-20 object-contain"
            />
            <div>
              <p className="text-[12px] sm:text-[14px] font-black text-neutral-600 dark:text-neutral-400 tracking-widest uppercase leading-tight">
                Municipalidad de Concepción Las Minas
              </p>
              <p className="text-[10px] sm:text-[12px] font-bold text-neutral-500/80 tracking-wide mt-0.5">Chiquimula, Guatemala</p>
            </div>
          </div>
          <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-neutral-800 rounded-xl transition-colors ml-2 active:scale-95"
          >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Título de Formulario */}
        <div className="px-6 pt-4 pb-0 sm:px-8 sm:pt-5 sm:pb-0 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                {isEditMode ? 'Editar Solicitud' : 'Nueva Solicitud'}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">
                {isEditMode ? 'Modifique los datos de la solicitud' : 'Complete los detalles del reporte de mobiliario'}
            </p>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 sm:px-8 custom-scrollbar pb-24 sm:pb-2">
          <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Nombre del Solicitante / Responsable <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.nombre_responsable}
                        onChange={(e) => updateField('nombre_responsable', e.target.value)}
                        placeholder="Nombre completo..."
                        className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Teléfono
                    </label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={8}
                        value={formData.telefono_contacto}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                            updateField('telefono_contacto', val);
                        }}
                        placeholder="12345678"
                        className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 z-50">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Aldea / Casco Urbano <span className="text-red-500">*</span>
                    </label>
                    <CreatableCombobox 
                        value={formData.aldea || ''}
                        onChange={(val) => {
                            updateField('aldea', val);
                            if (!val) updateField('caserio', '');
                        }}
                        options={aldeasUnicas}
                        placeholder="Buscar o escribir aldea..."
                    />
                </div>

                <div className="space-y-1.5 z-40">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Barrio / Caserío <span className="text-red-500">*</span>
                    </label>
                    <CreatableCombobox 
                        value={formData.caserio || ''}
                        onChange={(val) => updateField('caserio', val)}
                        options={caseriosDisponibles}
                        placeholder="Buscar o escribir caserío..."
                        disabled={!formData.aldea}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                    Dirección <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => updateField('ubicacion', e.target.value)}
                    placeholder="Dirección o referencia exacta..."
                    className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Fecha de Inicio (Actividad) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => updateField('fecha_inicio', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Fecha de Fin (Actividad)
                    </label>
                    <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => updateField('fecha_fin', e.target.value)}
                        className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="ml-1">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">
                        Apartado de Mobiliario <span className="text-red-500">*</span>
                    </label>
                </div>

                <div className="space-y-2">
                    {(formData.checklists?.items || []).map((item, index) => {
                        const items = formData.checklists?.items || [];
                        const isLast = index === items.length - 1;
                        return (
                            <div key={index} className="grid grid-cols-[80px_1fr] gap-2 items-center">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.cantidad === 0 ? '' : String(item.cantidad)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        updateItem(index, 'cantidad', val === '' ? 0 : parseInt(val));
                                    }}
                                    placeholder="Cant."
                                    className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-center text-base font-bold text-gray-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={item.descripcion}
                                        onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                                        placeholder="Ej: sillas, bancas, basureros..."
                                        className="flex-1 bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl px-3 py-3 text-base dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    />
                                    {isLast ? (
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow-sm shadow-blue-500/30 transition-all duration-150 shrink-0"
                                        >
                                            <Plus size={18} strokeWidth={2.5} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="w-9 h-9 flex items-center justify-center text-gray-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

          </div>
        </div>

        {/* Cintillo de Colores Institucional */}
        <div className="flex h-1.5 sm:h-2 w-full mt-4 mb-2">
          <div className="flex-1 bg-blue-900" />
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-blue-400" />
          <div className="flex-1 bg-blue-200" />
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg flex justify-center items-center sticky bottom-0 sm:static">
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-12 sm:px-16 py-3 text-base font-bold bg-slate-900 dark:bg-blue-600 text-white rounded-xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    isEditMode ? 'Guardar Cambios' : 'Crear'
                )}
            </button>
        </div>

      </div>
    </div>
  );
}
