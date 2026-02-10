"use client";

import { useMemo, useState } from "react";
import { TODOS_LOS_MODULOS } from "../constants";
import ModuleCard from "../modules/ModuleCard";
import ModuleAccordion from "../modules/ModuleAccordion";

interface ModulesViewProps {
  rol: string;
  modulos: string[];
  esjefe: boolean;
}

export default function ModulesView({
  rol,
  modulos = [],
  esjefe,
}: ModulesViewProps) {
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  const modulosDisponibles = useMemo(
    () =>
      TODOS_LOS_MODULOS.filter((m) => {
        if (rol === "SUPER") return true;
        if (["ACTIVIDADES", "PERMISOS", "SOLICITUDCOMBUSTIBLE"].includes(m.id)) return true;
        if (
          [
            "ASISTENCIA",
            "COMISIONES_JEFE",
            "PERMISOS_JEFE",
            "ACTIVIDADES_JEFE",
          ].includes(m.id)
        )
          return esjefe;
        if (
          [
            "COMISIONES_RRHH",
            "PERMISOS_GESTION",
            "ACTIVIDADES_GESTION",
            "RRHH",
            "ORGANOS_RRHH",
          ].includes(m.id)
        ) {
          return (
            ["RRHH", "SECRETARIO"].includes(rol) || modulos.includes("RRHH")
          );
        }
        if (m.subgrupo === "Concejo Municipal") {
          return (
            ["CONCEJAL", "ALCALDE", "SECRETARIO"].includes(rol) ||
            modulos.includes("CONCEJO") ||
            modulos.includes(m.permiso)
          );
        }
        return modulos.includes(m.permiso);
      }),
    [rol, modulos, esjefe],
  );

  const modulosPoliticas = useMemo(
    () =>
      modulosDisponibles.filter((m) => m.categoria === "Políticas Públicas"),
    [modulosDisponibles],
  );
  const modulosGestion = useMemo(
    () =>
      modulosDisponibles.filter(
        (m) => m.categoria === "Gestión Administrativa",
      ),
    [modulosDisponibles],
  );

  const showConcejoAccordion = useMemo(
    () =>
      ["CONCEJAL", "ALCALDE", "SECRETARIO"].includes(rol) ||
      modulos.includes("CONCEJO"),
    [rol, modulos],
  );
  const showRRHHAccordion = useMemo(
    () => ["RRHH", "SECRETARIO"].includes(rol) || modulos.includes("RRHH"),
    [rol, modulos],
  );

  const renderModuleCard = (modulo: any) => (
    <ModuleCard
      key={modulo.id}
      modulo={modulo}
      loadingModule={loadingModule}
      setLoadingModule={setLoadingModule}
    />
  );

  const tienePoliticas = modulosPoliticas.length > 0;
  const tieneGestion = modulosGestion.length > 0;

  return (
    <div className="w-full lg:max-w-[100%] xl:max-w-[90%] mx-auto">
      <div
        className={`${tienePoliticas && tieneGestion ? "grid grid-cols-1 md:grid-cols-2 gap-x-8 items-start" : "max-w-3xl mx-auto flex flex-col justify-center"}`}
      >
        {tienePoliticas && (
          <div className={`space-y-4 mb-4 ${!tieneGestion ? "w-full" : ""}`}>
            <h2 className="text-2xl font-bold text-blue-600 dark:text-gray-100 mb-4 text-center md:text-left">
              Políticas Públicas
            </h2>
            <div className="space-y-4">
              {modulosPoliticas.map(renderModuleCard)}
            </div>
          </div>
        )}

        {tieneGestion && (
          <div className={`space-y-4 ${!tienePoliticas ? "w-full" : ""}`}>
            <h2 className="text-2xl font-bold text-blue-600 dark:text-gray-100 mb-4 text-center md:text-left">
              Gestión Administrativa
            </h2>

            <ModuleAccordion
              titulo="Gestión Propia"
              descripcion="Gestión de actividades y permisos personales."
              iconKey="fmdwwfgs"
            >
              {modulosGestion
                .filter(
                  (m) =>
                    m.subgrupo === "Gestión Propia" ||
                    ["ACTIVIDADES", "PERMISOS"].includes(m.id),
                )
                .map(renderModuleCard)}
            </ModuleAccordion>

            {esjefe && (
              <ModuleAccordion
                titulo="Gestión Jefe de Área"
                descripcion="Gestión y supervisión de equipos."
                iconKey="tobsqthh"
              >
                {modulosGestion
                  .filter((m) => m.subgrupo === "Gestión Jefe de Área")
                  .map(renderModuleCard)}
              </ModuleAccordion>
            )}

            {showConcejoAccordion ? (
              <ModuleAccordion
                titulo="Concejo Municipal"
                descripcion="Gestión de actas y sesiones."
                iconKey="qaeqyqcc"
              >
                {modulosGestion
                  .filter((m) => m.subgrupo === "Concejo Municipal")
                  .map(renderModuleCard)}
              </ModuleAccordion>
            ) : (
              modulosGestion
                .filter((m) => m.subgrupo === "Concejo Municipal")
                .map(renderModuleCard)
            )}

            {showRRHHAccordion ? (
              <ModuleAccordion
                titulo="Recursos Humanos"
                descripcion="Administración de personal y permisos."
                iconKey="zyuyqigo"
              >
                {modulosGestion
                  .filter((m) => m.subgrupo === "Recursos Humanos")
                  .map(renderModuleCard)}
              </ModuleAccordion>
            ) : (
              modulosGestion
                .filter((m) => m.subgrupo === "Recursos Humanos")
                .map(renderModuleCard)
            )}

            <div className="space-y-4 pt-2">
              {modulosGestion
                .filter(
                  (m) =>
                    !m.subgrupo && !["ACTIVIDADES", "PERMISOS"].includes(m.id),
                )
                .map(renderModuleCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
