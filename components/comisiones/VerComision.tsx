"use client";

import React, { useMemo, useRef, useState } from "react";
import { parseISO } from "date-fns";
import { formatFechaHoraComision, formatHoraComisionDesdeIso } from "@/lib/comisiones/formatoFecha";
import { ComisionConFechaYHoraSeparada } from "@/hooks/comisiones/useObtenerComisiones";
import { Usuario } from "@/lib/usuarios/esquemas";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Calendar,
  Users,
  User,
  FileText,
  Camera,
  Pencil,
  Trash2,
  CheckSquare,
  Download,
  MapPin,
} from "lucide-react";
import { useRegistrosDeComision } from "@/hooks/comisiones/useRegistrosDeComision";
import Cargando from "@/components/ui/animations/Cargando";
import { toBlob } from "html-to-image";
import Swal from "sweetalert2";
import useUserData from "@/hooks/sesion/useUserData";
import PreviewComision from "./modals/PreviewComision";

const RegistroAsistenciaItem = ({
  asistenteId,
  registros,
  nombre,
  onAbrirMapa,
  mostrarIconoTarjeta,
  onPreviewCard,
  integrado = false,
}: any) => {
  const registrosDelAsistente = useMemo(() => {
    const registroEntrada =
      registros.find(
        (r: any) => r.user_id === asistenteId && r.tipo_registro === "Entrada",
      ) || null;
    const registroSalida =
      registros.find(
        (r: any) => r.user_id === asistenteId && r.tipo_registro === "Salida",
      ) || null;
    return { entrada: registroEntrada, salida: registroSalida };
  }, [registros, asistenteId]);

  const duracionComision = useMemo(() => {
    const { entrada, salida } = registrosDelAsistente;
    if (!entrada || !salida) return null;
    const diff =
      new Date(salida.created_at).getTime() -
      new Date(entrada.created_at).getTime();
    if (diff < 0) return null;
    let minutos = Math.floor(diff / 60000);
    let horas = Math.floor(minutos / 60);
    minutos = minutos % 60;
    const parts = [];
    if (horas > 0) parts.push(`${horas}h`);
    if (minutos > 0) parts.push(`${minutos}m`);
    return parts.join(" ") || "0m";
  }, [registrosDelAsistente]);

  const formatTime = (dateString: string | undefined) =>
    formatHoraComisionDesdeIso(dateString);

  const { entrada, salida } = registrosDelAsistente;
  const tieneRegistros = entrada || salida;

  return (
    <div className="mt-2">
      <div className="py-3 bg-slate-100 dark:bg-neutral-900 max-md:rounded-none md:rounded-md transition-colors duration-200">
        <div className={`${integrado ? 'px-3 md:px-4' : 'px-1 md:px-4'} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-4`}>
        <p className="text-gray-900 dark:text-gray-100 font-medium text-sm md:text-base">
          {nombre}
        </p>

        {tieneRegistros ? (
          <div className="flex items-center justify-between sm:justify-end gap-x-6 gap-y-2 flex-grow sm:flex-grow-0">
            <div className="grid grid-cols-3 gap-x-4 sm:flex sm:items-center sm:gap-x-6 text-[11px] md:text-xs text-gray-700 dark:text-gray-300">
              {/* Entrada */}
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-x-1">
                <span className="font-semibold font-mono text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Entrada:</span>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono">{formatTime(entrada?.created_at)}</span>
              </div>
              {/* Salida */}
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-x-1">
                <span className="font-semibold font-mono text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Salida:</span>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono">{formatTime(salida?.created_at)}</span>
              </div>
              {/* Duración */}
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-x-1 text-blue-600 dark:text-blue-400">
                <span className="font-semibold font-mono text-xs sm:text-sm">Duración:</span>
                <span className="text-xs sm:text-sm font-mono">{duracionComision || "---"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAbrirMapa(registrosDelAsistente, nombre)}
                className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-all shadow-sm flex items-center justify-center"
                title="Ver Ubicación"
              >
                <MapPin className="h-5 w-5" />
              </button>
              {mostrarIconoTarjeta && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewCard(asistenteId, nombre);
                  }}
                  className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-all shadow-sm flex items-center justify-center"
                  title="Descargar Constancia"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-x-4 flex-grow sm:flex-grow-0">
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
              Sin registros de asistencia
            </p>
            {mostrarIconoTarjeta && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewCard(asistenteId, nombre);
                }}
                className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-all shadow-sm flex items-center justify-center"
                title="Descargar Constancia"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

interface VerComisionDetalleProps {
  comision: ComisionConFechaYHoraSeparada;
  usuarios: Usuario[];
  onClose: () => void;
  onAbrirMapa: (registros: any, nombre: string) => void;
  onEdit: (comision: ComisionConFechaYHoraSeparada) => void;
  onDelete: (comisionId: string) => void;
  onAprobar: (comisionId: string) => void;
  integrado?: boolean;
}

const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find((u) => u.id === id);
  return user ? user.nombre : "Desconocido";
};

export default function VerComision({
  comision,
  usuarios,
  onClose,
  onAbrirMapa,
  onEdit,
  onDelete,
  onAprobar,
  integrado = false,
}: VerComisionDetalleProps) {
  const { userId, nombre: userNombre, rol, esjefe } = useUserData();
  const { registros, loading: cargandoRegistros } = useRegistrosDeComision(
    comision.id,
  );
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUser, setPreviewUser] = useState<{ id: string; nombre: string } | null>(null);

  const esSuper = rol === "SUPER";
  const esAdmin = rol === "SUPER" || rol === "RRHH" || rol === "SECRETARIO";

  const puedeVerTodas = esAdmin || esjefe;

  const fechaCompleta = parseISO(comision.fecha_hora.replace(" ", "T"));

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaComisionDate = new Date(fechaCompleta);
  fechaComisionDate.setHours(0, 0, 0, 0);

  const comisionYaPaso = fechaComisionDate < hoy;

  const puedeEditarNormal = esAdmin || esjefe;
  const puedeEliminarNormal = esAdmin;
  const canAprobar = esAdmin;

  const hasPermissionEditar = esSuper || (!comisionYaPaso && puedeEditarNormal);
  const hasPermissionEliminar =
    esSuper || (!comisionYaPaso && puedeEliminarNormal);

  const fechaHoraAbreviada = formatFechaHoraComision(fechaCompleta);

  const encargado = comision.asistentes?.find((a) => a.encargado);
  const asistentes = comision.asistentes
    ?.filter((a) => !a.encargado)
    .sort((a, b) => {
      const nombreA = getUsuarioNombre(a.id, usuarios);
      const nombreB = getUsuarioNombre(b.id, usuarios);
      return nombreA.localeCompare(nombreB);
    });

  const handleExportarComoImagen = async () => {
    if (!exportRef.current) return;

    const logoElement = document.getElementById("export-logo");
    if (!logoElement) return;

    setIsExporting(true);
    logoElement.style.opacity = "1";
    logoElement.style.pointerEvents = "auto";

    try {
      const filter = (node: HTMLElement) => {
        return !node.classList?.contains("exclude-from-capture");
      };

      const isDark = document.documentElement.classList.contains("dark");
      const bgColor = isDark ? "#0a0a0a" : "#ffffff";

      const blob = await toBlob(exportRef.current, {
        cacheBust: true,
        backgroundColor: bgColor,
        filter: filter,
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error al exportar la imagen:", error);
      Swal.fire("Error", "No se pudo generar la imagen.", "error");
    } finally {
      logoElement.style.opacity = "0";
      logoElement.style.pointerEvents = "none";
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={exportRef}
      className={`bg-white dark:bg-neutral-950 rounded-xl pb-6 flex flex-col h-full relative transition-colors duration-200 ${integrado ? 'max-md:px-0 px-6' : 'px-6'}`}
    >
      <div className="pt-0 exclude-from-capture">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 mt-2 text-xs md:text-sm">
          <Button
              variant="link"
              onClick={onClose}
              className="text-blue-600 dark:text-blue-400"
            >
              <LogOut className="mr-2 h-4 w-4 rotate-180" />
              Volver
            </Button>

            <div className="flex items-center gap-4">
              {canAprobar && !comision.aprobado && (
                <Button
                  variant="link"
                  onClick={() => onAprobar(comision.id)}
                  className="text-blue-600 dark:text-blue-400 gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Aprobar
                </Button>
              )}

              {hasPermissionEditar && (
                <Button
                  variant="link"
                  onClick={() => onEdit(comision)}
                  className="text-green-600 dark:text-green-400 gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}

              {hasPermissionEliminar && (
                <Button
                  variant="link"
                  onClick={() => onDelete(comision.id)}
                  className="text-red-600 dark:text-red-400 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>

            <Button
              variant="link"
              onClick={handleExportarComoImagen}
              disabled={isExporting}
              className="hidden xl:inline-flex text-blue-600 dark:text-blue-400 gap-2"
            >
              <Camera className="h-4 w-4" />
              {isExporting ? "Capturando..." : "Imagen"}
            </Button>
          </div>
        </div>

        <div className={`flex justify-between items-start mt-5 ${integrado ? 'max-md:px-4' : ''}`}>
          <h2 className={`text-sm font-bold text-gray-800 dark:text-gray-100 ${integrado ? 'md:pl-5' : 'pl-5'}`}>
            {comision.titulo}
          </h2>
        </div>

        <div className="flex-grow text-gray-700 dark:text-gray-300">
          <div className={`flex items-center gap-3 my-4 ${integrado ? 'max-md:px-4' : ''}`}>
            <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />{" "}
              Fecha y Hora:
            </h3>
            <span className="text-xs md:text-sm">
              {fechaHoraAbreviada}
            </span>
          </div>

          <div className="border-t border-gray-200 dark:border-neutral-800">
            <h3 className={`text-xs md:text-sm font-semibold flex items-center gap-2 mt-2 ${integrado ? 'max-md:px-4' : ''}`}>
              <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />{" "}
              Encargado
            </h3>
            {cargandoRegistros ? (
              <Cargando />
            ) : encargado ? (
              <RegistroAsistenciaItem
                asistenteId={encargado.id}
                registros={registros}
                nombre={getUsuarioNombre(encargado.id, usuarios)}
                onAbrirMapa={onAbrirMapa}
                mostrarIconoTarjeta={puedeVerTodas || encargado.id === userId}
                onPreviewCard={(id: string, nombre: string) => setPreviewUser({ id, nombre })}
                integrado={integrado}
              />
            ) : (
              <p className={`text-gray-500 dark:text-gray-400 my-4 ${integrado ? 'max-md:px-4 pl-4 md:pl-8' : 'pl-8'}`}>
                No asignado
              </p>
            )}
          </div>

          {asistentes && asistentes.length > 0 && (
            <div className="border-t border-gray-200 dark:border-neutral-800 mt-4">
              <h3 className={`text-xs md:text-sm font-semibold flex items-center gap-2 mt-2 ${integrado ? 'max-md:px-4' : ''}`}>
                <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />{" "}
                Integrantes
              </h3>
              {cargandoRegistros ? (
                <Cargando />
              ) : (
                asistentes.map((asistente) => (
                  <RegistroAsistenciaItem
                    key={asistente.id}
                    asistenteId={asistente.id}
                    registros={registros}
                    nombre={getUsuarioNombre(asistente.id, usuarios)}
                    onAbrirMapa={onAbrirMapa}
                    mostrarIconoTarjeta={puedeVerTodas || asistente.id === userId}
                    onPreviewCard={(id: string, nombre: string) => setPreviewUser({ id, nombre })}
                    integrado={integrado}
                  />
                ))
              )}
            </div>
          )}

          {comision.comentarios && comision.comentarios.length > 0 && (
            <div className={`border-t border-gray-200 dark:border-neutral-800 mt-4 ${integrado ? 'max-md:px-4' : ''}`}>
              <h3 className="text-xs md:text-sm font-semibold flex items-center gap-2 my-2">
                <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />{" "}
                Notas
              </h3>
              <ul className="list-disc list-inside my-4">
                {comision.comentarios.map((comentario, index) => (
                  <li
                    key={index}
                    className="text-gray-800 dark:text-gray-200 text-xs md:text-sm my-1"
                  >
                    {comentario}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <img
          id="export-logo"
          src="/images/logo-muni.png"
          alt="Logo Municipalidad"
          className="absolute top-0 right-6 w-48 h-auto"
          style={{ opacity: 0, pointerEvents: "none" }}
        />

        {previewUser && (
          <PreviewComision
            comision={comision}
            registros={registros}
            userId={previewUser.id}
            userNombre={previewUser.nombre}
            isOpen={!!previewUser}
            onClose={() => setPreviewUser(null)}
            usuarios={usuarios}
          />
        )}
      </div>
    );
}
