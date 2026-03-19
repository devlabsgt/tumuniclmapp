"use client";

import React, { Fragment, useMemo } from "react";
import { format, parseISO, isSameDay, isSameMonth, differenceInDays, eachDayOfInterval, isWeekend } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronDown,
  Search,
  Building2,
  Plus,
  Trash2,
  CalendarDays,
  Clock,
  FileText,
  User,
  Briefcase,
  Eye,
  Pencil,
} from "lucide-react";
import PreviewPermiso from "./modals/PreviewPermiso";
import { PermisoEmpleado } from "./types";
import { Button } from "@/components/ui/button";
import Cargando from "@/components/ui/animations/Cargando";
import CrearEditarPermiso from "./modals/CrearEditarPermiso";
import { motion, AnimatePresence } from "framer-motion";
import { usePermisos, TipoVistaPermisos } from "./hooks";
import { cn } from "@/lib/utils";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface Props {
  tipoVista: TipoVistaPermisos;
}

export default function VerPermisos({ tipoVista }: Props) {
  const { state, actions } = usePermisos(tipoVista);
  const {
    loadingPermisos,
    searchTerm,
    filtroEstado,
    mesSeleccionado,
    anioSeleccionado,
    modalAbierto,
    permisoParaEditar,
    perfilUsuario,
    oficinasAbiertas,
    datosAgrupados,
    estadisticas,
  } = state;
  const {
    setSearchTerm,
    setFiltroEstado,
    setMesSeleccionado,
    setAnioSeleccionado,
    setModalAbierto,
    toggleOficina,
    cargarDatos,
    handleNuevoPermiso,
    handleClickFila,
    handleEliminarPermiso,
  } = actions;

  const [modalPreviewAbierto, setModalPreviewAbierto] = React.useState(false);
  const [permisoParaImagen, setPermisoParaImagen] = React.useState<PermisoEmpleado | null>(null);

  const handleVerPreview = (e: React.MouseEvent, permiso: PermisoEmpleado) => {
    e.stopPropagation();
    setPermisoParaImagen(permiso);
    setModalPreviewAbierto(true);
  };

  // FILTRO VISUAL
  const gruposConDatos = useMemo(() => {
    return datosAgrupados.filter((grupo) => grupo.permisos.length > 0);
  }, [datosAgrupados]);

  const aniosDisponibles = useMemo(() => {
    const actual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => actual - 2 + i);
  }, []);

  const tituloPagina = useMemo(() => {
    if (tipoVista === "mis_permisos") return "Mis Solicitudes";
    if (tipoVista === "gestion_rrhh")
      return "Administración de Permisos (RRHH)";
    if (tipoVista === "gestion_jefe")
      return "Administración de Permisos (JEFE)";
    return "Permisos";
  }, [tipoVista]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "aprobado":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            Aprobado RRHH
          </span>
        );
      case "aprobado_jefe":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            Preaprobado Jefe
          </span>
        );
      case "rechazado_jefe":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            Rechazado Jefe
          </span>
        );
      case "rechazado_rrhh":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            Rechazado RRHH
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            Pendiente Jefe
          </span>
        );
    }
  };

  const getCategoriaBorderClass = (tipo: string, descripcion: string | null) => {
    const t = tipo.toLowerCase();
    const d = (descripcion || "").toLowerCase();
    const esExtra = t.includes("reposicion") || t.includes("reposición") || t.includes("horas") || t.includes("extra") || 
                   d.includes("reposicion") || d.includes("reposición") || d.includes("horas") || d.includes("extra");
    const esVacas = t.includes("vacaciones") || d.includes("vacaciones");

    if (esVacas) return "border-l-4 border-l-purple-500";
    if (esExtra) return "border-l-4 border-l-slate-500";
    return "border-l-4 border-l-blue-500";
  };

  const getCategoria = (p: PermisoEmpleado) => {
    const t = p.tipo.toLowerCase();
    const d = (p.descripcion || "").toLowerCase();
    if (t.includes("vacaciones") || d.includes("vacaciones")) return "vacaciones";
    if (t.includes("reposicion") || t.includes("reposición") || t.includes("horas") || t.includes("extra") || 
        d.includes("reposicion") || d.includes("reposición") || d.includes("horas") || d.includes("extra")) return "extras";
    return "permisos";
  };

  const getDiasContados = (start: Date, end: Date) => {
    try {
      const allDays = eachDayOfInterval({ start, end });
      return allDays.filter(day => !isWeekend(day)).length;
    } catch (e) {
      return 0;
    }
  };

  const esRRHH = tipoVista === "gestion_rrhh";

  return (
    <>
      <div className="w-full xl:w-4/5 mx-auto md:px-4 pb-10">
        <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md w-full border border-gray-100 dark:border-neutral-800 transition-colors duration-200">
          <div className="flex flex-col gap-4 mb-6 p-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2
                className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate max-w-2xl"
                title={tituloPagina}
              >
                {tituloPagina}
              </h2>

              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded p-1">
                  <CalendarDays className="w-4 h-4 text-gray-500 ml-2" />
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                    className="bg-transparent text-xs font-medium focus:outline-none p-1.5 cursor-pointer dark:text-gray-200 dark:bg-neutral-900"
                  >
                    {MESES.map((mes, index) => (
                      <option key={index} value={index + 1}>
                        {mes}
                      </option>
                    ))}
                  </select>
                  <div className="w-px h-4 bg-gray-300 dark:bg-neutral-700 mx-1"></div>
                  <select
                    value={anioSeleccionado}
                    onChange={(e) =>
                      setAnioSeleccionado(Number(e.target.value))
                    }
                    className="bg-transparent text-xs font-medium focus:outline-none p-1.5 cursor-pointer mr-1 dark:text-gray-200 dark:bg-neutral-900"
                  >
                    {aniosDisponibles.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>

                {tipoVista === "mis_permisos" && (
                  <Button
                    size="sm"
                    onClick={handleNuevoPermiso}
                    className="h-8 text-xs bg-black dark:bg-white text-white dark:text-black hover:opacity-90 ml-2"
                  >
                    <Plus className="w-3 h-3 mr-1.5" /> Nuevo Permiso
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o puesto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {/* 1. Pendientes Jefe (Para todos) */}
                {estadisticas.pendientes > 0 && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setFiltroEstado((prev) =>
                        prev === "pendiente" ? "todos" : "pendiente",
                      )
                    }
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold rounded-md border",
                      filtroEstado === "pendiente"
                        ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-500"
                        : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30",
                    )}
                  >
                    Pendientes Jefe: {estadisticas.pendientes}
                  </Button>
                )}

                {/* 2. Pendientes RRHH (Preaprobado Jefe) */}
                {estadisticas.avalados > 0 && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setFiltroEstado((prev) =>
                        prev === "aprobado_jefe" ? "todos" : "aprobado_jefe",
                      )
                    }
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold rounded-md border",
                      filtroEstado === "aprobado_jefe"
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600"
                        : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30",
                    )}
                  >
                    {esRRHH
                      ? `Pendientes RRHH: ${estadisticas.avalados}`
                      : `Preaprobado Jefe: ${estadisticas.avalados}`}
                  </Button>
                )}

                {/* 3. Aprobados Finales */}
                {estadisticas.aprobados > 0 && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setFiltroEstado((prev) =>
                        prev === "aprobado" ? "todos" : "aprobado",
                      )
                    }
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold rounded-md border",
                      filtroEstado === "aprobado"
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30",
                    )}
                  >
                    Aprobado RRHH: {estadisticas.aprobados}
                  </Button>
                )}

                {/* 4. Rechazados */}
                {estadisticas.rechazados > 0 && (
                  <Button
                    size="sm"
                    onClick={() =>
                      setFiltroEstado((prev) =>
                        prev === "rechazado" ? "todos" : "rechazado",
                      )
                    }
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold rounded-md border",
                      filtroEstado === "rechazado"
                        ? "bg-red-600 text-white border-red-600 hover:bg-red-600"
                        : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30",
                    )}
                  >
                    Rechazados: {estadisticas.rechazados}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-4">
            {loadingPermisos ? (
              <Cargando texto="Cargando permisos..." />
            ) : gruposConDatos.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-8">
                No hay información disponible.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {gruposConDatos.map((grupo) => {
                  const estaAbierta =
                    oficinasAbiertas[grupo.oficina_nombre] || false;
                  return (
                    <div
                      key={grupo.oficina_nombre}
                      className="border border-gray-100 dark:border-neutral-800 rounded-lg overflow-hidden"
                    >
                      <div
                        onClick={() => toggleOficina(grupo.oficina_nombre)}
                        className="bg-slate-50 dark:bg-neutral-800/50 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>
                            {grupo.oficina_nombre}{" "}
                            <span className="text-gray-400 text-xs ml-1 font-normal">
                              ({grupo.permisos.length})
                            </span>
                          </span>
                        </div>
                        <motion.div
                          initial={false}
                          animate={{ rotate: estaAbierta ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </motion.div>
                      </div>
                      <AnimatePresence initial={false}>
                        {estaAbierta && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-neutral-900"
                          >
                            <div className="p-3 flex flex-col gap-4">
                                {Object.values(
                                  grupo.permisos.reduce((acc, p) => {
                                    const uid = p.user_id;
                                    if (!acc[uid])
                                      acc[uid] = {
                                        usuario: p.usuario,
                                        permisos: [],
                                      };
                                    acc[uid].permisos.push(p);
                                    return acc;
                                  }, {} as Record<string, { usuario: any; permisos: PermisoEmpleado[] }>)
                                ).map((usuarioGrupo) => (
                                  <UsuarioGrupoPermisos
                                    key={usuarioGrupo.usuario?.id || Math.random()}
                                    usuarioGrupo={usuarioGrupo}
                                    tipoVista={tipoVista}
                                    handleVerPreview={handleVerPreview}
                                    handleClickFila={handleClickFila}
                                    handleEliminarPermiso={handleEliminarPermiso}
                                    getCategoriaBorderClass={getCategoriaBorderClass}
                                    getCategoria={getCategoria}
                                    getEstadoBadge={getEstadoBadge}
                                    getDiasContados={getDiasContados}
                                  />
                                ))}
                              </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <PreviewPermiso 
        isOpen={modalPreviewAbierto}
        onClose={() => setModalPreviewAbierto(false)}
        permiso={permisoParaImagen}
      />
      <CrearEditarPermiso
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        permisoAEditar={permisoParaEditar}
        onSuccess={cargarDatos}
        perfilUsuario={perfilUsuario}
        tipoVista={tipoVista}
      />
    </>
  );
}

// Subcomponente para cada grupo de usuario con filtro propio
function UsuarioGrupoPermisos({
  usuarioGrupo,
  tipoVista,
  handleVerPreview,
  handleClickFila,
  handleEliminarPermiso,
  getCategoriaBorderClass,
  getCategoria,
  getEstadoBadge,
  getDiasContados,
}: {
  usuarioGrupo: { usuario: any; permisos: PermisoEmpleado[] };
  tipoVista: TipoVistaPermisos;
  handleVerPreview: (e: React.MouseEvent, p: PermisoEmpleado) => void;
  handleClickFila: (p: PermisoEmpleado) => void;
  handleEliminarPermiso: (e: React.MouseEvent, id: string) => void;
  getCategoriaBorderClass: (t: string, d: string | null) => string;
  getCategoria: (p: PermisoEmpleado) => string;
  getEstadoBadge: (e: string) => React.ReactNode;
  getDiasContados: (start: Date, end: Date) => number;
}) {
  const [filtro, setFiltro] = React.useState<"todos" | "extras" | "vacaciones" | "permisos">("todos");

  const stats = React.useMemo(() => {
    return usuarioGrupo.permisos.reduce(
      (acc, p) => {
        const cat = getCategoria(p);
        const d = getDiasContados(parseISO(p.inicio), parseISO(p.fin));
        if (cat === "vacaciones") {
          acc.v++;
          acc.vd += d;
          acc.td += d;
        } else if (cat === "extras") {
          acc.e++;
          // No sumamos días para extras
        } else {
          acc.o++;
          acc.od += d;
          acc.td += d;
        }
        return acc;
      },
      { v: 0, vd: 0, e: 0, ed: 0, o: 0, od: 0, td: 0 }
    );
  }, [usuarioGrupo.permisos, getCategoria, getDiasContados]);

  const permisosFiltrados = React.useMemo(() => {
    if (filtro === "todos") return usuarioGrupo.permisos;
    return usuarioGrupo.permisos.filter((p) => getCategoria(p) === filtro);
  }, [filtro, usuarioGrupo.permisos, getCategoria]);

  return (
    <div className="flex flex-col gap-2">
      {/* Encabezado de Usuario Agrupado con Filtros Interactivos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-2 py-1 bg-slate-100/50 dark:bg-neutral-800/50 rounded-md border border-slate-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 dark:text-gray-200">
              {usuarioGrupo.usuario?.nombre}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-gray-500 flex items-center gap-1">
              <Briefcase className="w-2.5 h-2.5" />
              {usuarioGrupo.usuario?.puesto_nombre || "Sin puesto"}
            </span>
          </div>
        </div>

        <div className="mt-1 md:mt-0 flex items-center gap-1.5 flex-wrap">
          {stats.e > 0 && (
            <button
              onClick={() => setFiltro(filtro === "extras" ? "todos" : "extras")}
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded transition-all border",
                filtro === "extras"
                  ? "bg-slate-600 text-white border-slate-700 scale-105"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200"
              )}
            >
              {stats.e} Ext
            </button>
          )}
          {stats.v > 0 && (
            <button
              onClick={() =>
                setFiltro(filtro === "vacaciones" ? "todos" : "vacaciones")
              }
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded transition-all border",
                filtro === "vacaciones"
                  ? "bg-purple-600 text-white border-purple-700 scale-105"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-200"
              )}
            >
              {stats.v} Vac {stats.vd > 0 && `• ${stats.vd}d`}
            </button>
          )}
          {stats.o > 0 && (
            <button
              onClick={() =>
                setFiltro(filtro === "permisos" ? "todos" : "permisos")
              }
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded transition-all border",
                filtro === "permisos"
                  ? "bg-blue-600 text-white border-blue-700 scale-105"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-200"
              )}
            >
              {stats.o} Perm {stats.od > 0 && `• ${stats.od}d`}
            </button>
          )}
          <button
            onClick={() => setFiltro("todos")}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 transition-all",
              filtro === "todos"
                ? "bg-slate-200 text-slate-800 border-slate-300 dark:bg-neutral-700 dark:text-white"
                : "bg-white text-slate-500 border-slate-100 dark:bg-neutral-900 dark:border-neutral-800 hover:bg-slate-50"
            )}
          >
            Total: {usuarioGrupo.permisos.length} {stats.td > 0 && `• ${stats.td}d`}
          </button>
        </div>
      </div>

      {/* Listado de permisos para este usuario (Filtrado) */}
      <div className="flex flex-col gap-3 pl-2 md:pl-4 border-l-2 border-slate-100 dark:border-neutral-800 ml-3">
        <AnimatePresence mode="popLayout">
          {permisosFiltrados.map((permiso) => {
            const esPendiente = permiso.estado === "pendiente";
            const puedeEliminar =
              tipoVista === "gestion_rrhh" ||
              (tipoVista === "mis_permisos" && esPendiente);
            const puedeEditar = tipoVista === "gestion_rrhh" || esPendiente;
            const fechaInicio = parseISO(permiso.inicio);
            const fechaFin = parseISO(permiso.fin);
            const esMismoDia = isSameDay(fechaInicio, fechaFin);
            const f = "eee d MMM";
            const textoFecha = esMismoDia
              ? format(fechaInicio, f, { locale: es })
              : `Del ${format(fechaInicio, f, { locale: es })} al ${format(fechaFin, f, { locale: es })}`;
            const textoHora = `${format(fechaInicio, "h:mm a", { locale: es })} - ${format(fechaFin, "h:mm a", { locale: es })}`;
            const borderClass = getCategoriaBorderClass(
              permiso.tipo,
              permiso.descripcion
            );

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={permiso.id}
                className={cn(
                  "group relative flex flex-col justify-between bg-white dark:bg-neutral-900 rounded-lg p-3 shadow-sm hover:shadow-md transition-all w-full border border-gray-200 dark:border-neutral-800",
                  borderClass
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-wider",
                      getCategoria(permiso) === "vacaciones"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                        : getCategoria(permiso) === "extras"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    )}
                  >
                    Cód: {permiso.id.substring(0, 6).toUpperCase()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium">
                    {format(parseISO(permiso.created_at), "d MMM", {
                      locale: es,
                    })}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="bg-slate-50 dark:bg-neutral-800/50 p-2 rounded">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize mb-1">
                      {permiso.tipo.replace("_", " ")}
                    </p>
                    <div className="flex flex-col gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-blue-500/70" />
                          <span className="font-medium capitalize">
                            {textoFecha}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>
                            {(() => {
                              const cat = getCategoria(permiso);
                              if (cat === "extras") return null;
                              const d = getDiasContados(fechaInicio, fechaFin);
                              if (d <= 0) return null;
                              return `• ${d}d`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500/70" />
                        <span>{textoHora}</span>
                      </div>
                    </div>
                  </div>
                  {permiso.descripcion && (
                    <div className="p-1.5 rounded bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20">
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 italic line-clamp-2">
                        {permiso.descripcion}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getEstadoBadge(permiso.estado)}
                    {permiso.estado === "aprobado" && permiso.remunerado !== null && (
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center",
                          permiso.remunerado
                            ? "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800"
                            : "text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-neutral-800 dark:border-neutral-700"
                        )}
                      >
                        {permiso.remunerado ? "REMUNERADO" : "NO REM"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleVerPreview(e, permiso)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors border border-blue-100 dark:border-blue-800"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>

                    {puedeEditar && (
                      <button
                        onClick={() => handleClickFila(permiso)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md transition-colors border border-amber-100 dark:border-amber-800"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}

                    {puedeEliminar && (
                      <button
                        onClick={(e) => handleEliminarPermiso(e, permiso.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ml-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
