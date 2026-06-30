"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FOLIO_FIN_PRESET_MODAL,
  FOLIO_INICIO,
  folioNumericoDesdeCodigo,
  formatearFolio,
} from "./config";
import { inputMonoClass, labelClass } from "./formStyles";

const FOLIO_HASTA_PRESET = FOLIO_FIN_PRESET_MODAL;

interface Props {
  visible: boolean;
  onClose: () => void;
  beneficiarios: { codigo: string; estado?: string | null }[];
}

const normalizarFolioInput = (valor: string): string =>
  valor.replace(/\D/g, "").slice(0, 4);

const folioDesdeInput = (valor: string, fallback: number): number => {
  const digitos = normalizarFolioInput(valor);
  if (!digitos) return fallback;
  const n = parseInt(digitos, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(FOLIO_INICIO, n);
};

export default function MISSINGFolioModal({
  visible,
  onClose,
  beneficiarios,
}: Props) {
  const [rangoIni, setRangoIni] = useState(formatearFolio(FOLIO_INICIO));
  const [rangoFin, setRangoFin] = useState(formatearFolio(FOLIO_HASTA_PRESET));

  useEffect(() => {
    if (!visible) return;
    setRangoIni(formatearFolio(FOLIO_INICIO));
    setRangoFin(formatearFolio(FOLIO_HASTA_PRESET));
  }, [visible]);

  const foliosRegistrados = useMemo(() => {
    const set = new Set<number>();
    for (const b of beneficiarios) {
      const folio = folioNumericoDesdeCodigo(b.codigo);
      if (folio !== null && folio >= FOLIO_INICIO) {
        set.add(folio);
      }
    }
    return set;
  }, [beneficiarios]);

  const desde = folioDesdeInput(rangoIni, FOLIO_INICIO);
  const hasta = folioDesdeInput(rangoFin, FOLIO_HASTA_PRESET);
  const rangoMin = Math.min(desde, hasta);
  const rangoMax = Math.max(desde, hasta);

  const faltantesEnRango = useMemo(() => {
    const total: number[] = [];
    for (let i = rangoMin; i <= rangoMax; i++) {
      if (!foliosRegistrados.has(i)) total.push(i);
    }
    return total;
  }, [foliosRegistrados, rangoMin, rangoMax]);

  const faltantesPreset = useMemo(() => {
    const total: number[] = [];
    for (let i = FOLIO_INICIO; i <= FOLIO_HASTA_PRESET; i++) {
      if (!foliosRegistrados.has(i)) total.push(i);
    }
    return total;
  }, [foliosRegistrados]);

  const faltantes = useMemo(
    () => faltantesEnRango.map((f) => formatearFolio(f)),
    [faltantesEnRango],
  );

  const rangoEtiqueta = `${formatearFolio(rangoMin)} – ${formatearFolio(rangoMax)}`;
  const rangoTotalEtiqueta = `${formatearFolio(FOLIO_INICIO)} – ${formatearFolio(FOLIO_HASTA_PRESET)}`;

  const restablecerRangoCompleto = () => {
    setRangoIni(formatearFolio(FOLIO_INICIO));
    setRangoFin(formatearFolio(FOLIO_HASTA_PRESET));
  };

  const esRangoCompleto =
    rangoMin === FOLIO_INICIO && rangoMax === FOLIO_HASTA_PRESET;

  const manejarCerrar = () => onClose();

  const generarPdfFoliosFaltantes = () => {
    const doc = new jsPDF({ orientation: "portrait", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text(`Folios faltantes (${rangoEtiqueta})`, pageWidth / 2, 20, {
      align: "center",
    });
    doc.setFontSize(11);
    doc.text(`Total en rango: ${faltantes.length}`, pageWidth / 2, 28, {
      align: "center",
    });
    doc.text(
      `Total general (${rangoTotalEtiqueta}): ${faltantesPreset.length}`,
      pageWidth / 2,
      35,
      { align: "center" },
    );

    const filas = [];
    for (let i = 0; i < faltantes.length; i += 4) {
      filas.push([
        faltantes[i] || "",
        faltantes[i + 1] || "",
        faltantes[i + 2] || "",
        faltantes[i + 3] || "",
      ]);
    }

    autoTable(doc, {
      startY: 42,
      head: [["Columna 1", "Columna 2", "Columna 3", "Columna 4"]],
      body: filas,
      theme: "grid",
      styles: { fontSize: 10, halign: "center", cellPadding: 3 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <Transition show={visible} as={Fragment}>
      <Dialog onClose={manejarCerrar} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl">
              {/* Cabecera */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-neutral-800 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                      <FileWarning
                        size={18}
                        className="text-orange-600 dark:text-orange-400"
                      />
                    </div>
                    <Dialog.Title className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                      Folios faltantes
                    </Dialog.Title>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Rango global {rangoTotalEtiqueta} ·{" "}
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {faltantesPreset.length} faltantes en total
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={manejarCerrar}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-200 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filtro por rango */}
              <div className="border-b border-gray-100 dark:border-neutral-800 px-5 py-4 sm:px-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <label className={labelClass}>Desde</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      maxLength={4}
                      value={rangoIni}
                      onChange={(e) =>
                        setRangoIni(normalizarFolioInput(e.target.value))
                      }
                      onBlur={() => {
                        if (rangoIni)
                          setRangoIni(formatearFolio(folioDesdeInput(rangoIni, FOLIO_INICIO)));
                      }}
                      placeholder={formatearFolio(FOLIO_INICIO)}
                      className={inputMonoClass}
                    />
                  </div>
                  <span className="hidden sm:block pb-2.5 text-gray-400 font-medium">
                    —
                  </span>
                  <div className="flex-1 min-w-0">
                    <label className={labelClass}>Hasta</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      maxLength={4}
                      value={rangoFin}
                      onChange={(e) =>
                        setRangoFin(normalizarFolioInput(e.target.value))
                      }
                      onBlur={() => {
                        if (rangoFin)
                          setRangoFin(formatearFolio(folioDesdeInput(rangoFin, FOLIO_HASTA_PRESET)));
                      }}
                      placeholder={formatearFolio(FOLIO_HASTA_PRESET)}
                      className={inputMonoClass}
                    />
                  </div>
                  <div className="sm:pb-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      En rango
                    </p>
                    <div className="h-10 flex items-center justify-center sm:justify-start px-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <span className="text-lg font-bold font-mono text-orange-600 dark:text-orange-400">
                        {faltantes.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={restablecerRangoCompleto}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-all active:scale-95 ${
                      esRangoCompleto
                        ? "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300"
                        : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    Todo ({formatearFolio(FOLIO_INICIO)}–{formatearFolio(FOLIO_HASTA_PRESET)})
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-auto px-5 py-4 sm:px-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Mostrando folios faltantes del rango{" "}
                  <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                    {rangoEtiqueta}
                  </span>
                </p>

                {faltantes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                      <FileWarning
                        size={24}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No hay folios faltantes en este rango
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Prueba otro rango o pulsa &quot;Todo&quot;
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {faltantes.map((folio) => (
                      <div
                        key={folio}
                        className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/80 py-2 px-1 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20 dark:hover:border-orange-800 transition-colors"
                      >
                        {folio}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pie */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-gray-100 dark:border-neutral-800 px-5 py-4 sm:px-6">
                <Button
                  variant="outline"
                  onClick={manejarCerrar}
                  className="w-full sm:w-auto dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={generarPdfFoliosFaltantes}
                  disabled={faltantes.length === 0}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Download size={16} />
                  Descargar PDF ({faltantes.length})
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
