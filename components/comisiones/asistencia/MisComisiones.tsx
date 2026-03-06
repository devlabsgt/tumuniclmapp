"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  getMonth,
  getYear,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { motion, AnimatePresence } from "framer-motion";

import { useObtenerComisiones } from "@/hooks/comisiones/useObtenerComisiones";
import useUserData from "@/hooks/sesion/useUserData";
import Cargando from "@/components/ui/animations/Cargando";
import Mapa from "@/components/ui/modals/Mapa";
import ListaMisComisiones from "./ListaMisComisiones";

const TIMEZONE_GUATE = "America/Guatemala";

export default function MisComisiones() {
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [openComisionId, setOpenComisionId] = useState<string | null>(null);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<any>(null);
  const [nombreUsuarioParaMapa, setNombreUsuarioParaMapa] = useState("");
  const [vista, setVista] = useState<"hoy" | "proximas" | "terminadas">("hoy");

  const { userId, nombre, cargando: cargandoUsuario } = useUserData();

  const hookUserId = cargandoUsuario ? null : userId || null;
  const { comisiones, loading, error, refetch } = useObtenerComisiones(
    mesSeleccionado,
    anioSeleccionado,
    hookUserId,
  );

  useEffect(() => {
    const html = document.documentElement;
    if (modalMapaAbierto) {
      html.classList.add("overflow-hidden");
    } else {
      html.classList.remove("overflow-hidden");
    }
    return () => {
      html.classList.remove("overflow-hidden");
    };
  }, [modalMapaAbierto]);

  useEffect(() => {
    setOpenComisionId(null);
  }, [vista]);

  const comisionesData = useMemo(() => {
    if (cargandoUsuario || !comisiones) {
      return { lista: [], countProximas: 0, countTerminadas: 0, countHoy: 0 };
    }

    const nowInGuate = toZonedTime(new Date(), TIMEZONE_GUATE);

    let countProximas = 0;
    let countTerminadas = 0;
    let countHoy = 0;

    const aprobadasYSorteadas = comisiones
      .filter((c) => c.aprobado === true)
      .sort(
        (a, b) =>
          parseISO(a.fecha_hora.replace(" ", "T")).getTime() -
          parseISO(b.fecha_hora.replace(" ", "T")).getTime(),
      );

    aprobadasYSorteadas.forEach((c) => {
      const fechaComisionObj = parseISO(c.fecha_hora.replace(" ", "T"));
      const diffDias = differenceInCalendarDays(
        toZonedTime(fechaComisionObj, TIMEZONE_GUATE),
        nowInGuate,
      );

      if (diffDias === 0) {
        countHoy++;
      } else if (diffDias > 0) {
        countProximas++;
      } else {
        countTerminadas++;
      }
    });

    return {
      lista: aprobadasYSorteadas,
      countProximas,
      countTerminadas,
      countHoy,
    };
  }, [comisiones, cargandoUsuario]);

  useEffect(() => {
    const vistaActualVacia =
      (vista === "hoy" && comisionesData.countHoy === 0) ||
      (vista === "proximas" && comisionesData.countProximas === 0) ||
      (vista === "terminadas" && comisionesData.countTerminadas === 0);

    if (vistaActualVacia) {
      if (comisionesData.countHoy > 0) {
        setVista("hoy");
      } else if (comisionesData.countProximas > 0) {
        setVista("proximas");
      } else if (comisionesData.countTerminadas > 0) {
        setVista("terminadas");
      } else {
        setVista("hoy");
      }
    }
  }, [comisionesData, vista]);

  const comisionesParaMostrar = useMemo(() => {
    const nowInGuate = toZonedTime(new Date(), TIMEZONE_GUATE);

    let comisionesFiltradas = [];

    if (vista === "hoy") {
      comisionesFiltradas = comisionesData.lista.filter((c) => {
        const fecha = parseISO(c.fecha_hora.replace(" ", "T"));
        return (
          differenceInCalendarDays(
            toZonedTime(fecha, TIMEZONE_GUATE),
            nowInGuate,
          ) === 0
        );
      });
    } else if (vista === "proximas") {
      comisionesFiltradas = comisionesData.lista.filter((c) => {
        const fecha = parseISO(c.fecha_hora.replace(" ", "T"));
        return (
          differenceInCalendarDays(
            toZonedTime(fecha, TIMEZONE_GUATE),
            nowInGuate,
          ) > 0
        );
      });
    } else {
      comisionesFiltradas = comisionesData.lista.filter((c) => {
        const fecha = parseISO(c.fecha_hora.replace(" ", "T"));
        return (
          differenceInCalendarDays(
            toZonedTime(fecha, TIMEZONE_GUATE),
            nowInGuate,
          ) < 0
        );
      });
    }

    if (openComisionId) {
      return comisionesFiltradas.filter((c) => c.id === openComisionId);
    }

    return comisionesFiltradas;
  }, [comisionesData, openComisionId, vista]);

  const handleToggleComision = (comisionId: string) => {
    setOpenComisionId((prevId) => (prevId === comisionId ? null : comisionId));
  };

  const handleAbrirMapa = (registros: any, nombreUsuario: string) => {
    setRegistrosParaMapa(registros);
    setNombreUsuarioParaMapa(nombreUsuario);
    setModalMapaAbierto(true);
  };

  const handleCerrarMapa = () => {
    setModalMapaAbierto(false);
    setRegistrosParaMapa(null);
    setNombreUsuarioParaMapa("");
  };

  const handleAsistenciaMarcada = () => {
    refetch();
  };

  if (loading || cargandoUsuario) {
    return <Cargando texto="Cargando sus comisiones..." />;
  }

  if (!userId) {
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-8">
        Error: No se pudo cargar su información de usuario.
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 dark:text-red-400 py-8">
        Error: {error}
      </p>
    );
  }

  const listaComisionesContenido = (
    <div className="bg-white dark:bg-neutral-950 rounded-lg w-full mx-auto transition-colors duration-200">
      <ListaMisComisiones
        vista={vista}
        setVista={setVista}
        mesSeleccionado={mesSeleccionado}
        setMesSeleccionado={setMesSeleccionado}
        anioSeleccionado={anioSeleccionado}
        setAnioSeleccionado={setAnioSeleccionado}
        comisionesParaMostrar={comisionesParaMostrar}
        openComisionId={openComisionId}
        onToggleComision={handleToggleComision}
        onAbrirMapa={handleAbrirMapa}
        onAsistenciaMarcada={handleAsistenciaMarcada}
        userId={userId}
        nombreUsuario={nombre!}
        countHoy={comisionesData.countHoy}
        countProximas={comisionesData.countProximas}
        countTerminadas={comisionesData.countTerminadas}
      />
    </div>
  );

  return (
    <div className="px-2 py-2">
      {listaComisionesContenido}

      <AnimatePresence>
        {modalMapaAbierto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Mapa
              titulo="Comision"
              isOpen={modalMapaAbierto}
              onClose={handleCerrarMapa}
              registros={registrosParaMapa}
              nombreUsuario={nombreUsuarioParaMapa}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
