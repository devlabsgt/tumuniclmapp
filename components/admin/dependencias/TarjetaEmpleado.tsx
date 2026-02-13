"use client";

import { useState } from "react"; // 1. Importamos useState
import { motion, AnimatePresence } from "framer-motion";
import GeneradorFicha from "./GeneradorFicha"; 
import {
  User,
  Shield,
  Fingerprint,
  Hash,
  MapPin,
  Phone,
  FileText,
  CircleDollarSign,
  BadgeDollarSign,
  Wallet,
  TrendingDown,
  Banknote,
  X,
  Loader2,
  Briefcase,
  Clock,
  Lock,
  Building2,
  Landmark,
  Download, // 2. Importamos el icono Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Cargando from "@/components/ui/animations/Cargando";
import { useInfoUsuario } from "@/hooks/usuarios/useInfoUsuario";
import useUserData from "@/hooks/sesion/useUserData";

type RenglonConfig = {
  salarioLabel: string;
  bonoLabel?: string;
  tieneBono: boolean;
};

const renglonConfig: Record<string, RenglonConfig> = {
  "011": {
    salarioLabel: "Salario Base (011)",
    bonoLabel: "Bonificación (015)",
    tieneBono: true,
  },
  "061": { salarioLabel: "Dietas (061)", tieneBono: false },
  "022": {
    salarioLabel: "Salario Base (022)",
    bonoLabel: "Bonificación (027)",
    tieneBono: true,
  },
  "029": { salarioLabel: "Honorarios (029)", tieneBono: false },
  "031": {
    salarioLabel: "Jornal (031)",
    bonoLabel: "Bonificación (033)",
    tieneBono: true,
  },
  "035": { salarioLabel: "Retribución a destajo (035)", tieneBono: false },
  "036": { salarioLabel: "Retribución por servicios (036)", tieneBono: false },
};

const InfoItem = ({
  icon,
  label,
  value,
  isLoading,
  isDeduction = false,
  isTotal = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  isLoading?: boolean;
  isDeduction?: boolean;
  isTotal?: boolean;
}) => (
  <div className="flex items-start gap-4 py-1">
    <div
      className={`mt-1 ${isDeduction ? "text-red-500" : "text-blue-500 dark:text-blue-400"} ${isTotal ? "text-green-600 dark:text-green-500" : ""}`}
    >
      {icon}
    </div>
    <div className="flex flex-col">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mt-1" />
      ) : (
        <h3
          className={`text-xs font-semibold ${isDeduction ? "text-red-700 dark:text-red-400" : "text-gray-800 dark:text-gray-100"} ${isTotal ? "text-lg text-green-700 dark:text-green-500" : ""}`}
        >
          {value || "--"}
        </h3>
      )}
    </div>
  </div>
);

interface TarjetaEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const PORCENTAJE_IGSS = 0.0483;
const PORCENTAJE_PLAN_PRESTACIONES = 0.07;

const FIANZA_FACTOR_ASEGURADA = 24;
const FIANZA_PORCENTAJE = 0.0005;
const IVA_PORCENTAJE = 0.12;

const calcularPrimaFianza = (salarioBase: number): number => {
  if (salarioBase <= 0) return 0;
  const sumaAsegurada = salarioBase * FIANZA_FACTOR_ASEGURADA;
  const primaBase = sumaAsegurada * FIANZA_PORCENTAJE;
  const iva = primaBase * IVA_PORCENTAJE;
  return primaBase + iva;
};

export default function TarjetaEmpleado({
  isOpen,
  onClose,
  userId,
}: TarjetaEmpleadoProps) {
  const { usuario: datosCompletos, cargando: cargandoDatos } =
    useInfoUsuario(userId);

  const { rol } = useUserData();
  
  // 3. Estado para controlar el modal de exportación
  const [showExportModal, setShowExportModal] = useState(false);

  if (!isOpen) return null;

  const ROLES_PERMITIDOS = ["SUPER", "RRHH", "SECRETARIO", "DAFIM"];
  const mostrarFinanciera = ROLES_PERMITIDOS.includes(rol);

  const formatCurrency = (
    amount: number | null | undefined,
    options: { sign?: "default" | "negative" } = {},
  ) => {
    if (amount === null || amount === undefined) return "--";
    const formatted = `Q ${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return options.sign === "negative" ? `- ${formatted}` : formatted;
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "--";
    try {
      const [hours, minutes, seconds] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      return new Intl.DateTimeFormat("es-GT", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (e) {
      return timeString;
    }
  };

  const formatDays = (days: number[] | null | undefined) => {
    if (!days || days.length === 0) return "--";
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return days
      .sort((a, b) => a - b)
      .map((d) => dayNames[d] || "?")
      .join(", ");
  };

  const isGlobalLoading = cargandoDatos;
  const renglon = datosCompletos?.renglon;
  const salarioBase = datosCompletos?.salario || 0;
  const bonificacion = datosCompletos?.bonificacion || 0;

  const configActual = renglon ? renglonConfig[renglon] : null;
  const tieneBono = configActual?.tieneBono || false;

  const salarioLabel = configActual ? configActual.salarioLabel : "Salario";
  const bonoLabel =
    configActual && configActual.bonoLabel
      ? configActual.bonoLabel
      : "Bonificación";

  const totalDevengado = salarioBase + bonificacion;
  const aplicaPrimaFianza = datosCompletos?.prima || false;
  const aplicaPlanPrestaciones = datosCompletos?.plan_prestaciones || false;

  const deduccionIGSS = salarioBase * PORCENTAJE_IGSS;
  const deduccionPlan = aplicaPlanPrestaciones
    ? salarioBase * PORCENTAJE_PLAN_PRESTACIONES
    : 0;
  const deduccionISR = datosCompletos?.isr || 0;
  const deduccionPrimaFianza = aplicaPrimaFianza
    ? calcularPrimaFianza(salarioBase)
    : 0;

  const totalDeducciones =
    deduccionIGSS + deduccionPlan + deduccionISR + deduccionPrimaFianza;
  const liquidoARecibir = totalDevengado - totalDeducciones;

  const pathItems = datosCompletos?.puesto_path_jerarquico
    ? datosCompletos.puesto_path_jerarquico
        .split(" > ")
        .filter(
          (item) =>
            item.toUpperCase() !== "SIN DIRECCIÓN" &&
            item.toUpperCase() !== "SIN DIRECCION",
        )
        .slice(1)
    : [];

  const horario = datosCompletos?.horario_nombre
    ? {
        nombre: datosCompletos.horario_nombre,
        dias: formatDays(datosCompletos.horario_dias),
        entrada: formatTime(datosCompletos.horario_entrada),
        salida: formatTime(datosCompletos.horario_salida),
      }
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl relative max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 4. Botones de Cabecera (Exportar y Cerrar) */}
            <div className="absolute top-2 right-2 flex gap-2">
              {!isGlobalLoading && (
                <Button
                  variant="outline"
                  size="icon"
                  title="Exportar Ficha (Imagen/PDF)"
                  onClick={() => setShowExportModal(true)}
                  className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800"
                >
                  <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isGlobalLoading ? (
              <div className="p-8 h-64">
                {" "}
                <Cargando texto="Cargando perfil..." />{" "}
              </div>
            ) : (
              <div className="p-8">
                <div className="flex flex-col items-center mb-8 lg:flex-row lg:items-center lg:gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4 lg:mb-0">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col items-start w-full">
                    <h2 className="text-xl font-bold">
                      {datosCompletos?.nombre || "N/A"}
                    </h2>
                    {pathItems.length > 0 && (
                      <div className="mt-4 w-full border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="flex items-center text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          <Briefcase
                            size={14}
                            className="mr-2 text-blue-500 flex-shrink-0"
                          />{" "}
                          Ubicación Organizacional
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {" "}
                            {pathItems.join(" / ")}{" "}
                          </p>
                        </div>
                      </div>
                    )}
                    {horario && (
                      <div className="mt-4 w-full border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="flex items-center text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          <Clock
                            size={14}
                            className="mr-2 text-blue-500 flex-shrink-0"
                          />{" "}
                          Información de Horario
                        </h4>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Horario:
                            </span>{" "}
                            {horario.nombre}{" "}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4">
                            {" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Días:
                            </span>{" "}
                            {horario.dias}{" "}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4">
                            {" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Entrada:
                            </span>{" "}
                            {horario.entrada}{" "}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4">
                            {" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Salida:
                            </span>{" "}
                            {horario.salida}{" "}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-8">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">
                      Información Personal
                    </h3>
                    <InfoItem
                      icon={<User size={18} />}
                      label="Nombre Completo"
                      value={datosCompletos?.nombre}
                    />
                    <InfoItem
                      icon={<Phone size={18} />}
                      label="Teléfono"
                      value={datosCompletos?.telefono}
                    />
                    <InfoItem
                      icon={<Fingerprint size={18} />}
                      label="DPI"
                      value={datosCompletos?.dpi}
                    />
                    <InfoItem
                      icon={<Shield size={18} />}
                      label="IGSS"
                      value={datosCompletos?.igss}
                    />
                    <InfoItem
                      icon={<Hash size={18} />}
                      label="NIT"
                      value={datosCompletos?.nit}
                    />
                    <InfoItem
                      icon={<CircleDollarSign size={18} />}
                      label="No. Cuenta"
                      value={datosCompletos?.cuenta_no}
                    />
                    <InfoItem
                      icon={<MapPin size={18} />}
                      label="Dirección"
                      value={datosCompletos?.direccion}
                    />
                  </div>

                  <div className="flex flex-col mt-6 md:mt-0">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">
                      Información de Contrato
                    </h3>
                    <InfoItem
                      icon={<Briefcase size={18} />}
                      label="Cargo"
                      value={datosCompletos?.puesto_nombre}
                    />
                    <InfoItem
                      icon={<FileText size={18} />}
                      label="Renglón"
                      value={renglon}
                    />

                    {mostrarFinanciera ? (
                      <>
                        <InfoItem
                          icon={<CircleDollarSign size={18} />}
                          label={salarioLabel}
                          value={formatCurrency(salarioBase)}
                        />
                        {tieneBono && (
                          <InfoItem
                            icon={<BadgeDollarSign size={18} />}
                            label={bonoLabel}
                            value={formatCurrency(bonificacion)}
                          />
                        )}

                        <InfoItem
                          icon={<Wallet size={18} />}
                          label="Total Devengado"
                          value={formatCurrency(totalDevengado)}
                          isTotal={true}
                        />

                        <InfoItem
                          icon={<Shield size={18} />}
                          label={`IGSS (${(PORCENTAJE_IGSS * 100).toFixed(2)}%)`}
                          value={formatCurrency(deduccionIGSS, {
                            sign: "negative",
                          })}
                          isDeduction={true}
                        />
                        {aplicaPlanPrestaciones && (
                          <InfoItem
                            icon={<Building2 size={18} />}
                            label={`Plan de Prestaciones (${(PORCENTAJE_PLAN_PRESTACIONES * 100).toFixed(0)}%)`}
                            value={formatCurrency(deduccionPlan, {
                              sign: "negative",
                            })}
                            isDeduction={true}
                          />
                        )}
                        {deduccionISR > 0 && (
                          <InfoItem
                            icon={<Landmark size={18} />}
                            label="ISR (Retención Mensual)"
                            value={formatCurrency(deduccionISR, {
                              sign: "negative",
                            })}
                            isDeduction={true}
                          />
                        )}
                        {aplicaPrimaFianza && (
                          <InfoItem
                            icon={<Lock size={18} />}
                            label="Prima de Fianza"
                            value={formatCurrency(deduccionPrimaFianza, {
                              sign: "negative",
                            })}
                            isDeduction={true}
                          />
                        )}

                        <InfoItem
                          icon={<TrendingDown size={18} />}
                          label="Total Deducciones"
                          value={formatCurrency(totalDeducciones, {
                            sign: "negative",
                          })}
                          isDeduction={true}
                          isTotal={true}
                        />

                        <div className="border-t border-gray-200 ">
                          <InfoItem
                            icon={<Banknote size={20} />}
                            label="Líquido a Recibir"
                            value={formatCurrency(liquidoARecibir)}
                            isTotal={true}
                          />
                        </div>
                      </>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 5. Inserción del componente GeneradorFicha */}
            <GeneradorFicha
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              userId={userId}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}