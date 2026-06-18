"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Download, Loader2, Calendar, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ComisionConFechaYHoraSeparada } from "@/hooks/comisiones/useObtenerComisiones";
import { toPng } from "html-to-image";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatFechaHoraComision, formatHoraComisionDesdeIso } from "@/lib/comisiones/formatoFecha";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

interface Props {
  comision: ComisionConFechaYHoraSeparada | null;
  registros: any[];
  userId: string | null;
  userNombre: string;
  isOpen: boolean;
  onClose: () => void;
  usuarios: any[];
}

// ── TEMPLATE COMPONENT FOR IMAGE GENERATION ──
const ComisionTemplate = React.forwardRef<
  HTMLDivElement,
  {
    comision: ComisionConFechaYHoraSeparada;
    puestoNombre: string;
    oficinaNombre: string;
    userNombre: string;
    entradaTime: string;
    salidaTime: string;
    duracion: string | null;
    encargado: { nombre: string } | null;
  }
>(({ comision, puestoNombre, oficinaNombre, userNombre, entradaTime, salidaTime, duracion, encargado }, ref) => {
  const fechaCompleta = parseISO(comision.fecha_hora.replace(" ", "T"));

  return (
    <div
      ref={ref}
      className="p-8 bg-white text-neutral-900 border border-neutral-200 rounded-lg relative overflow-hidden flex flex-col justify-between"
      style={{
        width: "800px",
        height: "600px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      <div>
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-blue-600 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo-muni.png"
              alt="Logo Municipalidad"
              className="h-16 object-contain"
              crossOrigin="anonymous"
            />
            <div>
              <p className="text-xl font-black text-blue-900 tracking-wider uppercase leading-tight">
                Constancia de Comisión
              </p>
              <p className="text-sm text-neutral-500 uppercase font-bold">
                Municipalidad de Concepción Las Minas
              </p>
              <p className="text-xs text-neutral-400">Chiquimula, Guatemala</p>
            </div>
          </div>
          <div className="text-right">
            {/* Clean right side matching modal preview layout without X button */}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 relative z-10">
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-bold text-neutral-800 uppercase leading-none">{userNombre}</p>
            <p className="text-xs font-semibold text-blue-600 uppercase">
              {puestoNombre || "Sin puesto asignado"}
            </p>
            <p className="text-xs text-neutral-500 font-medium italic">
              {oficinaNombre || "General"}
            </p>
          </div>
          <div className="text-center flex flex-col justify-center bg-blue-50/30 rounded-xl border border-blue-100/50 p-4">
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 block">
              Comisión / Actividad:
            </label>
            <p className="text-sm font-black text-blue-800 tracking-tight">
              {comision.titulo}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 relative z-10 p-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
          <div className="relative pl-6 border-l-4 border-emerald-500">
            <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">
              Fecha y Hora Programada
            </label>
            <p className="text-base font-bold text-neutral-800">
              {formatFechaHoraComision(fechaCompleta)}
            </p>
          </div>
          <div className="relative pl-6 border-l-4 border-orange-500">
            <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1 block">
              Registros de Asistencia
            </label>
            <div className="space-y-1">
              <p className="text-xs text-neutral-700 font-medium">
                <span className="font-bold">Entrada:</span> {entradaTime}
              </p>
              <p className="text-xs text-neutral-700 font-medium">
                <span className="font-bold">Salida:</span> {salidaTime}
              </p>
              {duracion && (
                <p className="text-xs text-blue-700 font-bold">
                  <span className="font-bold">Duración:</span> {duracion}
                </p>
              )}
            </div>
          </div>
        </div>

        {(encargado || (comision.comentarios && comision.comentarios.length > 0)) && (
          <div className="grid grid-cols-2 gap-8 mb-6 relative z-10">
            <div className="flex flex-col gap-4">
              {encargado && (
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">
                    Encargado(a)
                  </label>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs font-bold text-neutral-850">
                    {encargado.nombre}
                  </div>
                </div>
              )}
              <div className="mt-1">
                <span
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    comision.aprobado ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {comision.aprobado ? "APROBADO" : "PENDIENTE DE APROBACIÓN"}
                </span>
              </div>
            </div>
            <div>
              {comision.comentarios && comision.comentarios.length > 0 && (
                <>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 block">
                    Notas de la Comisión
                  </label>
                  <div className="px-6 py-4 bg-neutral-50 rounded-xl text-neutral-600 text-xs leading-relaxed border border-neutral-100 min-h-[120px]">
                    <ul className="list-disc list-inside space-y-1">
                      {comision.comentarios.map((nota, i) => (
                        <li key={i}>{nota}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1.5 flex">
        <div className="flex-1 bg-blue-900"></div>
        <div className="flex-1 bg-blue-600"></div>
        <div className="flex-1 bg-blue-400"></div>
        <div className="flex-1 bg-blue-200"></div>
      </div>
    </div>
  );
});
ComisionTemplate.displayName = "ComisionTemplate";

// ── MAIN PREVIEW MODAL ──
export default function PreviewComision({ comision, registros, userId, userNombre, isOpen, onClose, usuarios }: Props) {
  const templateRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);
  const [puestoNombre, setPuestoNombre] = useState("");
  const [oficinaNombre, setOficinaNombre] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      const fetchUserData = async () => {
        const supabase = createClient();
        const { data: infoUsuario } = await supabase
          .from("info_usuario")
          .select("dependencia_id")
          .eq("user_id", userId)
          .single();

        if (infoUsuario?.dependencia_id) {
          const { data: dep } = await supabase
            .from("dependencias")
            .select("nombre, parent_id")
            .eq("id", infoUsuario.dependencia_id)
            .single();
          if (dep) {
            setPuestoNombre(dep.nombre);
            if (dep.parent_id) {
              const { data: parent } = await supabase
                .from("dependencias")
                .select("nombre")
                .eq("id", dep.parent_id)
                .single();
              setOficinaNombre(parent?.nombre || dep.nombre);
            } else {
              setOficinaNombre(dep.nombre);
            }
          }
        }
      };
      fetchUserData();
    }
  }, [isOpen, userId]);

  if (!isOpen || !comision) return null;

  const fechaCompleta = parseISO(comision.fecha_hora.replace(" ", "T"));

  // Buscar registros del usuario logueado
  const registroEntrada = registros?.find(
    (r) => r.user_id === userId && r.tipo_registro === "Entrada"
  );
  const registroSalida = registros?.find(
    (r) => r.user_id === userId && r.tipo_registro === "Salida"
  );

  const formatTime = (dateString: string | undefined) =>
    formatHoraComisionDesdeIso(dateString);

  const entradaTime = formatTime(registroEntrada?.created_at);
  const salidaTime = formatTime(registroSalida?.created_at);

  const duracionComision = (() => {
    if (!registroEntrada || !registroSalida) return null;
    const diff =
      new Date(registroSalida.created_at).getTime() -
      new Date(registroEntrada.created_at).getTime();
    if (diff < 0) return null;
    let minutos = Math.floor(diff / 60000);
    let horas = Math.floor(minutos / 60);
    minutos = minutos % 60;
    const parts = [];
    if (horas > 0) parts.push(`${horas}h`);
    if (minutos > 0) parts.push(`${minutos}m`);
    return parts.join(" ") || "0m";
  })();

  const getUsuarioNombre = (id: string) => {
    const user = usuarios?.find((u) => u.id === id);
    return user ? user.nombre : "Desconocido";
  };

  const encargadoObj = (comision.asistentes || []).find((a) => a.encargado)
    ? { nombre: getUsuarioNombre((comision.asistentes || []).find((a) => a.encargado)!.id) }
    : null;

  const handleDescargar = async () => {
    if (!templateRef.current) return;
    setDescargando(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const dataUrl = await toPng(templateRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Comision_${userNombre.replace(/\s+/g, "_") || "Asistente"}_${format(fechaCompleta, "dd-MM-yyyy")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Imagen descargada");
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar la tarjeta");
    } finally {
      setDescargando(false);
    }
  };

  const estadoColor = comision.aprobado
    ? "bg-emerald-600 text-white"
    : "bg-amber-500 text-white";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Breakout transparent backdrop */}
      <div className="fixed -inset-[100vmax] bg-black/5 dark:bg-black/20 backdrop-blur-md -z-10 pointer-events-none" />

      {/* Hidden template for high-quality PNG download */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}>
        <ComisionTemplate
          ref={templateRef}
          comision={comision}
          puestoNombre={puestoNombre}
          oficinaNombre={oficinaNombre}
          userNombre={userNombre}
          entradaTime={entradaTime}
          salidaTime={salidaTime}
          duracion={duracionComision}
          encargado={encargadoObj}
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-blue-600">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-muni.png"
              alt="Logo"
              className="h-12 object-contain"
              crossOrigin="anonymous"
            />
            <div>
              <p className="text-[10px] font-bold text-blue-900 dark:text-blue-400 tracking-wider uppercase leading-tight">
                Constancia de Comisión
              </p>
              <p className="text-[9px] text-neutral-500 uppercase font-semibold">
                Municipalidad de Concepción Las Minas
              </p>
              <p className="text-[8px] text-neutral-400">Chiquimula, Guatemala</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-neutral-800 rounded-xl transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[65vh] custom-scrollbar">
          {/* User Info & Commission Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-neutral-800 dark:text-neutral-100 uppercase leading-snug">
                {userNombre}
              </p>
              <p className="text-[9px] font-semibold text-blue-600 uppercase">
                {puestoNombre || "Sin puesto asignado"}
              </p>
              <p className="text-[9px] text-neutral-500 italic">
                {oficinaNombre || "General"}
              </p>
            </div>
            <div className="flex flex-col justify-center items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 px-2 py-2 text-center">
              <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">
                Actividad
              </label>
              <p className="text-[9px] font-black text-blue-800 dark:text-blue-200 capitalize leading-snug">
                {comision.titulo}
              </p>
            </div>
          </div>

          {/* Dates & Attendance */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-100 dark:border-neutral-700">
            <div className="pl-3 border-l-4 border-emerald-500">
              <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">
                Fecha Programada
              </label>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                {formatFechaHoraComision(fechaCompleta)}
              </p>
            </div>
            <div className="pl-3 border-l-4 border-orange-500">
              <label className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mb-1 block">
                Registros de Asistencia
              </label>
              <div className="space-y-0.5">
                <p className="text-[9px] text-neutral-600 dark:text-neutral-400 font-medium">
                  <span className="font-bold">Entrada:</span> {entradaTime}
                </p>
                <p className="text-[9px] text-neutral-600 dark:text-neutral-400 font-medium">
                  <span className="font-bold">Salida:</span> {salidaTime}
                </p>
                {duracionComision && (
                  <p className="text-[9px] text-blue-700 dark:text-blue-400 font-bold">
                    <span className="font-bold">Duración:</span> {duracionComision}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notas en dos columnas */}
          {(encargadoObj || (comision.comentarios && comision.comentarios.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                {encargadoObj && (
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1 block">
                      Encargado(a)
                    </label>
                    <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700 text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
                      {encargadoObj.nombre}
                    </div>
                  </div>
                )}
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${estadoColor}`}>
                    {comision.aprobado ? "APROBADO" : "PENDIENTE"}
                  </span>
                </div>
              </div>
              <div>
                {comision.comentarios && comision.comentarios.length > 0 && (
                  <>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1 block">
                      Notas de la Comisión
                    </label>
                    <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-neutral-600 dark:text-neutral-300 text-[9px] leading-relaxed border border-neutral-100 dark:border-neutral-700 min-h-[80px]">
                      <ul className="list-disc list-inside space-y-0.5">
                        {comision.comentarios.map((nota, i) => (
                          <li key={i}>{nota}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colors bar */}
        <div className="flex h-2 w-full">
          <div className="flex-1 bg-blue-900" />
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-blue-400" />
          <div className="flex-1 bg-blue-200" />
        </div>

        {/* Action Button */}
        <div className="px-5 py-3 bg-white dark:bg-neutral-900 flex justify-end border-t border-gray-100 dark:border-neutral-800">
          <Button
            onClick={handleDescargar}
            disabled={descargando}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-5 rounded-xl font-bold text-sm shadow-sm"
          >
            {descargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Descargar Tarjeta
          </Button>
        </div>
      </div>
    </div>
  );
}
