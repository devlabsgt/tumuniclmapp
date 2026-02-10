"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Save,
  Loader2,
  Check,
  ChevronsUpDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermisoEmpleado } from "../types";
import { guardarPermiso, PerfilUsuario, gestionarPermiso } from "../acciones";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TipoVistaPermisos } from "@/components/permisos/hooks";

const TIPOS_GENERAL = [
  "Vacaciones",
  "Asuntos Personales",
  "Situaciones Administrativas",
  "Situaciones Académicas",
  "Licencias no remuneradas",
  "Sindicales",
  "Citaciones",
  "Calamidad Doméstica",
  "Otros",
];
const TIPOS_SEGURIDAD_SOCIAL = [
  "Consultas Médicas y/o Odontológicas",
  "Exámenes Médicos y/o Odontológicos",
  "Enfermedad Común",
  "Consulta IGSS",
  "Accidente de trabajo",
  "Enfermedad Profesional",
  "Licencias de Maternidad / Paternidad",
  "Incapacidad",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  permisoAEditar?: PermisoEmpleado | null;
  onSuccess: () => void;
  perfilUsuario: PerfilUsuario | null;
  tipoVista: TipoVistaPermisos;
}

export default function CrearEditarPermiso({
  isOpen,
  onClose,
  permisoAEditar,
  onSuccess,
  perfilUsuario,
  tipoVista,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [openComboboxTipo, setOpenComboboxTipo] = useState(false);
  const [otroTipoManual, setOtroTipoManual] = useState<string>("");
  const [esRemunerado, setEsRemunerado] = useState(false);
  const [descripcion, setDescripcion] = useState("");

  const esRRHH = ["RRHH", "SUPER", "SECRETARIO"].includes(
    perfilUsuario?.rol || "",
  );
  // RRHH ve el check en su vista de gestión
  const mostrarOpcionRemunerado = esRRHH && tipoVista === "gestion_rrhh";

  const estadoActual = permisoAEditar?.estado || "";
  const contieneBloqueo =
    estadoActual.includes("aprobado") || estadoActual.includes("rechazado");

  // Lógica de fases
  const esFaseJefe = permisoAEditar?.estado === "pendiente";
  const esFaseRRHH = permisoAEditar?.estado === "aprobado_jefe";

  // Puede aprobar si es fase jefe (y es jefe o RRHH) O si es fase RRHH (y es RRHH)
  const puedeGestionar =
    (tipoVista === "gestion_jefe" && esFaseJefe) ||
    (tipoVista === "gestion_rrhh" && (esFaseJefe || esFaseRRHH));

  // CORRECCIÓN 1: RRHH puede editar siempre, excepto cuando está en la pantalla de "Gestionar" (botones de aprobar/rechazar)
  // Si estoy gestionando, es solo lectura visual. Si NO estoy gestionando (ej. editando uno viejo), RRHH puede escribir.
  const esSoloLectura =
    puedeGestionar || // Si tengo los botones de Aprobar/Rechazar, bloqueo inputs para evitar confusión
    (!!permisoAEditar && !esRRHH && !puedeGestionar) || // Empleado normal no edita lo enviado
    (contieneBloqueo && !esRRHH); // Si está finalizado, solo RRHH puede tocar

  const nombreEmpleado =
    permisoAEditar?.usuario?.nombre || perfilUsuario?.nombre || "";
  const userId = permisoAEditar?.user_id || perfilUsuario?.id || "";

  useEffect(() => {
    if (isOpen) {
      if (permisoAEditar) {
        setEsRemunerado(permisoAEditar.remunerado || false);
        setDescripcion(permisoAEditar.descripcion || "");
        const tipo = [...TIPOS_GENERAL, ...TIPOS_SEGURIDAD_SOCIAL].find(
          (t) => t.toLowerCase() === permisoAEditar.tipo.toLowerCase(),
        );
        if (tipo) {
          setSelectedTipo(tipo);
          setOtroTipoManual("");
        } else {
          setSelectedTipo("Otros");
          setOtroTipoManual(permisoAEditar.tipo);
        }
      } else {
        setSelectedTipo("");
        setOtroTipoManual("");
        setEsRemunerado(false);
        setDescripcion("");
      }
    }
  }, [isOpen, permisoAEditar]);

  if (!isOpen) return null;

  const handleGestion = async (accion: "aprobar" | "rechazar") => {
    if (!permisoAEditar) return;
    setLoading(true);
    try {
      // Si RRHH aprueba, nos aseguramos de mandar el estado del check remunerado
      if (esFaseRRHH && accion === "aprobar") {
        const formData = new FormData();
        formData.set("remunerado", esRemunerado ? "on" : "off");
        // Nota: guardarPermiso aquí solo actualizaría el campo remunerado si se manda solo eso,
        // pero tu server action espera todo el objeto.
        // Mejor confiamos en que gestionarPermiso maneje el estado, y si necesitas guardar remunerado,
        // deberías llamarlo antes o asegurarte que gestionarPermiso no lo sobreescriba.
        // Para simplificar: Guardamos el remunerado primero.

        // HACK: Llamamos a guardarPermiso con los datos actuales para actualizar el remunerado antes de cambiar estado
        const formUpdate = new FormData();
        formUpdate.set("user_id", permisoAEditar.user_id);
        formUpdate.set("tipo", permisoAEditar.tipo);
        formUpdate.set("inicio", permisoAEditar.inicio);
        formUpdate.set("fin", permisoAEditar.fin);
        formUpdate.set("descripcion", permisoAEditar.descripcion || "");
        formUpdate.set("remunerado", esRemunerado ? "on" : "off");
        formUpdate.set("estado", permisoAEditar.estado); // Mantenemos estado

        await guardarPermiso(formUpdate, permisoAEditar.id);
      }

      await gestionarPermiso(permisoAEditar.id, accion, permisoAEditar.user_id);
      toast.success(
        accion === "aprobar" ? "Solicitud Procesada" : "Solicitud Rechazada",
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // CORRECCIÓN 2: RRHH puede guardar aunque contenga bloqueo
    if (contieneBloqueo && !esRRHH) return;

    if (!selectedTipo) return toast.error("Selecciona un tipo.");
    if (selectedTipo === "Otros" && !otroTipoManual.trim())
      return toast.error("Especifique el tipo.");

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("user_id", userId);
    formData.set(
      "tipo",
      selectedTipo === "Otros" ? otroTipoManual : selectedTipo,
    );
    formData.set("descripcion", descripcion);

    const inicio = formData.get("inicio") as string;
    const fin = formData.get("fin") as string;
    if (inicio) formData.set("inicio", new Date(inicio).toISOString());
    if (fin) formData.set("fin", new Date(fin).toISOString());

    // Aseguramos enviar el estado correcto
    if (esRRHH) {
      formData.set("remunerado", esRemunerado ? "on" : "off");
    } else {
      formData.delete("remunerado");
    }

    if (permisoAEditar?.estado) {
      formData.set("estado", permisoAEditar.estado);
    }

    try {
      await guardarPermiso(formData, permisoAEditar?.id);
      toast.success(permisoAEditar ? "Actualizado" : "Creado");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const defaultInicio = permisoAEditar?.inicio
    ? format(new Date(permisoAEditar.inicio), "yyyy-MM-dd'T'HH:mm")
    : `${todayStr}T08:00`;
  const defaultFin = permisoAEditar?.fin
    ? format(new Date(permisoAEditar.fin), "yyyy-MM-dd'T'HH:mm")
    : `${todayStr}T16:00`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {puedeGestionar
              ? "Gestionar Solicitud"
              : permisoAEditar
                ? "Detalles / Editar"
                : "Nueva Solicitud"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 flex flex-col gap-4 overflow-y-auto"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Empleado
            </label>
            <input
              type="text"
              readOnly
              value={nombreEmpleado}
              className="p-2 text-sm rounded-md border border-gray-300 bg-gray-100 dark:bg-neutral-900 dark:border-neutral-800 text-gray-500 dark:text-gray-400 w-full outline-none cursor-default"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tipo
            </label>
            {esSoloLectura ? (
              <input
                type="text"
                readOnly
                value={selectedTipo === "Otros" ? otroTipoManual : selectedTipo}
                className="p-2 text-sm rounded-md border border-gray-300 bg-gray-100 dark:bg-neutral-900 dark:border-neutral-800 text-gray-500 dark:text-gray-400 w-full outline-none"
              />
            ) : (
              <>
                <Popover
                  open={openComboboxTipo}
                  onOpenChange={setOpenComboboxTipo}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal text-sm border-gray-300 dark:bg-neutral-950 dark:border-neutral-800 dark:text-gray-200"
                    >
                      {selectedTipo || "Seleccionar tipo..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CommandInput placeholder="Buscar tipo..." />
                      <CommandList>
                        <div className="max-h-60 overflow-y-auto">
                          <CommandGroup heading="General">
                            {TIPOS_GENERAL.map((t) => (
                              <CommandItem
                                key={t}
                                value={t}
                                onSelect={(val) => {
                                  const orig =
                                    TIPOS_GENERAL.find(
                                      (x) =>
                                        x.toLowerCase() === val.toLowerCase(),
                                    ) || val;
                                  setSelectedTipo(orig);
                                  setOpenComboboxTipo(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTipo === t
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />{" "}
                                {t}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <CommandSeparator />
                          <CommandGroup heading="Seguridad Social">
                            {TIPOS_SEGURIDAD_SOCIAL.map((t) => (
                              <CommandItem
                                key={t}
                                value={t}
                                onSelect={(val) => {
                                  const orig =
                                    TIPOS_SEGURIDAD_SOCIAL.find(
                                      (x) =>
                                        x.toLowerCase() === val.toLowerCase(),
                                    ) || val;
                                  setSelectedTipo(orig);
                                  setOpenComboboxTipo(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTipo === t
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />{" "}
                                {t}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </div>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedTipo === "Otros" && (
                  <input
                    type="text"
                    placeholder="Especifique..."
                    value={otroTipoManual}
                    onChange={(e) => setOtroTipoManual(e.target.value)}
                    className="mt-1 p-2 text-sm rounded-md border border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-200 w-full"
                  />
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Inicio
              </label>
              <input
                type="datetime-local"
                name="inicio"
                readOnly={esSoloLectura}
                defaultValue={defaultInicio}
                className={cn(
                  "p-2 text-sm rounded-md border outline-none w-full",
                  esSoloLectura
                    ? "border-gray-300 bg-gray-100 text-gray-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400"
                    : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 dark:text-gray-200 focus:ring-1 focus:ring-blue-500",
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Fin
              </label>
              <input
                type="datetime-local"
                name="fin"
                readOnly={esSoloLectura}
                defaultValue={defaultFin}
                className={cn(
                  "p-2 text-sm rounded-md border outline-none w-full",
                  esSoloLectura
                    ? "border-gray-300 bg-gray-100 text-gray-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400"
                    : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 dark:text-gray-200 focus:ring-1 focus:ring-blue-500",
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Descripción{" "}
              <span className="text-gray-400 font-normal italic">
                (Opcional)
              </span>
            </label>
            <textarea
              name="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              readOnly={esSoloLectura}
              placeholder="Añadir detalles adicionales..."
              className={cn(
                "p-2 text-sm rounded-md border outline-none w-full min-h-[80px] resize-none",
                esSoloLectura
                  ? "border-gray-300 bg-gray-100 text-gray-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400 cursor-default"
                  : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 dark:text-gray-200 focus:ring-1 focus:ring-blue-500",
              )}
            />
          </div>

          {mostrarOpcionRemunerado && (
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="remunerado"
                name="remunerado"
                checked={esRemunerado}
                onChange={(e) => setEsRemunerado(e.target.checked)}
                disabled={loading} // CORRECCIÓN 3: Desbloqueado para RRHH siempre
                className="h-4 w-4 border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 cursor-pointer"
              />
              <label
                htmlFor="remunerado"
                className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Remunerado
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
            {puedeGestionar ? (
              <>
                <Button
                  type="button"
                  onClick={() => handleGestion("rechazar")}
                  className="bg-red-600 hover:bg-red-700 text-white h-10 px-4"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}{" "}
                  Rechazar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleGestion("aprobar")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {esFaseJefe ? "Aprobar como jefe" : "Aprobar como RRHH"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-10 dark:bg-transparent dark:border-neutral-700 dark:text-gray-300"
                >
                  Cerrar
                </Button>
                {/* CORRECCIÓN 4: Botón Guardar visible si no es solo lectura O si es RRHH (incluso si está bloqueado) */}
                {(!esSoloLectura || (esRRHH && contieneBloqueo)) && (
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-10"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {contieneBloqueo ? "Actualizar Datos" : "Guardar"}
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
