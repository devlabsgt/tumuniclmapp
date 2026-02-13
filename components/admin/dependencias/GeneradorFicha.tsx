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
} from "lucide-react";
import { Button } from "@/components/ui/button";
// AJUSTA ESTAS IMPORTACIONES SEGÚN TU PROYECTO
import { useInfoUsuario } from "@/hooks/usuarios/useInfoUsuario";
import useUserData from "@/hooks/sesion/useUserData";
import Cargando from "@/components/ui/animations/Cargando";
import { useFirmante } from "@/components/admin/dependencias/hook"; 

// --- Configuración de Renglones ---
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

// --- Componente de Fila de Tabla (COMPACTO) ---
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
        <td
          colSpan={2}
          className="bg-slate-900 text-white p-1.5 text-[10px] font-bold uppercase tracking-wider text-center border border-slate-900"
        >
          {label}
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b border-gray-300 ${isTotal ? "bg-emerald-50" : "bg-white"}`}>
      {/* Celda Etiqueta */}
      <td className="p-1.5 border-r border-gray-300 bg-gray-50 w-[45%] align-middle">
        <div className="flex items-center gap-2">
          <span className={isTotal ? "text-emerald-600" : "text-slate-400"}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<any>, { size: 12 }) 
              : icon}
          </span>
          <span
            className={`text-[9px] font-bold uppercase leading-tight ${
              isTotal ? "text-emerald-800" : "text-slate-700"
            }`}
          >
            {label}
          </span>
        </div>
      </td>
      
      {/* Celda Valor */}
      <td className="p-1.5 align-middle">
        <span
          className={`font-bold block ${
            isTotal ? "text-[11px] text-emerald-700" : "text-[10px] text-slate-900"
          }`}
        >
          {value || "--"}
        </span>
      </td>
    </tr>
  );
};

// --- Componente Principal ---
interface GeneradorFichaProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function GeneradorFicha({ isOpen, onClose, userId }: GeneradorFichaProps) {
  // 1. Hooks de datos
  const { usuario: datos, cargando } = useInfoUsuario(userId);
  const { rol } = useUserData();
  const firmante = useFirmante(); 
  
  // 2. Refs y Estados locales
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 3. Lógica de Permisos
  const ROLES_PERMITIDOS = ["SUPER", "RRHH", "SECRETARIO", "DAFIM"];
  const mostrarFinanciera = ROLES_PERMITIDOS.includes(rol);

  if (!isOpen) return null;

  // 4. Helpers de Formato
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

  // 5. Manejadores de Descarga
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
      // Capturamos el div limpio (sin sombra)
      const imgData = await toPng(printRef.current, { cacheBust: true, backgroundColor: "#ffffff", pixelRatio: 3 });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" }); // Carta (215.9 x 279.4 mm)
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // ✅ AJUSTE CLAVE: Márgenes reales para que no se vea "pegado" al borde
      const margin = 15; // 15mm de margen
      const printableWidth = pdfWidth - (margin * 2);
      
      const imgProps = pdf.getImageProperties(imgData);
      const printableHeight = (imgProps.height * printableWidth) / imgProps.width;
      
      // Centrado Vertical
      const y = printableHeight < (pdfHeight - margin * 2) 
        ? (pdfHeight - printableHeight) / 2 
        : margin; // Si es muy alto, empezar desde el margen superior
      
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
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FileImage className="text-blue-600" /> Vista Previa de Ficha
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cuerpo: Vista Previa */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-100/80 dark:bg-black/50 flex justify-center items-start">
            {cargando ? (
              <div className="h-64 flex items-center justify-center">
                 <Cargando texto="Generando vista previa..." />
              </div>
            ) : (
              // --- WRAPPER VISUAL CON SOMBRA (No se imprime) ---
              // La sombra va aquí afuera para que html-to-image no la capture
              <div className="shadow-2xl mx-auto my-2"> 
                
                {/* --- ÁREA DE IMPRESIÓN (LIMPIA) --- */}
                <div
                    ref={printRef} // 👈 El ref va AQUÍ (sin sombra, sin margin externo)
                    className="bg-white flex flex-col relative"
                    style={{ width: "600px", minHeight: "800px" }} 
                >
                    {/* Contenido Interno de la Hoja */}
                    <div className="p-8 flex flex-col flex-1 h-full">
                    
                        {/* 1. Logo y Encabezado */}
                        <div className="text-center mb-6 pb-2 border-b-2 border-slate-900">
                            <div className="flex justify-center mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src="/images/logo-muni.png" 
                                    alt="Logo Municipalidad" 
                                    className="h-14 object-contain" 
                                />
                            </div>
                            
                            <h1 className="text-base font-black text-slate-900 uppercase leading-tight mb-1 px-4">
                                {datos?.nombre}
                            </h1>
                            
                            <div className="inline-flex items-center justify-center gap-1.5 text-slate-600 font-bold text-[10px] uppercase bg-slate-100 py-0.5 px-2 rounded-full mx-auto mb-1">
                                <Briefcase size={12} />
                                <span>{datos?.puesto_nombre}</span>
                            </div>

                            {pathItems.length > 0 && (
                                <p className="text-[9px] text-slate-400 mt-0.5 italic max-w-xs mx-auto leading-tight">
                                    {pathItems.join(" / ")}
                                </p>
                            )}
                        </div>

                        {/* 2. Tablas de Datos */}
                        <div className="flex-1 flex flex-col">
                            <div className="border border-gray-300 rounded-sm overflow-hidden mb-6">
                                {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
                                <table className="w-full border-collapse">
                                    <thead>
                                        <TableRow label="Información Personal" isHeader />
                                    </thead>
                                    <tbody>
                                        <TableRow icon={<Phone />} label="Teléfono" value={datos?.telefono} />
                                        <TableRow icon={<Fingerprint />} label="DPI" value={datos?.dpi} />
                                        <TableRow icon={<Hash />} label="NIT" value={datos?.nit} />
                                        <TableRow icon={<Shield />} label="Afiliación IGSS" value={datos?.igss} />
                                        <TableRow icon={<CircleDollarSign />} label="No. Cuenta" value={datos?.cuenta_no} />
                                        <TableRow icon={<MapPin />} label="Dirección" value={datos?.direccion} />
                                    </tbody>
                                    
                                    {/* SECCIÓN 2: INFORMACIÓN CONTRACTUAL */}
                                    <thead>
                                        <TableRow label="Información Contractual" isHeader />
                                    </thead>
                                    <tbody>
                                        <TableRow icon={<FileText />} label="Renglón" value={renglon} />
                                        
                                        {mostrarFinanciera ? (
                                        <>
                                            <TableRow icon={<CircleDollarSign />} label={salarioLabel} value={formatCurrency(salarioBase)} />
                                            {tieneBono && (
                                            <TableRow icon={<BadgeDollarSign />} label={bonoLabel} value={formatCurrency(bonificacion)} />
                                            )}
                                            <TableRow icon={<Wallet />} label="Total Devengado" value={formatCurrency(totalDevengado)} isTotal={true} />
                                        </>
                                        ) : (
                                        <tr>
                                            <td colSpan={2} className="p-4 text-center text-[10px] text-gray-400 italic bg-gray-50">
                                                Información financiera restringida.
                                            </td>
                                        </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. Área de Firma */}
                        <div className="mt-4 mb-4 flex flex-col items-center justify-center">
                            <div className="w-56 border-b border-slate-900 mb-2"></div>
                            
                            <p className="text-[10px] font-bold text-slate-900 uppercase">
                                {firmante.loading 
                                    ? "Validando..." 
                                    : (firmante.nombre || "Firma Autorizada")
                                }
                            </p>
                            
                            <p className="text-[9px] font-semibold text-slate-500 uppercase">
                                {!firmante.loading && (firmante.cargo || "ADMINISTRACIÓN MUNICIPAL")}
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer de Acciones */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center gap-4 z-10">
             <div className="text-xs text-gray-500 hidden sm:block">
                Revise los datos antes de exportar.
             </div>
             <div className="flex gap-3">
               <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cerrar</Button>
               
               <Button 
                  variant="secondary" 
                  onClick={handleDownloadImage} 
                  disabled={isBusy} 
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
               >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileImage className="mr-2 h-4 w-4"/>} 
                  PNG
               </Button>
               
               <Button 
                  onClick={handleDownloadPDF} 
                  disabled={isBusy} 
                  className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
               >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FilePdf className="mr-2 h-4 w-4"/>} 
                  PDF
               </Button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}