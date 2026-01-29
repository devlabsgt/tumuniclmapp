"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Printer,
  Loader2,
  X,
  FileText,
  Edit,
  Eye,
  RotateCcw, // Undo
  RotateCw, // Redo
  Eraser, // Reset
} from "lucide-react";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { toast } from "react-toastify";

import {
  obtenerReporteNomina,
  ReporteNominaFila,
  obtenerFirmasAutoridades,
} from "./lib/actions";
import { NominaIngreso } from "./NominaIngreso";
import NominaImpresion from "./NominaImpresion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_POR_PAGINA = 28;

// Tipo de acción para el historial unificado
type ActionType = "col" | "oficina" | "emp";
type HistoryItem = { type: ActionType; value: string };

export default function InformeEmpleados({ isOpen, onClose }: Props) {
  const [datosBase, setDatosBase] = useState<ReporteNominaFila[]>([]);
  const [cantidadesManuales, setCantidadesManuales] = useState<
    Record<string, string>
  >({});
  const [vista, setVista] = useState<"ingreso" | "impresion">("impresion");
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [mes, setMes] = useState((new Date().getMonth() + 1).toString());
  const [firmas, setFirmas] = useState({ coordinator: "", dafim: "" });

  // ESTADOS DE FILTROS
  const [columnasOcultas, setColumnasOcultas] = useState<string[]>([]);
  const [oficinasOcultas, setOficinasOcultas] = useState<string[]>([]);
  const [empleadosOcultos, setEmpleadosOcultos] = useState<string[]>([]);

  // HISTORIAL UNIFICADO (Undo / Redo)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [future, setFuture] = useState<HistoryItem[]>([]);

  const pagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      setVista("impresion");
    }
  }, [isOpen]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dataNomina, dataFirmas] = await Promise.all([
        obtenerReporteNomina(),
        obtenerFirmasAutoridades(),
      ]);
      setDatosBase(dataNomina);
      setFirmas({ coordinator: dataFirmas.rrhh, dafim: dataFirmas.dafim });
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la nómina");
    } finally {
      setLoading(false);
    }
  };

  const datosCalculados = useMemo(() => {
    return datosBase.map((fila) => {
      const renglonLower = (fila.renglon || "").toLowerCase();
      const esVariable =
        renglonLower.includes("031") || renglonLower.includes("035");
      let salarioFinal = fila.salario_unitario;
      let bonifFinal = fila.bonificacion_unitaria;
      const valorInput = cantidadesManuales[fila.id];
      const cantidadNum =
        valorInput && valorInput !== "" ? parseFloat(valorInput) : 0;

      if (esVariable) {
        salarioFinal = fila.salario_unitario * cantidadNum;
        bonifFinal = fila.bonificacion_unitaria * cantidadNum;
      }

      const totalDevengado = salarioFinal + bonifFinal;
      const igss = salarioFinal * 0.0483;
      const plan = fila.plan_prestaciones ? salarioFinal * 0.07 : 0;
      const isr = fila.isr;
      let fianza = 0;
      if (fila.prima && salarioFinal > 0) {
        fianza = salarioFinal * 24 * 0.0005 + salarioFinal * 24 * 0.0005 * 0.12;
      }
      const totalDescuentos = igss + plan + isr + fianza;
      const liquido = totalDevengado - totalDescuentos;

      return {
        ...fila,
        cantidadDisplay: esVariable ? (cantidadesManuales[fila.id] ?? "") : "",
        esVariable,
        salarioFinal,
        bonifFinal,
        totalDevengado,
        igss,
        plan,
        fianza,
        totalDescuentos,
        liquido,
      };
    });
  }, [datosBase, cantidadesManuales]);

  const empleadosParaEditar = useMemo(
    () => datosCalculados.filter((d) => d.esVariable),
    [datosCalculados],
  );
  const faltantesPorIngresar = useMemo(
    () =>
      empleadosParaEditar.filter(
        (e) => !e.cantidadDisplay || e.cantidadDisplay === "0",
      ).length,
    [empleadosParaEditar],
  );

  const handleCantidadChange = (id: string, valor: string) => {
    if (/^\d*\.?\d*$/.test(valor)) {
      setCantidadesManuales((prev) => ({ ...prev, [id]: valor }));
    }
  };

  // --- LÓGICA DE HISTORIAL UNIFICADO ---

  const addToHistory = (type: ActionType, value: string) => {
    setHistory((prev) => [...prev, { type, value }]);
    setFuture([]); // Al hacer una nueva acción, borramos el futuro (Redo)
  };

  const handleOcultarColumna = (col: string) => {
    setColumnasOcultas((prev) => [...prev, col]);
    addToHistory("col", col);
  };

  const handleOcultarOficina = (oficina: string) => {
    setOficinasOcultas((prev) => [...prev, oficina]);
    addToHistory("oficina", oficina);
  };

  const handleOcultarEmpleado = (id: string) => {
    setEmpleadosOcultos((prev) => [...prev, id]);
    addToHistory("emp", id);
  };

  // 1. UNDO (Deshacer)
  const handleUndo = () => {
    if (history.length === 0) return;

    const newHistory = [...history];
    const lastAction = newHistory.pop(); // Sacamos la última acción
    setHistory(newHistory);

    if (lastAction) {
      // Revertimos el estado
      if (lastAction.type === "col") {
        setColumnasOcultas((prev) =>
          prev.filter((c) => c !== lastAction.value),
        );
      } else if (lastAction.type === "oficina") {
        setOficinasOcultas((prev) =>
          prev.filter((o) => o !== lastAction.value),
        );
      } else if (lastAction.type === "emp") {
        setEmpleadosOcultos((prev) =>
          prev.filter((e) => e !== lastAction.value),
        );
      }
      // La guardamos en future para poder hacer Redo
      setFuture((prev) => [...prev, lastAction]);
    }
  };

  // 2. REDO (Rehacer)
  const handleRedo = () => {
    if (future.length === 0) return;

    const newFuture = [...future];
    const nextAction = newFuture.pop(); // Sacamos la acción a rehacer
    setFuture(newFuture);

    if (nextAction) {
      // Aplicamos de nuevo el estado
      if (nextAction.type === "col") {
        setColumnasOcultas((prev) => [...prev, nextAction.value]);
      } else if (nextAction.type === "oficina") {
        setOficinasOcultas((prev) => [...prev, nextAction.value]);
      } else if (nextAction.type === "emp") {
        setEmpleadosOcultos((prev) => [...prev, nextAction.value]);
      }
      // La devolvemos al historial
      setHistory((prev) => [...prev, nextAction]);
    }
  };

  // 3. RESET (Reiniciar Todo)
  const handleReset = () => {
    setColumnasOcultas([]);
    setOficinasOcultas([]);
    setEmpleadosOcultos([]);
    setHistory([]);
    setFuture([]);
    toast.info("Vista restablecida");
  };

  const generatePdf = async () => {
    setVista("impresion");
    setIsPrinting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const container = pagesContainerRef.current;
    if (!container) {
      toast.error("Error visualizando.");
      setIsPrinting(false);
      return;
    }
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [8.5, 13],
      });
      const pages = Array.from(container.children) as HTMLElement[];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const dataUrl = await htmlToImage.toJpeg(page, {
          quality: 1.0,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
        if (i < pages.length - 1) pdf.addPage();
      }
      const nombreArchivo = `Nomina_${mes}_${anio}.pdf`;
      window.open(pdf.output("bloburl"), "_blank");
      setIsPrinting(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF.");
      setIsPrinting(false);
    }
  };

  const nombreMes = format(
    new Date(parseInt(anio), parseInt(mes) - 1),
    "MMMM",
    { locale: es },
  ).toUpperCase();
  const numeroInforme = `${mes.padStart(2, "0")}-${anio}`;
  const fechaHoyTexto = format(new Date(), "d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  const formatQ = (val: number) =>
    val.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const totales = {
    salarios: datosCalculados.reduce((a, c) => a + c.salarioFinal, 0),
    bonis: datosCalculados.reduce((a, c) => a + c.bonifFinal, 0),
    devengado: datosCalculados.reduce((a, c) => a + c.totalDevengado, 0),
    liquido: datosCalculados.reduce((a, c) => a + c.liquido, 0),
    descuentos: datosCalculados.reduce((a, c) => a + c.totalDescuentos, 0),
  };

  const hayCambios = history.length > 0 || future.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-[95vh] flex flex-col p-0 bg-white dark:bg-neutral-900 text-black [&>button]:hidden">
        <DialogHeader className="p-4 border-b flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl shrink-0">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-lg font-bold dark:text-white truncate">
              Generar Nómina
            </DialogTitle>
          </div>

          <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setVista("impresion")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${vista === "impresion" ? "bg-white shadow text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Eye className="w-3.5 h-3.5" /> Ver Nómina
            </button>
            <button
              onClick={() => setVista("ingreso")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${vista === "ingreso" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Edit className="w-3.5 h-3.5" /> Ingresar Datos
              {faltantesPorIngresar > 0 ? (
                <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] border border-red-200">
                  {faltantesPorIngresar}
                </span>
              ) : (
                <span className="ml-1 text-green-600 text-[10px]">✓</span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* --- CONTROLES DE UNDO / RESET / REDO --- */}
            <div className="flex items-center gap-1 mr-4 bg-gray-50 p-1 rounded-md border border-gray-200">
              {/* 1. UNDO */}
              <Button
                onClick={handleUndo}
                disabled={history.length === 0}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${history.length > 0 ? "text-gray-700 hover:bg-gray-200" : "text-gray-300"}`}
                title="Deshacer (Undo)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {/* 2. RESET */}
              <Button
                onClick={handleReset}
                disabled={!hayCambios}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${hayCambios ? "text-red-600 hover:bg-red-50" : "text-gray-300"}`}
                title="Reiniciar vista (Reset)"
              >
                <Eraser className="h-4 w-4" />
              </Button>

              {/* 3. REDO */}
              <Button
                onClick={handleRedo}
                disabled={future.length === 0}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${future.length > 0 ? "text-gray-700 hover:bg-gray-200" : "text-gray-300"}`}
                title="Rehacer (Redo)"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2 items-center bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-md border dark:border-neutral-700 h-10">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Informe:
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {numeroInforme}
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                className="w-20 h-10 text-sm font-semibold"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
              />
              <select
                className="h-10 w-24 px-2 text-sm font-semibold border rounded-md bg-transparent dark:text-white dark:border-neutral-700 dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format(new Date(2024, i, 1), "MMM", {
                      locale: es,
                    }).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 ml-2">
              <Button
                onClick={generatePdf}
                disabled={loading || datosBase.length === 0 || isPrinting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6"
              >
                {isPrinting ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}{" "}
                PDF
              </Button>
              <Button onClick={onClose} variant="outline" className="h-10 px-3">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-neutral-950 p-6 flex justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-gray-500 h-full">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <span>Calculando nómina...</span>
            </div>
          ) : (
            <>
              {vista === "ingreso" && (
                <div className="w-full bg-white dark:bg-neutral-900 shadow-sm rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Ingreso de Días/Horas
                  </h2>
                  <NominaIngreso
                    empleados={empleadosParaEditar}
                    onChange={handleCantidadChange}
                    formatQ={formatQ}
                  />
                  <div className="mt-8 flex justify-end">
                    <Button
                      onClick={() => setVista("impresion")}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 shadow-lg text-white font-bold px-8"
                    >
                      <Eye className="w-5 h-5 mr-2" /> Ver Nómina Final
                    </Button>
                  </div>
                </div>
              )}

              <div className={`${vista === "ingreso" ? "hidden" : "block"}`}>
                <NominaImpresion
                  ref={pagesContainerRef}
                  datos={datosCalculados}
                  anio={anio}
                  nombreMes={nombreMes}
                  numeroInforme={numeroInforme}
                  fechaHoyTexto={fechaHoyTexto}
                  itemsPorPagina={ITEMS_POR_PAGINA}
                  firmas={firmas}
                  formatQ={formatQ}
                  totales={totales}
                  columnasOcultas={columnasOcultas}
                  oficinasOcultas={oficinasOcultas}
                  empleadosOcultos={empleadosOcultos}
                  onOcultarColumna={handleOcultarColumna}
                  onOcultarOficina={handleOcultarOficina}
                  onOcultarEmpleado={handleOcultarEmpleado}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
