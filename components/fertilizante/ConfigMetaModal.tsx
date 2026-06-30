"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import { guardarConfiguracionFertilizante } from "./actions";

interface Props {
  visible: boolean;
  onClose: () => void;
  anioActual: string;
  totalMeta: number;
  onGuardado: () => void;
}

export default function ConfigMetaModal({ visible, onClose, anioActual, totalMeta, onGuardado }: Props) {
  const [sacos, setSacos] = useState(totalMeta.toString());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setSacos(totalMeta.toString());
    }
  }, [visible, totalMeta]);

  const manejarGuardar = async () => {
    const nuevosSacos = parseInt(sacos, 10);
    if (isNaN(nuevosSacos) || nuevosSacos < 0) return;
    
    setGuardando(true);
    const exito = await guardarConfiguracionFertilizante(anioActual, nuevosSacos);
    setGuardando(false);
    
    if (exito) {
      onGuardado();
      onClose();
    }
  };

  return (
    <Transition show={visible} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="bg-white dark:bg-neutral-900 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-2xl flex flex-col sm:rounded-3xl shadow-2xl border-0 sm:border border-gray-100 dark:border-neutral-800 overflow-hidden">
              
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
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
                      <Settings className="text-blue-600 dark:text-blue-400" size={24} />
                      Configurar Meta
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">
                      Ajuste la cantidad de sacos disponibles
                  </p>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 sm:px-8 custom-scrollbar pb-24 sm:pb-2">
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                          Total de sacos para {anioActual} <span className="text-red-500">*</span>
                      </label>
                      <input
                          type="number"
                          min="0"
                          step="1"
                          value={sacos}
                          onChange={(e) => setSacos(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-3 text-base font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none"
                      />
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
                      onClick={manejarGuardar}
                      disabled={guardando || !sacos}
                      className="px-12 sm:px-16 py-3 text-base font-bold bg-slate-900 dark:bg-blue-600 text-white rounded-xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
                  >
                      {guardando ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                          'Guardar Cambios'
                      )}
                  </button>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
