'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Loader2, Search } from 'lucide-react';
import { FilaReporteDependencia } from '../lib/actions';
import { FiltroConSugerencias } from '../FiltroBusquedaReporte';

type ModoFiltroPdf = 'dependencia' | 'personal';

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
  const [modoFiltro, setModoFiltro] = useState<ModoFiltroPdf | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [accionGenerando, setAccionGenerando] = useState<'completo' | 'filtrado' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const limpiar = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setModoFiltro(null);
    setSeleccion(null);
    setGenerando(false);
    setAccionGenerando(null);
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

  const generarPdf = async (
    busquedaDep: string,
    busquedaNombre: string,
    accion: 'completo' | 'filtrado'
  ) => {
    setAccionGenerando(accion);
    setGenerando(true);
    setError(null);

    try {
      const url = await onExportar(busquedaDep, busquedaNombre);
      setPdfUrl(url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo generar el PDF. Intente de nuevo.'
      );
    } finally {
      setGenerando(false);
      setAccionGenerando(null);
    }
  };

  const handleGenerarCompleto = () => generarPdf('', '', 'completo');

  const handleBuscarFiltrado = () => {
    if (!seleccion || !modoFiltro) return;
    if (modoFiltro === 'personal') {
      generarPdf('', seleccion, 'filtrado');
    } else {
      generarPdf(seleccion, '', 'filtrado');
    }
  };

  const cambiarModoFiltro = (modo: ModoFiltroPdf) => {
    setModoFiltro(modo);
    setSeleccion(null);
    setError(null);
  };

  const modoNombre = modoFiltro === 'personal';

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
              : 'Genere el reporte completo o filtre por dependencia o personal.'}
          </DialogDescription>
        </div>

        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Reporte por departamento"
            className="w-full flex-1 min-h-0 bg-slate-100 dark:bg-neutral-950"
          />
        ) : (
          <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 sm:px-8 py-8">
            <div className="w-full max-w-md space-y-6">
              <button
                type="button"
                onClick={handleGenerarCompleto}
                disabled={generando}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-colors disabled:opacity-60"
              >
                {accionGenerando === 'completo' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                {accionGenerando === 'completo' ? 'Generando...' : 'Generar Pdf Completo'}
              </button>

              <div className="flex w-full rounded-xl border border-slate-200 dark:border-neutral-700 p-1 bg-white dark:bg-neutral-900 shadow-sm">
                {(
                  [
                    { id: 'dependencia' as const, label: 'Por Dependencia' },
                    { id: 'personal' as const, label: 'Por Personal' },
                  ] as const
                ).map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => cambiarModoFiltro(op.id)}
                    className={`flex-1 px-3 py-2 text-sm font-extrabold rounded-lg transition-all duration-200 ${
                      modoFiltro === op.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              {modoFiltro && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <FiltroConSugerencias
                    key={modoFiltro}
                    modoNombre={modoNombre}
                    onModoChange={() => {}}
                    filas={filas}
                    valorAplicado=""
                    autoAplicar={false}
                    mostrarSelect={false}
                    onSeleccionChange={setSeleccion}
                    onSeleccionarDep={() => {}}
                    onSeleccionarNombre={() => {}}
                    onLimpiar={() => setSeleccion(null)}
                  />

                  <button
                    type="button"
                    onClick={handleBuscarFiltrado}
                    disabled={generando || !seleccion}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accionGenerando === 'filtrado' ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Search size={18} />
                    )}
                    {accionGenerando === 'filtrado'
                      ? 'Generando...'
                      : modoFiltro === 'personal'
                        ? 'Buscar por Personal'
                        : 'Buscar por Dependencia'}
                  </button>

                  {seleccion && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      Seleccionado: <span className="font-semibold text-slate-700 dark:text-slate-200">{seleccion}</span>
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-center text-red-600 dark:text-red-400 font-medium">{error}</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
