'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertTriangle, Loader2, CheckCircle2, Bold, Italic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MensajeDev, MensajeDevFormData } from '../zod';
import { crearMensajeDev, editarMensajeDev } from '../actions/mensajes';
import { NIVEL_KEYS, getNivelConfig } from '../nivelConfig';
import { MensajeEditor, applyEditorFormat, htmlToMensaje } from '../mensajeFormato';

interface MensajeDevModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mensajeEditar?: MensajeDev | null;
}

const EMPTY_FORM: MensajeDevFormData = {
  titulo: '',
  mensaje: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'Bajo',
  activo: true,
};

const formatForInput = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localIso = new Date(d.getTime() - tzOffset).toISOString();
  return localIso.slice(0, 16);
};

export default function MensajeDevModal({
  isOpen,
  onClose,
  onSuccess,
  mensajeEditar,
}: MensajeDevModalProps) {
  const [form, setForm] = useState<MensajeDevFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mensajeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (mensajeEditar) {
      setForm({
        titulo: mensajeEditar.titulo,
        mensaje: mensajeEditar.mensaje,
        fecha_inicio: formatForInput(mensajeEditar.fecha_inicio),
        fecha_fin: formatForInput(mensajeEditar.fecha_fin),
        estado: mensajeEditar.estado,
        activo: mensajeEditar.activo,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
    setSuccess(false);
  }, [isOpen, mensajeEditar]);

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      const payload: MensajeDevFormData = {
        ...form,
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin: new Date(form.fecha_fin).toISOString(),
      };

      const result = mensajeEditar
        ? await editarMensajeDev(mensajeEditar.id, payload)
        : await crearMensajeDev(payload);

      if (!result.ok) {
        setError(result.error || 'Ocurrió un error.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    });
  };

  const set = (key: keyof MensajeDevFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: keyof MensajeDevFormData) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const applyFormat = (command: 'bold' | 'italic') => {
    applyEditorFormat(mensajeRef.current, command);
    if (!mensajeRef.current) return;
    set('mensaje', htmlToMensaje(mensajeRef.current.innerHTML));
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="fixed -inset-[100vmax] bg-white/50 dark:bg-black/20 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          />

          <motion.div
            className="relative w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {mensajeEditar ? 'Editar mensaje' : 'Nuevo mensaje del sistema'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Se mostrará en el sistema según las fechas configuradas
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => set('titulo', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Mensaje <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyFormat('bold')}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Negrita"
                      aria-label="Negrita"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('italic')}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Cursiva"
                      aria-label="Cursiva"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <MensajeEditor
                  editorRef={mensajeRef}
                  initialMarkdown={mensajeEditar?.mensaje ?? ''}
                  onChange={(mensaje) => set('mensaje', mensaje)}
                  resetKey={`${isOpen}-${mensajeEditar?.id ?? 'nuevo'}`}
                  className="w-full min-h-[120px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Fecha inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.fecha_inicio}
                    onChange={(e) => set('fecha_inicio', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Fecha fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.fecha_fin}
                    onChange={(e) => set('fecha_fin', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Nivel de Importancia <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {NIVEL_KEYS.map((nivel) => {
                    const cfg = getNivelConfig(nivel);
                    return (
                      <button
                        key={nivel}
                        type="button"
                        onClick={() => set('estado', nivel)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          form.estado === nivel
                            ? `${cfg.chip} scale-105 shadow-sm`
                            : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Activo</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Si está desactivado, el mensaje no se mostrará aunque esté dentro del rango de fechas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('activo')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.activo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={form.activo}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form.activo ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isPending}
                className="text-gray-600 dark:text-gray-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || success}
                className={`gap-2 min-w-[120px] transition-all ${
                  success
                    ? 'bg-blue-500 hover:bg-blue-500'
                    : 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700'
                }`}
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                ) : success ? (
                  <><CheckCircle2 className="w-4 h-4" /> Guardado</>
                ) : (
                  <><Save className="w-4 h-4" /> {mensajeEditar ? 'Actualizar' : 'Guardar'}</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
