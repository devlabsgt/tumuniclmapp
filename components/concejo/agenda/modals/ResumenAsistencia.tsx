"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, getYear, getMonth, setMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  Printer,
  Loader2,
  ChevronDown,
  CalendarDays,
  Filter,
  X,
} from "lucide-react";
import { AgendaConcejo } from "../lib/esquemas";
import { obtenerDatosReporte, ReporteFila } from "../lib/acciones";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agendas: AgendaConcejo[];
}

const obtenerPesoCargo = (cargo: string): number => {
  const c = cargo.toUpperCase().trim();
  if (c.includes("ALCALDE")) return 1;
  if (/SINDICO\s+(I|1|PRIMERO)\b/.test(c)) return 2;
  if (/SINDICO\s+(II|2|SEGUNDO)\b/.test(c)) return 3;
  if (/SINDICO\s+(III|3|TERCERO)\b/.test(c)) return 4;
  if (c.includes("SINDICO SUPLENTE")) return 5;
  if (/CONCEJAL\s+(I|1|PRIMERO)\b/.test(c)) return 10;
  if (/CONCEJAL\s+(II|2|SEGUNDO)\b/.test(c)) return 11;
  if (/CONCEJAL\s+(III|3|TERCERO)\b/.test(c)) return 12;
  if (/CONCEJAL\s+(IV|4|CUARTO)\b/.test(c)) return 13;
  if (/CONCEJAL\s+(V|5|QUINTO)\b/.test(c)) return 14;
  if (/CONCEJAL\s+(VI|6|SEXTO)\b/.test(c)) return 15;
  if (/CONCEJAL\s+(VII|7|SEPTIMO)\b/.test(c)) return 16;
  if (/CONCEJAL\s+(VIII|8|OCTAVO)\b/.test(c)) return 17;
  if (/CONCEJAL\s+(IX|9|NOVENO)\b/.test(c)) return 18;
  if (/CONCEJAL\s+(X|10|DECIMO)\b/.test(c)) return 19;
  if (
    /PRIMER\s+CONCEJAL\s+SUPLENTE/.test(c) ||
    /CONCEJAL\s+SUPLENTE\s+(I|1|PRIMERO)/.test(c)
  )
    return 30;
  if (
    /SEGUNDO\s+CONCEJAL\s+SUPLENTE/.test(c) ||
    /CONCEJAL\s+SUPLENTE\s+(II|2|SEGUNDO)/.test(c)
  )
    return 31;
  if (
    /TERCER\s+CONCEJAL\s+SUPLENTE/.test(c) ||
    /CONCEJAL\s+SUPLENTE\s+(III|3|TERCERO)/.test(c)
  )
    return 32;
  if (c.includes("CONCEJAL SUPLENTE")) return 39;
  if (c.includes("SECRETARIO")) return 99;
  return 100;
};

export default function ResumenAsistencia({ isOpen, onClose, agendas }: Props) {
  const [datos, setDatos] = useState<ReporteFila[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [mesSeleccionado, setMesSeleccionado] = useState<string>("todos");
  const printRef = useRef<HTMLDivElement>(null);

  const aniosDisponibles = useMemo(() => {
    const years = new Set(
      agendas.map((a) => getYear(new Date(a.fecha_reunion)).toString()),
    );
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [agendas]);

  useEffect(() => {
    if (isOpen && aniosDisponibles.length > 0 && !anioSeleccionado) {
      const hoy = new Date();
      const anioActual = getYear(hoy).toString();
      const mesActual = getMonth(hoy).toString();
      if (aniosDisponibles.includes(anioActual)) {
        setAnioSeleccionado(anioActual);
        setMesSeleccionado(mesActual.toString());
      } else {
        setAnioSeleccionado(aniosDisponibles[0]);
        setMesSeleccionado("todos");
      }
    }
  }, [isOpen, aniosDisponibles, anioSeleccionado]);

  const mesesDisponibles = useMemo(() => {
    if (!anioSeleccionado) return [];
    const agendasDelAnio = agendas.filter(
      (a) => getYear(new Date(a.fecha_reunion)).toString() === anioSeleccionado,
    );
    const mesesSet = new Set(
      agendasDelAnio.map((a) => getMonth(new Date(a.fecha_reunion))),
    );
    return Array.from(mesesSet)
      .sort((a, b) => a - b)
      .map((mesIndex) => ({
        value: mesIndex.toString(),
        label: format(setMonth(new Date(), mesIndex), "MMMM", {
          locale: es,
        }).toUpperCase(),
      }));
  }, [agendas, anioSeleccionado]);

  const agendasReporte = useMemo(() => {
    if (!anioSeleccionado) return [];
    return agendas.filter((agenda) => {
      const fecha = new Date(agenda.fecha_reunion);
      const coincideAnio = getYear(fecha).toString() === anioSeleccionado;
      const coincideMes =
        mesSeleccionado === "todos" ||
        getMonth(fecha).toString() === mesSeleccionado;
      return coincideAnio && coincideMes && agenda.estado !== "En preparación";
    });
  }, [agendas, anioSeleccionado, mesSeleccionado]);

  useEffect(() => {
    if (isOpen && agendasReporte.length > 0) {
      setLoading(true);
      obtenerDatosReporte(agendasReporte)
        .then((data) => {
          const datosConPago = data.filter((d) => d.total_devengado > 0);
          const datosOrdenados = datosConPago.sort((a, b) => {
            const pesoA = obtenerPesoCargo(a.cargo);
            const pesoB = obtenerPesoCargo(b.cargo);
            return pesoA - pesoB;
          });
          setDatos(datosOrdenados);
        })
        .catch((e) => {
          console.error(e);
          toast.error("Error al procesar datos");
        })
        .finally(() => setLoading(false));
    } else {
      setDatos([]);
      setLoading(false);
    }
  }, [isOpen, agendasReporte]);

  const agendasVisibles = useMemo(() => {
    const ordenadas = [...agendasReporte].sort(
      (a, b) =>
        new Date(a.fecha_reunion).getTime() -
        new Date(b.fecha_reunion).getTime(),
    );
    return ordenadas.filter((agenda) => {
      return datos.some((fila) => {
        const asistencia = fila.asistencias[agenda.id];
        return asistencia && asistencia.devengado > 0;
      });
    });
  }, [agendasReporte, datos]);

  const nombreAlcalde = useMemo(
    () =>
      datos.find((d) => d.cargo.toUpperCase().includes("ALCALDE"))?.nombre ||
      "",
    [datos],
  );
  const nombreSecretario = useMemo(() => {
    const nombre =
      datos.find((d) => d.cargo.toUpperCase().includes("SECRETARIO"))?.nombre ||
      "";
    return nombre ? `Lic. ${nombre}` : "";
  }, [datos]);

  const generatePdf = async () => {
    setIsPrinting(true);
    const element = printRef.current;
    if (!element) {
      toast.error("Error: Elemento no encontrado.");
      setIsPrinting(false);
      return;
    }
    try {
      const dataUrl = await htmlToImage.toJpeg(element, {
        quality: 1.0,
        backgroundColor: "#ffffff",
        pixelRatio: 4,
        width: 1080,
        style: { margin: "0" },
      });
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "in",
        format: [8.5, 13],
      });

      const marginTop = 1.0;
      const marginLeft = 0;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pdfWidth;

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = usableWidth / imgWidth;
        const newHeight = imgHeight * ratio;

        pdf.addImage(
          img,
          "JPEG",
          marginLeft,
          marginTop,
          usableWidth,
          newHeight,
        );

        const nombreArchivo = `Asistencia_${anioSeleccionado}_${mesSeleccionado === "todos" ? "Anual" : mesesDisponibles.find((m) => m.value === mesSeleccionado)?.label}.pdf`;
        if (window.innerWidth < 768) pdf.save(nombreArchivo);
        else window.open(pdf.output("bloburl"), "_blank");
        setIsPrinting(false);
      };
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF.");
      setIsPrinting(false);
    }
  };

  const tituloMes =
    mesSeleccionado !== "todos"
      ? mesesDisponibles.find((m) => m.value === mesSeleccionado)?.label || ""
      : "TODOS LOS MESES";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 bg-white dark:bg-neutral-900 text-black [&>button]:hidden">
        <DialogHeader className="p-4 border-b flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl shrink-0">
              <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-lg font-bold dark:text-white truncate">
              Resumen de Asistencia
            </DialogTitle>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-36 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-500" />
              </div>
              <select
                value={anioSeleccionado}
                onChange={(e) => {
                  setAnioSeleccionado(e.target.value);
                  setMesSeleccionado("todos");
                }}
                disabled={
                  loading || isPrinting || aniosDisponibles.length === 0
                }
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-700 dark:text-gray-200 font-semibold appearance-none"
              >
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
                {aniosDisponibles.length === 0 && (
                  <option value="">Sin datos</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-56 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDays className="h-4 w-4 text-gray-500" />
              </div>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                disabled={loading || isPrinting || !anioSeleccionado}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-700 dark:text-gray-200 font-semibold appearance-none"
              >
                <option value="todos">TODOS LOS MESES</option>
                {mesesDisponibles.map((mes) => (
                  <option key={mes.value} value={mes.value}>
                    {mes.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={generatePdf}
                disabled={loading || datos.length === 0 || isPrinting}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all active:scale-95"
              >
                {isPrinting ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                {isPrinting ? "Generando..." : "Descargar PDF"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                disabled={loading || isPrinting}
                className="flex-1 sm:flex-none border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200"
              >
                <X className="h-4 w-4" />
                <span className="ml-2">Cerrar</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-neutral-950 p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Cargando...</span>
            </div>
          ) : agendasVisibles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
              <CalendarDays className="h-10 w-10 opacity-50" />
              <p className="text-sm">No hay registros.</p>
            </div>
          ) : (
            <div
              className="bg-white px-6 pb-8 pt-4 w-[1080px] mx-auto shadow-sm"
              ref={printRef}
            >
              <div className="text-center mb-4 font-serif text-black">
                <h1 className="text-sm font-bold uppercase mb-1 tracking-wide">
                  Libro de Hojas Móviles para Asistencia a Reuniones del Concejo
                  Municipal
                </h1>
                <h2 className="text-xs text-gray-800">
                  Asistencia a Reuniones del Concejo Municipal correspondientes
                  al mes de{" "}
                  <span className="font-bold px-1 uppercase">{tituloMes}</span>{" "}
                  del año <span className="font-bold">{anioSeleccionado}</span>
                </h2>
              </div>
              <table className="w-full border-collapse text-xs font-sans text-black border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-8 text-center font-bold">
                      No.
                    </th>
                    <th className="border border-black p-1 text-left w-[200px] font-bold uppercase tracking-tight">
                      FUNCIONARIO
                    </th>
                    <th className="border border-black p-1 text-left w-[100px] font-bold uppercase tracking-tight">
                      CARGO
                    </th>
                    {agendasVisibles.map((agenda, i) => (
                      <th
                        key={agenda.id}
                        className="border border-black p-1 text-center w-[90px]"
                      >
                        <div className="font-bold leading-tight">
                          {agenda.titulo}
                        </div>
                        <div className="font-medium text-[10px]">
                          {format(new Date(agenda.fecha_reunion), "dd/MM/yy")}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.map((fila, idx) => (
                    <tr key={fila.usuario_id} className="break-inside-avoid">
                      <td className="border border-black p-1 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-black p-1 uppercase font-bold whitespace-normal">
                        {fila.nombre}
                      </td>
                      <td className="border border-black p-1 capitalize font-medium whitespace-normal">
                        {fila.cargo}
                      </td>
                      {agendasVisibles.map((agenda) => {
                        const reg = fila.asistencias[agenda.id];
                        return (
                          <td
                            key={agenda.id}
                            className="border border-black p-1 text-center align-middle h-8"
                          >
                            {reg && reg.devengado > 0 ? (
                              <div className="flex flex-col h-full justify-center">
                                <div className="text-[10px] text-center mb-0.5 whitespace-nowrap leading-tight tracking-tighter">
                                  <span className="font-bold">E:</span>
                                  {reg.entrada
                                    ? format(new Date(reg.entrada), "HH:mm")
                                    : "--"}{" "}
                                  <span className="font-bold ml-1">S:</span>
                                  {reg.salida
                                    ? format(new Date(reg.salida), "HH:mm")
                                    : "--"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs select-none font-light block w-full text-center">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="w-full text-left mt-1 text-xs font-medium text-gray-600">
                E: <span className="font-bold">Entrada</span> | S:{" "}
                <span className="font-bold">Salida</span>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-20 text-center text-xs text-black mb-4 px-16 font-medium break-inside-avoid">
                <div className="flex flex-col gap-1 items-center">
                  <div className="border-t border-black pt-2 w-full max-w-[200px]"></div>
                  <p className="font-bold uppercase tracking-wide">
                    {nombreSecretario}
                  </p>
                  <p className="font-bold uppercase tracking-wide text-[10px]">
                    Secretario Municipal
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <div className="border-t border-black pt-2 w-full max-w-[200px]"></div>
                  <p className="font-bold uppercase tracking-wide">
                    {nombreAlcalde}
                  </p>
                  <p className="font-bold uppercase tracking-wide text-[10px]">
                    Alcalde Municipal
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
