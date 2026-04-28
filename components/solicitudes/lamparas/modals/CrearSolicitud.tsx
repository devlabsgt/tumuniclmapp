'use client'

import React, { useState, useEffect } from 'react';
import { useSolicitudMutations, useElectricistas } from '../lib/hooks';
import { CrearSolicitudLamparaValues, SolicitudLampara } from '../lib/zod';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: SolicitudLampara | null;
}

export default function CrearSolicitud({ isOpen, onClose, onSuccess, editData }: Props) {
  const { crear, editar } = useSolicitudMutations();
  const { data: electricistas = [] } = useElectricistas();
  const loading = crear.isPending || editar.isPending;
  const isEditMode = !!editData;

  const [formData, setFormData] = useState<CrearSolicitudLamparaValues>({
    nombre_responsable: '',
    telefono_contacto: '',
    ubicacion: '',
    cantidad_elementos: 1,
    comentarios: '',
    asignado_a_uid: '',
    checklists: {
      cambio_bombilla: false,
      revision_lampara: false,
      cambio_lampara: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (editData) {
        setFormData({
          nombre_responsable: editData.nombre_responsable || '',
          telefono_contacto: editData.telefono_contacto || '',
          ubicacion: editData.ubicacion || '',
          cantidad_elementos: editData.cantidad_elementos || 1,
          comentarios: editData.comentarios || '',
          asignado_a_uid: editData.asignado_a_uid || '',
          checklists: editData.checklists || {
            cambio_bombilla: false,
            revision_lampara: false,
            cambio_lampara: false,
          },
        });
      } else {
        setFormData({
          nombre_responsable: '',
          telefono_contacto: '',
          ubicacion: '',
          cantidad_elementos: 1,
          comentarios: '',
          asignado_a_uid: '',
          checklists: {
            cambio_bombilla: false,
            revision_lampara: false,
            cambio_lampara: false,
          },
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, editData]);

  const updateField = (field: keyof CrearSolicitudLamparaValues, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre_responsable.trim()) {
      toast.warning('Debe ingresar el nombre del solicitante.');
      return;
    }
    if (!formData.telefono_contacto.trim()) {
      toast.warning('Debe ingresar un teléfono.');
      return;
    }
    if (!formData.ubicacion.trim()) {
      toast.warning('Debe ingresar la ubicación.');
      return;
    }
    if (formData.cantidad_elementos < 1) {
      toast.warning('La cantidad de lámparas debe ser al menos 1.');
      return;
    }

    try {
      if (isEditMode && editData) {
        const res = await editar.mutateAsync({ solicitudId: editData.id, values: formData });
        if (res.success) {
          toast.success('Solicitud actualizada correctamente');
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || 'No se pudo actualizar la solicitud');
        }
      } else {
        const res = await crear.mutateAsync(formData);
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
                {isEditMode ? 'Modifique los datos de la solicitud' : 'Complete los detalles del reporte ciudadano'}
            </p>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 sm:px-8 custom-scrollbar pb-24 sm:pb-2">
          <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Teléfono <span className="text-red-500">*</span>
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

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                        Cantidad de Lámparas <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={formData.cantidad_elementos || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateField('cantidad_elementos', val === '' ? 0 : Number(val));
                        }}
                        className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                    Ubicación del Reporte <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => updateField('ubicacion', e.target.value)}
                    placeholder="Dirección o referencia exacta..."
                    className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                    Tipo de Mantenimiento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                        { id: 'cambio_bombilla', label: 'Cambio de bombilla' },
                        { id: 'revision_lampara', label: 'Revisión de Lámpara' },
                        { id: 'cambio_lampara', label: 'Cambio de Lámpara' },
                    ].map((item) => (
                        <label 
                            key={item.id}
                            className={`
                                flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none
                                ${formData.checklists?.[item.id as keyof typeof formData.checklists] 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                                    : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-neutral-800/50 dark:border-neutral-700 dark:text-neutral-400 hover:border-blue-300 dark:hover:border-neutral-600'}
                            `}
                        >
                            <input
                                type="checkbox"
                                checked={formData.checklists?.[item.id as keyof typeof formData.checklists] || false}
                                onChange={(e) => {
                                    const newChecklists = { ...formData.checklists, [item.id]: e.target.checked };
                                    updateField('checklists', newChecklists);
                                }}
                                className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-bold">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5 mt-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                    Asignar Electricista (Opcional)
                </label>
                <select
                    value={formData.asignado_a_uid || ''}
                    onChange={(e) => updateField('asignado_a_uid', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none appearance-none cursor-pointer"
                >
                    <option value="">Sin asignar por ahora</option>
                    {electricistas.map((e: any) => (
                        <option key={e.user_id} value={e.user_id}>{e.nombre}</option>
                    ))}
                </select>
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
