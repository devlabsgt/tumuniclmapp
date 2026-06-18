"use client";

import React, { useState } from "react";
import { crearLlamadaAtencion, actualizarLlamadaAtencion } from "./llamadaAtencionActions";
import Swal from "sweetalert2";

interface LlamadaAtencionFormProps {
  id: string; // id_usuario
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LlamadaAtencionForm({ id, initialData, onSuccess, onCancel }: LlamadaAtencionFormProps) {
  const [tipo, setTipo] = useState(initialData?.tipo || "");
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
  const [loading, setLoading] = useState(false);

  const isEditing = !!initialData;

  const handleSubmit = async () => {
    if (!tipo || !descripcion) {
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
    if (isEditing) {
      result = await actualizarLlamadaAtencion(initialData.id, tipo, descripcion);
    } else {
      result = await crearLlamadaAtencion(id, tipo, descripcion);
    }
    setLoading(false);

    if (result.success) {
      Swal.fire({
        title: "Éxito",
        text: isEditing ? "Llamada de atención actualizada" : "Llamada de atención registrada correctamente",
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
          <span>{isEditing ? "Editar" : "Nueva"} Llamada de Atención</span>
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 pt-6 pb-4 sm:px-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
              Tipo de Llamada de Atención <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none appearance-none pr-10 cursor-pointer"
              >
                <option className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white" value="" disabled>Seleccione un tipo...</option>
                <option className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white" value="Verbal">Verbal</option>
                <option className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white" value="Escrita">Escrita</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descripcion"
              placeholder="Describe el motivo de la llamada de atención..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={5}
              className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none resize-none"
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
          className="px-12 sm:px-16 py-3 text-base font-bold bg-slate-900 dark:bg-blue-600 text-white rounded-xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            'Guardar Registro'
          )}
        </button>
      </div>
    </div>
  );
}
