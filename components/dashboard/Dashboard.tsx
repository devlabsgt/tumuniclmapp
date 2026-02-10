"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import useUserData from "@/hooks/sesion/useUserData";

import Asistencia from "@/components/asistencia/Asistencia";
import MisComisiones from "@/components/comisiones/asistencia/MisComisiones";
import HorarioSistema from "@/components/admin/sistema/HorarioSistema";
import TarjetaEmpleado from "@/components/admin/dependencias/TarjetaEmpleado";
import BroadcastButton from "@/components/push/BroadcastButton";

import Config from "./buttons/Config";
import ViewSwitcher from "./buttons/ViewSwitcher";
import Profile from "./buttons/Profile";
import ModulesView from "./views/ModulesView";
import { Vistas } from "./constants";

export default function Dashboard() {
  const { rol, modulos = [], permisos = [], userId, esjefe } = useUserData();

  const [mostrarTarjetaModal, setMostrarTarjetaModal] = useState(false);
  const [mostrarHorarioModal, setMostrarHorarioModal] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<Vistas>("modulos");

  useEffect(() => {
    if (mostrarTarjetaModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mostrarTarjetaModal]);

  const isSuper = rol === "SUPER";

  return (
    <section className="w-full mx-auto px-4 md:px-8 pt-2">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {permisos.includes("CONFIGURACION") && isSuper && (
          <Config onShowHorario={() => setMostrarHorarioModal(true)} />
        )}

        {isSuper && (
          <div className="md:col-span-2 order-4 md:order-2">
            <BroadcastButton />
          </div>
        )}

        <ViewSwitcher
          vistaActiva={vistaActiva}
          setVistaActiva={setVistaActiva}
          isSuper={isSuper}
        />

        <Profile
          userId={userId}
          isSuper={isSuper}
          onShowTarjeta={() => setMostrarTarjetaModal(true)}
        />
      </div>

      <TarjetaEmpleado
        isOpen={mostrarTarjetaModal}
        onClose={() => setMostrarTarjetaModal(false)}
        userId={userId}
      />

      <AnimatePresence mode="wait">
        {vistaActiva === "modulos" ? (
          <motion.div
            key="modulos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ModulesView rol={rol} modulos={modulos} esjefe={esjefe} />
          </motion.div>
        ) : vistaActiva === "asistencia" ? (
          <motion.div
            key="asistencia"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Asistencia onFinalizar={() => setVistaActiva("modulos")} />
          </motion.div>
        ) : (
          <motion.div
            key="comisiones"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MisComisiones />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarHorarioModal && (
          <HorarioSistema onClose={() => setMostrarHorarioModal(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}
