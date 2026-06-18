"use client";

import React, { useState, useEffect } from "react";
import { crearCitacion, actualizarCitacion } from "./citacionActions";
import Swal from "sweetalert2";

interface CitacionFormProps {
  id: string; // id_usuario
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CitacionForm({ id, initialData, onSuccess, onCancel }: CitacionFormProps) {
  const [motivo, setMotivo] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setMotivo(initialData.motivo || "");
      if (initialData.fecha_cita) {
        const date = new Date(initialData.fecha_cita);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setFechaCita(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
    }
  }, [initialData]);

  const sendPushNotification = async (titulo: string, mensaje: string, targetId: string) => {
    try {
      await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titulo,
          message: mensaje,
          url: '/protected/admin/citaciones', // Optional URL
          targetIds: [targetId]
        }),
      });
    } catch (error) {
      console.error('Error enviando notificación push:', error);
    }
  };

  const handleSubmit = async () => {
    if (!motivo || !fechaCita) {
      Swal.fire({
        title: "Error",
        text: "Por favor llena todos los campos",
        icon: "error",
        background: '#18181b',
        color: '#ffffff'
      });
      return;
    }

    setLoading(true);
    
    let result;
    if (initialData) {
      result = await actualizarCitacion(
        initialData.id,
        motivo,
        new Date(fechaCita).toISOString()
      );
    } else {
      result = await crearCitacion(
        id, 
        motivo, 
        new Date(fechaCita).toISOString()
      );
    }
    
    setLoading(false);

    if (result.success) {
      // Send push notification indicating they have a pending citation
      if (!initialData) {
        await sendPushNotification(
          "Aviso de Recursos Humanos", 
          "Se le ha programado una citación. Por favor ingrese al sistema para ver los detalles.", 
          id
        );
      }
      
      Swal.fire({
        title: "Éxito",
        text: initialData ? "Citación actualizada correctamente" : "Citación registrada y notificada correctamente",
        icon: "success",
        background: '#18181b',
        color: '#ffffff'
      });
      onSuccess();
    } else {
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar: " + result.error,
        icon: "error",
        background: '#18181b',
        color: '#ffffff'
      });
    }
  };

  return (
    <div className="flex flex-col -mx-6 -my-6">
      {/* Header Institucional */}
      <div className="flex items-center justify-between px-5 sm:px-8 py-2 sm:py-3 border-b-2 border-blue-600 rounded-t-lg bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <img
            src="/images/logo-muni.png"
            alt="Logo"
            className="h-10 sm:h-14 object-contain"
          />
          <div>
            <p className="text-[10px] sm:text-[12px] font-black text-neutral-600 dark:text-neutral-400 tracking-widest uppercase leading-tight">
              Municipalidad de Concepción Las Minas
            </p>
            <p className="text-[8px] sm:text-[10px] font-bold text-neutral-500/80 tracking-wide mt-0.5">Chiquimula, Guatemala</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-neutral-800 rounded-xl transition-colors ml-2 active:scale-95"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Título de Formulario */}
      <div className="px-6 pt-4 pb-0 sm:px-8 sm:pt-5 sm:pb-0 flex justify-center w-full">
        <h2 className="text-base sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight flex flex-col items-center text-center">
          <span>{initialData ? "Editar Citación" : "Nueva Citación a RRHH"}</span>
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 pt-6 pb-4 sm:px-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
              Motivo de la Citación <span className="text-blue-500">*</span>
            </label>
            <textarea
              id="motivo"
              placeholder="Describe el motivo por el cual se cita al empleado..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
              Fecha y Hora de la Cita <span className="text-blue-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fechaCita}
              onChange={(e) => setFechaCita(e.target.value)}
              className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Cintillo de Colores Institucional */}
      <div className="flex h-1.5 sm:h-2 w-full mt-2">
        <div className="flex-1 bg-blue-900" />
        <div className="flex-1 bg-blue-600" />
        <div className="flex-1 bg-blue-400" />
        <div className="flex-1 bg-blue-200" />
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-b-lg flex justify-center items-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-12 sm:px-16 py-3 text-base font-bold bg-slate-900 dark:bg-blue-600 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            initialData ? 'Actualizar Citación' : 'Enviar Citación'
          )}
        </button>
      </div>
    </div>
  );
}
