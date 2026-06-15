'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Loader2 } from 'lucide-react';
import { FilaReporteDependencia } from '../lib/actions';
import { FiltroConSugerencias } from '../FiltroBusquedaReporte';

interface Props {
  open: boolean;
  onClose: () => void;
  filas: FilaReporteDependencia[];
  onExportar: (busquedaDep: string, busquedaNombre: string) => Promise<string>;
}

export default function ExportarReportePdfModal({
  open,
  onClose,
  filas,
  onExportar,
}: Props) {
  const [modoNombre, setModoNombre] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const limpiar = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setModoNombre(false);
    setSeleccion(null);
    setGenerando(false);
    setError(null);
    setPdfUrl(null);
  };

  useEffect(() => {
    if (!open) limpiar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCerrar = () => {
    limpiar();
    onClose();
  };

  const handleGenerar = async () => {
    setGenerando(true);
    setError(null);

    try {
      const url = seleccion
        ? modoNombre
          ? await onExportar('', seleccion)
          : await onExportar(seleccion, '')
        : await onExportar('', '');

      setPdfUrl(url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo generar el PDF. Intente de nuevo.'
      );
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCerrar()}>
      <DialogContent
        className="
          fixed inset-0 left-0 top-0 z-50 flex flex-col
          w-screen h-[100dvh] max-w-none max-h-none
          translate-x-0 translate-y-0
          rounded-none border-0 p-0 gap-0 overflow-hidden
          bg-white dark:bg-neutral-950
        "
      >
        <div className="flex items-center shrink-0 px-4 py-3 pr-12 border-b border-slate-200 dark:border-neutral-800">
          <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Reporte Por Departamento
          </DialogTitle>
          <DialogDescription className="sr-only">
            {pdfUrl
              ? 'Vista previa del reporte generado.'
              : 'Filtre por departamento o persona y genere el reporte PDF.'}
          </DialogDescription>
        </div>

        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Reporte por departamento"
            className="w-full flex-1 min-h-0 bg-slate-100 dark:bg-neutral-950"
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-4">
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">
              Opcional: filtre por departamento o persona
            </p>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <FiltroConSugerencias
                modoNombre={modoNombre}
                onModoChange={setModoNombre}
                filas={filas}
                valorAplicado=""
                autoAplicar={false}
                onSeleccionChange={setSeleccion}
                onSeleccionarDep={() => {}}
                onSeleccionarNombre={() => {}}
                onLimpiar={() => setSeleccion(null)}
                className="lg:flex-1 lg:max-w-none"
              />

              <button
                type="button"
                onClick={handleGenerar}
                disabled={generando}
                className="w-full lg:w-auto lg:shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {generando ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                {generando ? 'Generando...' : 'Generar PDF'}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {seleccion
                ? `Se generará el reporte de: ${seleccion}`
                : 'Sin selección se generará todo el reporte del periodo.'}
            </p>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
