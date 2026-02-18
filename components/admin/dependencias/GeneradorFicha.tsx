"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Fingerprint,
  Shield,
  Hash,
  CircleDollarSign,
  MapPin,
  Briefcase,
  FileText,
  BadgeDollarSign,
  Wallet,
  X,
  FileImage,
  FileText as FilePdf,
  Loader2,
  Building2,
  Calendar, 
  Cake,     
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInfoUsuario } from "@/hooks/usuarios/useInfoUsuario";
import useUserData from "@/hooks/sesion/useUserData";
import Cargando from "@/components/ui/animations/Cargando";
import { useFirmante, useNacimientoUsuario } from "@/components/admin/dependencias/hook";

type RenglonConfig = {
  salarioLabel: string;
  bonoLabel?: string;
  tieneBono: boolean;
};

const renglonConfig: Record<string, RenglonConfig> = {
  "011": { salarioLabel: "Salario Base (011)", bonoLabel: "Bonificación (015)", tieneBono: true },
  "061": { salarioLabel: "Dietas (061)", tieneBono: false },
  "022": { salarioLabel: "Salario Base (022)", bonoLabel: "Bonificación (027)", tieneBono: true },
  "029": { salarioLabel: "Honorarios (029)", tieneBono: false },
  "031": { salarioLabel: "Jornal (031)", bonoLabel: "Bonificación (033)", tieneBono: true },
  "035": { salarioLabel: "Retribución a destajo (035)", tieneBono: false },
  "036": { salarioLabel: "Retribución por servicios (036)", tieneBono: false },
};

const TableRow = ({
  icon,
  label,
  value,
  isTotal = false,
  isHeader = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | number | null;
  isTotal?: boolean;
  isHeader?: boolean;
}) => {
  if (isHeader) {
    return (
      <tr>
        <td colSpan={2} className="bg-slate-900 text-white p-1.5 text-[10px] font-bold uppercase tracking-wider text-center border border-slate-900">
          {label}
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b border-gray-300 ${isTotal ? "bg-emerald-50" : "bg-white"}`}>
      <td className="p-1.5 border-r border-gray-300 bg-gray-50 w-[30%] align-middle">
        <div className="flex items-center gap-2">
          <span className={isTotal ? "text-emerald-600" : "text-slate-400"}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 12 }) : icon}
          </span>
          <span className={`text-[9px] font-bold uppercase leading-tight ${isTotal ? "text-emerald-800" : "text-slate-700"}`}>
            {label}
          </span>
        </div>
      </td>
      <td className="p-1.5 align-middle">
        <span className={`block leading-tight ${isTotal ? "text-[10px] font-bold text-emerald-700" : "text-[9px] font-medium text-slate-900"}`}>
          {value || "--"}
        </span>
      </td>
    </tr>
  );
};

const calcularEdad = (fechaString: string | null | undefined): string => {
  if (!fechaString) return "--";
  const hoy = new Date();
  const nacimiento = new Date(fechaString);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return `${edad} años`;
};

const formatearFecha = (fechaString: string | null | undefined): string => {
  if (!fechaString) return "--";
  const fecha = new Date(fechaString);
  return new Intl.DateTimeFormat('es-GT', { timeZone: 'UTC' }).format(fecha);
};

interface GeneradorFichaProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function GeneradorFicha({ isOpen, onClose, userId }: GeneradorFichaProps) {
  const { usuario: datos, cargando } = useInfoUsuario(userId);
  const { rol } = useUserData();
  const firmante = useFirmante();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { nacimiento } = useNacimientoUsuario(userId);

  const ROLES_PERMITIDOS = ["SUPER", "RRHH", "SECRETARIO", "DAFIM"];
  const mostrarFinanciera = ROLES_PERMITIDOS.includes(rol);

  if (!isOpen) return null;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "--";
    return `Q ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renglon = datos?.renglon;
  const salarioBase = datos?.salario || 0;
  const bonificacion = datos?.bonificacion || 0;
  const totalDevengado = salarioBase + bonificacion;

  const configActual = renglon ? renglonConfig[renglon] : null;
  const tieneBono = configActual?.tieneBono || false;
  const salarioLabel = configActual?.salarioLabel || "Salario";
  const bonoLabel = configActual?.bonoLabel || "Bonificación";

  const pathItems = datos?.puesto_path_jerarquico
    ? datos.puesto_path_jerarquico.split(" > ").filter((i) => !i.includes("SIN DIRECC")).slice(1)
    : [];
  
  const ubicacionTexto = pathItems.length > 0 ? pathItems.join(" / ") : "--";

  const fechaNacimiento = formatearFecha(nacimiento);
  const edad = calcularEdad(nacimiento);

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(printRef.current, { cacheBust: true, backgroundColor: "#ffffff", pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `Ficha_${datos?.nombre?.replace(/\s+/g, "_") || "Empleado"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    try {
      const imgData = await toPng(printRef.current, { cacheBust: true, backgroundColor: "#ffffff", pixelRatio: 3 });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const printableWidth = pdfWidth - (margin * 2);
      const imgProps = pdf.getImageProperties(imgData);
      const printableHeight = (imgProps.height * printableWidth) / imgProps.width;
      const y = printableHeight < (pdfHeight - margin * 2) ? (pdfHeight - printableHeight) / 2 : margin;
      pdf.addImage(imgData, "PNG", margin, y, printableWidth, printableHeight);
      pdf.save(`Ficha_${datos?.nombre?.replace(/\s+/g, "_") || "Empleado"}.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const isBusy = isGenerating || cargando || firmante.loading;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileImage className="text-blue-600" /> Vista Previa de Ficha
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-100/80 dark:bg-black/50 flex justify-center items-start">
            {cargando ? (
              <div className="h-64 flex items-center justify-center">
                 <Cargando texto="Generando vista previa..." />
              </div>
            ) : (
              <div className="shadow-2xl mx-auto my-2"> 
                <div
                    ref={printRef}
                    className="bg-white flex flex-col relative"
                    style={{ width: "600px", minHeight: "800px" }} 
                >
                    <div className="p-8 flex flex-col flex-1 h-full">
                    
                        <div className="text-center mb-6 pb-4 border-b-2 border-slate-900">
                            <div className="flex justify-center mb-2">
                                <img 
                                    src="/images/logo-muni.png" 
                                    alt="Logo Municipalidad" 
                                    className="h-16 object-contain" 
                                />
                            </div>
                            
                            <h1 className="text-lg font-black text-slate-900 uppercase leading-tight px-4">
                                {datos?.nombre}
                            </h1>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="border border-gray-300 rounded-sm overflow-hidden mb-6">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <TableRow label="Información Personal" isHeader />
                                    </thead>
                                    <tbody>
                                        <TableRow icon={<Phone />} label="Teléfono" value={datos?.telefono} />

                                        <TableRow icon={<Calendar />} label="Fecha de Nacimiento" value={fechaNacimiento} />
                                        <TableRow icon={<Cake />} label="Edad" value={edad} />

                                        <TableRow icon={<Fingerprint />} label="DPI" value={datos?.dpi} />
                                        <TableRow icon={<Hash />} label="NIT" value={datos?.nit} />
                                        <TableRow icon={<Shield />} label="Afiliación IGSS" value={datos?.igss} />
                                        <TableRow icon={<CircleDollarSign />} label="No. Cuenta" value={datos?.cuenta_no} />
                                        <TableRow icon={<MapPin />} label="Dirección" value={datos?.direccion} />
                                    </tbody>
                                    
                                    <thead>
                                        <TableRow label="Información Contractual" isHeader />
                                    </thead>
                                    <tbody>
                                        <TableRow icon={<Briefcase />} label="Puesto" value={datos?.puesto_nombre} />
                                        <TableRow icon={<Building2 />} label="Ubicación Organizacional" value={ubicacionTexto} />
                                        <TableRow icon={<FileText />} label="Renglón" value={renglon} />
                                        
                                        {mostrarFinanciera ? (
                                            <>
                                                <TableRow icon={<CircleDollarSign />} label={salarioLabel} value={formatCurrency(salarioBase)} />
                                                {tieneBono && (
                                                    <TableRow icon={<BadgeDollarSign />} label={bonoLabel} value={formatCurrency(bonificacion)} />
                                                )}
                                                <TableRow icon={<Wallet />} label="Total Devengado" value={formatCurrency(totalDevengado)} isTotal={true} />
                                            </>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 mb-4 flex flex-col items-center justify-center">
                            <div className="w-64 border-b border-slate-900 mb-2"></div>
                            <p className="text-[10px] font-bold text-slate-900 uppercase text-center">
                                {firmante.loading 
                                  ? "Validando..." 
                                  : (firmante.nombre ? `Licda. ${firmante.nombre}` : "Firma Autorizada")
                                }
                            </p>
                            <p className="text-[9px] font-semibold text-slate-500 uppercase text-center">
                                {!firmante.loading && (firmante.cargo || "ADMINISTRACIÓN MUNICIPAL")}
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end items-center gap-3 z-10">
             <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cerrar</Button>
             <Button 
                variant="secondary" 
                onClick={handleDownloadImage} 
                disabled={isBusy} 
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
             >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileImage className="mr-2 h-4 w-4"/>} PNG
             </Button>
             <Button 
                onClick={handleDownloadPDF} 
                disabled={isBusy} 
                className="bg-red-600 hover:bg-red-700 text-white shadow-md transition-all"
             >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FilePdf className="mr-2 h-4 w-4"/>} PDF
             </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}