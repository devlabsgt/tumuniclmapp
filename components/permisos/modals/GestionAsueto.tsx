"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, CalendarDays, Edit2, PartyPopper, Loader2, CalendarRange, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerAsuetos, crearAsueto, actualizarAsueto, eliminarAsueto, Asueto } from "@/lib/asuetos/acciones";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import Swal from "sweetalert2";

interface GestionAsuetoProps {
  isOpen: boolean;
  onClose: () => void;
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

type ModoFecha = "dia" | "rango";

export default function GestionAsueto({ isOpen, onClose }: GestionAsuetoProps) {
  const [asuetos, setAsuetos] = useState<Asueto[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  // Form state
  const [editando, setEditando] = useState<Asueto | null>(null);
  const [modoFecha, setModoFecha] = useState<ModoFecha>("dia");
  const [formFechaInicio, setFormFechaInicio] = useState("");
  const [formFechaFin, setFormFechaFin] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obtenerAsuetos(anio, mes);
      setAsuetos(data);
    } finally {
      setLoading(false);
    }
  }, [anio, mes]);

  useEffect(() => {
    if (isOpen) cargar();
  }, [isOpen, cargar]);

  const handleNuevo = () => {
    setEditando(null);
    setModoFecha("dia");
    setFormFechaInicio("");
    setFormFechaFin("");
    setFormNombre("");
    setFormDescripcion("");
    setMostrarForm(true);
  };

  const handleEditar = (a: Asueto) => {
    setEditando(a);
    const esRango = a.fecha_inicio !== a.fecha_fin;
    setModoFecha(esRango ? "rango" : "dia");
    setFormFechaInicio(a.fecha_inicio);
    setFormFechaFin(a.fecha_fin);
    setFormNombre(a.nombre);
    setFormDescripcion(a.descripcion || "");
    setMostrarForm(true);
  };

  const handleCancelarForm = () => {
    setMostrarForm(false);
    setEditando(null);
  };

  // Cuando cambia el modo, sincroniza fecha_fin con fecha_inicio si es "dia"
  const handleModoChange = (modo: ModoFecha) => {
    setModoFecha(modo);
    if (modo === "dia" && formFechaInicio) {
      setFormFechaFin(formFechaInicio);
    }
  };

  // Cuando cambia fecha_inicio en modo "dia", sincroniza fecha_fin
  const handleFechaInicioChange = (val: string) => {
    setFormFechaInicio(val);
    if (modoFecha === "dia") setFormFechaFin(val);
  };

  const handleGuardar = async () => {
    if (!formFechaInicio || !formNombre.trim()) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "La fecha y el nombre son requeridos." });
      return;
    }
    const finEfectivo = modoFecha === "dia" ? formFechaInicio : formFechaFin;
    if (!finEfectivo) {
      Swal.fire({ icon: "warning", title: "Datos incompletos", text: "Debe ingresar la fecha final del rango." });
      return;
    }
    if (finEfectivo < formFechaInicio) {
      Swal.fire({ icon: "warning", title: "Fechas inválidas", text: "La fecha fin no puede ser anterior a la fecha inicio." });
      return;
    }

    setGuardando(true);
    const fd = new FormData();
    fd.append("fecha_inicio", formFechaInicio);
    fd.append("fecha_fin", finEfectivo);
    fd.append("nombre", formNombre.trim());
    fd.append("descripcion", formDescripcion);

    try {
      const result = editando
        ? await actualizarAsueto(editando.id, fd)
        : await crearAsueto(fd);

      if (result.ok) {
        setMostrarForm(false);
        setEditando(null);
        await cargar();
        Swal.fire({
          icon: "success",
          title: editando ? "Asueto actualizado" : "Asueto creado",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: result.error || "Ocurrió un error." });
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (a: Asueto) => {
    const label = a.fecha_inicio === a.fecha_fin
      ? format(parseISO(a.fecha_inicio + "T00:00:00"), "d 'de' MMMM yyyy", { locale: es })
      : `${format(parseISO(a.fecha_inicio + "T00:00:00"), "d MMM", { locale: es })} al ${format(parseISO(a.fecha_fin + "T00:00:00"), "d MMM yyyy", { locale: es })}`;

    const result = await Swal.fire({
      title: "¿Eliminar asueto?",
      text: `Se eliminará "${a.nombre}" (${label}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    const res = await eliminarAsueto(a.id);
    if (res.ok) {
      await cargar();
    } else {
      Swal.fire({ icon: "error", title: "Error", text: res.error });
    }
  };

  const aniosDisponibles = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const getDiasRango = (a: Asueto) => {
    if (a.fecha_inicio === a.fecha_fin) return null;
    const d = differenceInCalendarDays(
      parseISO(a.fecha_fin + "T00:00:00"),
      parseISO(a.fecha_inicio + "T00:00:00")
    ) + 1;
    return d;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-neutral-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300">Gestión de Asuetos</h2>
              <span className="text-[10px] bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                Solo RRHH
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filtros mes/año */}
          <div className="flex items-center gap-2 px-5 pt-3 pb-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="text-xs border border-gray-200 dark:border-neutral-700 rounded px-2 py-1 bg-gray-50 dark:bg-neutral-800 dark:text-gray-200 focus:outline-none"
            >
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="text-xs border border-gray-200 dark:border-neutral-700 rounded px-2 py-1 bg-gray-50 dark:bg-neutral-800 dark:text-gray-200 focus:outline-none"
            >
              {aniosDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <div className="flex-1" />
            {!mostrarForm && (
              <Button
                size="sm"
                onClick={handleNuevo}
                className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-white border-0 gap-1"
              >
                <Plus className="w-3 h-3" />
                Nuevo Asueto
              </Button>
            )}
          </div>

          {/* Formulario */}
          <AnimatePresence>
            {mostrarForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-900/10 border-y border-amber-100 dark:border-amber-900/30">
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-3">
                    {editando ? "Editar Asueto" : "Nuevo Asueto"}
                  </p>

                  {/* Selector tipo: Un día / Rango */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleModoChange("dia")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                        modoFecha === "dia"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      Un día
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModoChange("rango")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                        modoFecha === "rango"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                      }`}
                    >
                      <CalendarRange className="w-3 h-3" />
                      Rango de días
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Fechas */}
                    <div className={`flex gap-2 ${modoFecha === "rango" ? "" : ""}`}>
                      <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {modoFecha === "dia" ? "Fecha *" : "Fecha inicio *"}
                        </label>
                        <input
                          type="date"
                          value={formFechaInicio}
                          onChange={(e) => handleFechaInicioChange(e.target.value)}
                          className="text-xs border border-gray-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-white dark:bg-neutral-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      {modoFecha === "rango" && (
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Fecha fin *
                          </label>
                          <input
                            type="date"
                            value={formFechaFin}
                            min={formFechaInicio || undefined}
                            onChange={(e) => setFormFechaFin(e.target.value)}
                            className="text-xs border border-gray-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-white dark:bg-neutral-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preview del rango */}
                    {modoFecha === "rango" && formFechaInicio && formFechaFin && formFechaFin >= formFechaInicio && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/30">
                        {differenceInCalendarDays(parseISO(formFechaFin + "T00:00:00"), parseISO(formFechaInicio + "T00:00:00")) + 1} día(s) —{" "}
                        {format(parseISO(formFechaInicio + "T00:00:00"), "d MMM", { locale: es })} al{" "}
                        {format(parseISO(formFechaFin + "T00:00:00"), "d MMM yyyy", { locale: es })}
                      </div>
                    )}

                    {/* Nombre */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre *</label>
                      <input
                        type="text"
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        placeholder="Ej: Semana Santa, Día Nacional"
                        className="text-xs border border-gray-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-white dark:bg-neutral-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descripción (opcional)</label>
                      <textarea
                        value={formDescripcion}
                        onChange={(e) => setFormDescripcion(e.target.value)}
                        placeholder="Notas adicionales..."
                        rows={2}
                        className="text-xs border border-gray-200 dark:border-neutral-700 rounded px-2 py-1.5 bg-white dark:bg-neutral-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end mt-1">
                      <Button size="sm" variant="ghost" onClick={handleCancelarForm} disabled={guardando} className="h-7 text-[11px]">
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-white border-0 gap-1"
                      >
                        {guardando && <Loader2 className="w-3 h-3 animate-spin" />}
                        {editando ? "Actualizar" : "Guardar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de asuetos */}
          <div className="px-5 py-3 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Cargando...</span>
              </div>
            ) : asuetos.length === 0 ? (
              <div className="text-center py-8">
                <PartyPopper className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No hay asuetos configurados para este mes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {asuetos.map((a) => {
                  const esRango = a.fecha_inicio !== a.fecha_fin;
                  const dias = getDiasRango(a);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30"
                    >
                      {/* Ícono de fecha */}
                      <div className="flex-shrink-0 w-12 bg-amber-400 dark:bg-amber-500 rounded-lg flex flex-col items-center justify-center text-white shadow-sm py-1.5 px-1">
                        {esRango ? (
                          <>
                            <CalendarRange className="w-4 h-4 mb-0.5" />
                            <span className="text-[9px] font-bold">{dias}d</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-bold uppercase leading-none">
                              {format(parseISO(a.fecha_inicio + "T00:00:00"), "MMM", { locale: es })}
                            </span>
                            <span className="text-lg font-extrabold leading-none">
                              {format(parseISO(a.fecha_inicio + "T00:00:00"), "d")}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 truncate">{a.nombre}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 capitalize">
                          {esRango
                            ? `${format(parseISO(a.fecha_inicio + "T00:00:00"), "d MMM", { locale: es })} – ${format(parseISO(a.fecha_fin + "T00:00:00"), "d MMM yyyy", { locale: es })}`
                            : format(parseISO(a.fecha_inicio + "T00:00:00"), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                        </p>
                        {a.descripcion && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{a.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditar(a)}
                          className="p-1.5 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800/40 text-amber-600 dark:text-amber-400 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(a)}
                          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
            <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">
              Cerrar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
