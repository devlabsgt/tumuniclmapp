"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import useUserData from "@/hooks/sesion/useUserData";
import { es } from "date-fns/locale";
import {
  format,
  isSameDay,
  getDay,
  set,
  addMinutes,
  isBefore,
  isAfter,
  parseISO,
} from "date-fns";
import {
  Clock,
  CalendarCheck,
  CalendarDays,
  List,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Calendario from "./Calendario";
import Mapa from "../ui/modals/Mapa";
import Cargando from "@/components/ui/animations/Cargando";
import Swal, { SweetAlertOptions } from "sweetalert2";

import { marcarNuevaAsistencia } from "@/lib/asistencia/acciones";
import useFechaHora from "@/hooks/utility/useFechaHora";
import { useAsistenciaUsuario } from "@/hooks/asistencia/useAsistenciaUsuario";
import { useObtenerUbicacion } from "@/hooks/ubicacion/useObtenerUbicacion";

const formatScheduleTime = (timeString: string | null | undefined) => {
  if (!timeString) return "--";
  try {
    const [hours, minutes] = timeString.split(":");
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${minutes} ${period}`;
  } catch (e) {
    return timeString;
  }
};

const formatScheduleDays = (days: number[] | null | undefined): string => {
  if (!days || days.length === 0) return "Horario no asignado";
  if (
    days.length === 5 &&
    days[0] === 1 &&
    days[1] === 2 &&
    days[2] === 3 &&
    days[3] === 4 &&
    days[4] === 5
  ) {
    return "Lunes a Viernes";
  }
  if (
    days.length === 6 &&
    days[0] === 1 &&
    days[1] === 2 &&
    days[2] === 3 &&
    days[3] === 4 &&
    days[4] === 5 &&
    days[5] === 6
  ) {
    return "Lunes a Sábado";
  }
  const dayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days
    .sort((a, b) => a - b)
    .map((d) => dayNames[d] || "?")
    .join(", ");
};

interface AsistenciaProps {
  onFinalizar?: () => void;
}

export default function Asistencia({ onFinalizar }: AsistenciaProps) {
  const {
    userId,
    nombre,
    cargando: cargandoUsuario,
    horario_nombre,
    horario_dias,
    horario_entrada,
    horario_salida,
  } = useUserData();

  const {
    asistencias: todosLosRegistros,
    loading: cargandoRegistros,
    fetchAsistencias,
  } = useAsistenciaUsuario(userId, null, null);
  const fechaHoraGt = useFechaHora();

  const {
    ubicacion,
    cargando: cargandoGeo,
    obtenerUbicacion,
    error: errorGeo,
  } = useObtenerUbicacion();

  const [cargando, setCargando] = useState(false);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] =
    useState<{ entrada: any | null; salida: any | null; multiple?: any[] }>({
      entrada: null,
      salida: null,
    });
  const [activeTab, setActiveTab] = useState<"controlResumen" | "semanal">(
    "controlResumen",
  );
  const [tipoRegistroPendiente, setTipoRegistroPendiente] = useState<
    "Entrada" | "Salida" | "Marca" | null
  >(null);
  const [notasPendientes, setNotasPendientes] = useState("");

  const {
    estaFueraDeHorario,
    scheduleEntrada,
    scheduleSalida,
    scheduleSalidaTarde,
    horarioFormateado,
    esHorarioMultiple,
    esDiaLaboral,
    puedeMarcarEntrada,
    puedeMarcarSalida,
  } = useMemo(() => {
    const horaEntradaStr = horario_entrada || "08:00:00";
    const horaSalidaStr = horario_salida || "16:00:00";
    const diasLaborales = horario_dias || [1, 2, 3, 4, 5];

    const [hE, mE, sE] = horaEntradaStr.split(":").map(Number);
    const [hS, mS, sS] = horaSalidaStr.split(":").map(Number);

    const scheduleEntrada = set(fechaHoraGt, {
      hours: hE,
      minutes: mE,
      seconds: sE || 0,
      milliseconds: 0,
    });
    const scheduleSalida = set(fechaHoraGt, {
      hours: hS,
      minutes: mS,
      seconds: sS || 0,
      milliseconds: 0,
    });
    const scheduleSalidaTarde = addMinutes(scheduleSalida, 15);

    const puedeMarcarEntrada = isAfter(
      fechaHoraGt,
      addMinutes(scheduleEntrada, -60),
    );
    const puedeMarcarSalida = isAfter(
      fechaHoraGt,
      addMinutes(scheduleSalida, -60),
    );

    const diaDeLaSemana = getDay(fechaHoraGt);
    const esDiaLaboral = diasLaborales.includes(diaDeLaSemana);

    const estaFueraDeHorario =
      !esDiaLaboral ||
      isBefore(fechaHoraGt, scheduleEntrada) ||
      isAfter(fechaHoraGt, scheduleSalida);

    const horarioFormateado = {
      nombre: horario_nombre || "Normal",
      dias: formatScheduleDays(horario_dias),
      entrada: formatScheduleTime(horario_entrada),
      salida: formatScheduleTime(horario_salida),
    };

    const esHorarioMultiple =
      horario_nombre?.trim().toLowerCase() === "multiple";

    return {
      estaFueraDeHorario,
      scheduleEntrada,
      scheduleSalida,
      scheduleSalidaTarde,
      horarioFormateado,
      esHorarioMultiple,
      esDiaLaboral,
      puedeMarcarEntrada,
      puedeMarcarSalida,
    };
  }, [
    fechaHoraGt,
    horario_entrada,
    horario_salida,
    horario_dias,
    horario_nombre,
  ]);

  const registroEntradaHoy = useMemo(() => {
    if (!todosLosRegistros) return null;
    return todosLosRegistros.find(
      (r: any) =>
        isSameDay(parseISO(r.created_at), fechaHoraGt) &&
        r.tipo_registro === "Entrada",
    );
  }, [todosLosRegistros, fechaHoraGt]);

  const registroSalidaHoy = useMemo(() => {
    if (!todosLosRegistros) return null;
    return todosLosRegistros.find(
      (r: any) =>
        isSameDay(parseISO(r.created_at), fechaHoraGt) &&
        r.tipo_registro === "Salida",
    );
  }, [todosLosRegistros, fechaHoraGt]);

  const registrosHoyMultiple = useMemo(() => {
    if (!todosLosRegistros) return [];
    return todosLosRegistros.filter((r: any) =>
      isSameDay(parseISO(r.created_at), fechaHoraGt),
    );
  }, [todosLosRegistros, fechaHoraGt]);

  useEffect(() => {
    if (modalMapaAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalMapaAbierto]);

  useEffect(() => {
    if (ubicacion && tipoRegistroPendiente) {
      handleMarcarAsistencia(tipoRegistroPendiente, ubicacion, notasPendientes);
      setTipoRegistroPendiente(null);
      setNotasPendientes("");
    } else if (errorGeo && tipoRegistroPendiente) {
      Swal.fire("Error de Ubicación", errorGeo, "error");
      setTipoRegistroPendiente(null);
      setNotasPendientes("");
    }
  }, [ubicacion, errorGeo, tipoRegistroPendiente]);

  const handleIniciarMarcado = async (tipo: "Entrada" | "Salida" | "Marca") => {
    let swalConfig: SweetAlertOptions = {
      input: "textarea",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Sí, realizar marca`,
      cancelButtonText: "Cancelar",
    };

    if (tipo === "Marca") {
      swalConfig = {
        ...swalConfig,
        title: "Realizar Marca",
        text: "Por favor especifique el detalle de esta marca.",
        icon: "info",
        inputPlaceholder:
          "Por favor escriba el tipo de Marca que está realizando...",
        confirmButtonText: "Confirmar Marca",
        inputValidator: (value) => {
          if (!value)
            return "¡Debe especificar el tipo de marca que está realizando!";
        },
      };
    } else if (tipo === "Salida") {
      swalConfig.confirmButtonText = "Sí, marcar Salida";
      const esSalidaTemprana = isBefore(fechaHoraGt, scheduleSalida);
      const esSalidaTarde = isAfter(fechaHoraGt, scheduleSalidaTarde);
      if (esSalidaTemprana || esSalidaTarde) {
        const motivo = esSalidaTemprana ? "antes" : "después";
        swalConfig = {
          ...swalConfig,
          title: esSalidaTemprana
            ? "Justificación de Salida Temprana"
            : "Justificación de Salida Tarde",
          text: `Está marcando su salida ${motivo} del horario asignado (${format(scheduleSalida, "h:mm a", { locale: es })}). Por favor, ingrese una justificación obligatoria.`,
          icon: "warning",
          inputPlaceholder: "Escriba su justificación aquí (requerido)...",
          inputValidator: (value) => {
            if (!value) return "¡Necesita justificación!";
          },
        };
      } else {
        swalConfig = {
          ...swalConfig,
          title: "Confirmar Salida",
          text: "¿Desea agregar nota opcional?",
          icon: "question",
          inputPlaceholder: "Notas opcionales...",
        };
      }
    } else {
      swalConfig.confirmButtonText = "Sí, marcar Entrada";
      const scheduleEntradaTarde = addMinutes(scheduleEntrada, 15);
      const esEntradaTarde = isAfter(fechaHoraGt, scheduleEntradaTarde);
      if (esEntradaTarde) {
        swalConfig = {
          ...swalConfig,
          title: "Justificación de Entrada Tarde",
          text: `Está marcando entrada tarde (${format(scheduleEntradaTarde, "h:mm a", { locale: es })}). Justificación obligatoria.`,
          icon: "warning",
          inputPlaceholder: "Escriba su justificación aquí (requerido)...",
          inputValidator: (value) => {
            if (!value) return "¡Necesita justificación!";
          },
        };
      } else {
        swalConfig = {
          ...swalConfig,
          title: "Confirmar Entrada",
          text: "¿Desea agregar nota opcional?",
          icon: "question",
          inputPlaceholder: "Notas opcionales...",
        };
      }
    }

    const { value: notaIngresada, isConfirmed } = await Swal.fire(swalConfig);

    if (isConfirmed) {
      let notasFinales = notaIngresada || "";
      if (tipo !== "Marca") {
        if (tipo === "Salida" && isBefore(fechaHoraGt, scheduleSalida))
          notasFinales = `Salida Temprano: ${notasFinales}`;
        else if (tipo === "Salida" && isAfter(fechaHoraGt, scheduleSalidaTarde))
          notasFinales = `Salida Tarde: ${notasFinales}`;
        else if (
          tipo === "Entrada" &&
          isAfter(fechaHoraGt, addMinutes(scheduleEntrada, 15))
        )
          notasFinales = `Entrada Tarde: ${notasFinales}`;
      }
      setNotasPendientes(notasFinales);
      setTipoRegistroPendiente(tipo);

      obtenerUbicacion();
    }
  };

  const handleMarcarAsistencia = async (
    tipo: string,
    ubicacionActual: { lat: number; lng: number },
    notasDeMarcado: string,
  ) => {
    setCargando(true);
    if (!userId) {
      Swal.fire("Error", "No se encontró el ID de usuario.", "error");
      setCargando(false);
      return;
    }
    const nuevoRegistro = await marcarNuevaAsistencia(
      userId,
      tipo,
      ubicacionActual,
      notasDeMarcado,
    );
    if (nuevoRegistro) {
      await Swal.fire(
        `¡${tipo === "Marca" ? "Marca" : tipo} Exitosa!`,
        `Registrado correctamente.`,
        "success",
      );
      fetchAsistencias();
      if (onFinalizar) {
        onFinalizar();
      }
    }
    setCargando(false);
  };

  const handleAbrirMapa = (registro: any) => {
    if (!registro?.ubicacion) return;
    const fechaRegistro = new Date(registro.created_at);
    const registrosDeEseDia = todosLosRegistros.filter((r: any) =>
      isSameDay(new Date(r.created_at), fechaRegistro),
    );
    setRegistrosSeleccionadosParaMapa({
      entrada:
        registrosDeEseDia.find((r) => r.tipo_registro === "Entrada") || null,
      salida:
        registrosDeEseDia.find((r) => r.tipo_registro === "Salida") || null,
      multiple: esHorarioMultiple ? registrosDeEseDia : undefined,
    });
    setModalMapaAbierto(true);
  };

  const handleAbrirMapaHoy = () => {
    setRegistrosSeleccionadosParaMapa({
      entrada: null,
      salida: null,
      multiple: registrosHoyMultiple,
    });
    setModalMapaAbierto(true);
  };

  const entradaMarcada = !!registroEntradaHoy;
  const salidaMarcada = !!registroSalidaHoy;
  const hayRegistrosHoy = registrosHoyMultiple.length > 0;

  if (cargandoUsuario || cargandoRegistros)
    return <Cargando texto="Asistencia..." />;

  const renderBotonMarcado = () => {
    if (!esHorarioMultiple && !esDiaLaboral) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 rounded-md text-center transition-colors">
          <p className="text-yellow-700 dark:text-yellow-500 font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Hoy no es un día laboral asignado.
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-600 mt-1">
            Solo puede marcar asistencia los días: {horarioFormateado.dias}
          </p>
        </div>
      );
    }

    if (esHorarioMultiple) {
      return (
        <Button
          onClick={() => handleIniciarMarcado("Marca")}
          disabled={cargando || cargandoGeo}
          className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 border-0 text-white"
        >
          {cargandoGeo && <MapPin className="animate-bounce h-4 w-4" />}
          {cargandoGeo
            ? "Obteniendo ubicación..."
            : cargando
              ? "Registrando..."
              : "Marcar"}
        </Button>
      );
    }

    if (!entradaMarcada) {
      return (
        <div className="flex flex-col items-center gap-2 w-full">
          <Button
            onClick={() => handleIniciarMarcado("Entrada")}
            disabled={cargando || cargandoGeo || !puedeMarcarEntrada}
            className={`w-full py-6 text-base flex items-center justify-center gap-2 border-0 text-white transition-all ${
              puedeMarcarEntrada
                ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                : "bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {cargandoGeo && <MapPin className="animate-bounce h-4 w-4" />}
            {cargandoGeo
              ? "Obteniendo ubicación..."
              : cargando
                ? "Marcando..."
                : "Marcar Entrada"}
          </Button>
          {!puedeMarcarEntrada && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Podrá marcar a su hora de entrada: {horarioFormateado.entrada}
            </p>
          )}
        </div>
      );
    } else if (!salidaMarcada) {
      return (
        <div className="flex flex-col items-center gap-2 w-full">
          <Button
            onClick={() => handleIniciarMarcado("Salida")}
            disabled={cargando || cargandoGeo || !puedeMarcarSalida}
            className={`w-full py-6 text-base flex items-center justify-center gap-2 border-0 text-white transition-all ${
              puedeMarcarSalida
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                : "bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {cargandoGeo && <MapPin className="animate-bounce h-4 w-4" />}
            {cargandoGeo
              ? "Obteniendo ubicación..."
              : cargando
                ? "Marcando..."
                : "Marcar Salida"}
          </Button>
          {!puedeMarcarSalida && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Podrá marcar a su hora de salida: {horarioFormateado.salida}
            </p>
          )}
        </div>
      );
    } else {
      return (
        <p className="text-center text-gray-500 dark:text-gray-400 font-semibold p-4 bg-gray-100 dark:bg-neutral-800 rounded-md">
          Jornada completada por hoy
        </p>
      );
    }
  };

  return (
    <>
      <div className="w-full xl:max-w-3xl mx-auto">
        <div className="border-b dark:border-neutral-800 flex mb-4 flex-wrap justify-center transition-colors">
          <button
            onClick={() => setActiveTab("controlResumen")}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${
              activeTab === "controlResumen"
                ? "border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Clock className="h-4 w-4" /> Asistencia
          </button>
          <button
            onClick={() => setActiveTab("semanal")}
            className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm transition-colors ${
              activeTab === "semanal"
                ? "border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <CalendarCheck className="h-4 w-4" /> Registro Semanal
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "controlResumen" ? (
            <motion.div
              key="controlResumen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-8 w-full">
                <div className="p-6 bg-white dark:bg-neutral-900 rounded-lg shadow-md space-y-4 border border-gray-100 dark:border-neutral-800 transition-colors duration-200">
                  <div className="text-center bg-slate-100 dark:bg-neutral-800 p-3 rounded-md transition-colors">
                    <p className="font-semibold text-xs lg:text-sm text-gray-800 dark:text-gray-100">
                      {nombre || "Usuario no identificado"}
                    </p>
                  </div>

                  {!esHorarioMultiple && (
                    <div className="text-center text-xs font-semibold text-blue-600 dark:text-blue-400 flex flex-col lg:flex-row justify-center lg:gap-4 transition-colors">
                      <p className="pb-2">
                        Horario: {horarioFormateado.nombre}
                      </p>
                      <p className="flex items-center justify-center gap-1 pb-2">
                        <Clock className="h-3 w-3" />
                        {horarioFormateado.entrada} a {horarioFormateado.salida}
                      </p>
                      <p className="flex items-center justify-center gap-1 pb-2">
                        <CalendarDays className="h-3 w-3" />
                        {horarioFormateado.dias}
                      </p>
                    </div>
                  )}

                  <div className="text-center border-y dark:border-neutral-800 py-4 transition-colors">
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-300">
                      <span className="capitalize">
                        {format(fechaHoraGt, "EEEE, dd/MM/yyyy", {
                          locale: es,
                        })}
                      </span>
                      <span
                        className={`font-mono font-bold ml-2 ${estaFueraDeHorario && !esHorarioMultiple ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
                      >
                        {format(fechaHoraGt, "hh:mm:ss aa", { locale: es })}
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-center w-full">
                    <div className="w-full">{renderBotonMarcado()}</div>
                  </div>

                  <div className="mt-6 border-t dark:border-neutral-800 pt-4 transition-colors">
                    <h4 className="text-xs lg:text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      Registros de hoy:
                    </h4>
                    {hayRegistrosHoy ? (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Haga clic para ver detalles de ubicación.
                        </p>
                        <div
                          onClick={handleAbrirMapaHoy}
                          className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex justify-center items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold"
                        >
                          <List className="h-4 w-4" />
                          Ver Asistencia de hoy ({registrosHoyMultiple.length})
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-md border border-gray-100 dark:border-neutral-800 text-center">
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          No ha marcado asistencia el día de hoy.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="semanal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Calendario
                todosLosRegistros={todosLosRegistros}
                onAbrirMapa={handleAbrirMapa}
                fechaHoraGt={fechaHoraGt}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalMapaAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Mapa
              isOpen={modalMapaAbierto}
              onClose={() => setModalMapaAbierto(false)}
              registros={registrosSeleccionadosParaMapa}
              nombreUsuario={nombre}
              titulo="Asistencia"
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
