"use client";

import React, { useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { PermisoEmpleado } from "../types";
import PermisoTemplate from "../PermisoTemplate";
import { toPng } from "html-to-image";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

interface Props {
  permiso: PermisoEmpleado | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewPermiso({ permiso, isOpen, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);
  const [scale, setScale] = useState(1);

  React.useEffect(() => {
    if (isOpen) {
      const updateScale = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth - 40; // Margen de seguridad
          const templateWidth = 850; // El ancho fijo configurado en PermisoTemplate
          if (containerWidth < templateWidth) {
            setScale(containerWidth / templateWidth);
          } else {
            setScale(1);
          }
        }
      };
      
      // Pequeño delay para asegurar que el modal ya se renderizó y tiene dimensiones
      const timer = setTimeout(updateScale, 100);
      window.addEventListener("resize", updateScale);
      return () => {
        window.removeEventListener("resize", updateScale);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  if (!isOpen || !permiso) return null;

  const handleDescargar = async () => {
    if (!templateRef.current) return;
    setDescargando(true);
    try {
      // Pequeña pausa para asegurar carga
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataUrl = await toPng(templateRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `Permiso_${permiso.usuario?.nombre?.replace(/\s+/g, "_") || "Solicitud"}_${format(parseISO(permiso.inicio), "dd-MM-yyyy")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Imagen descargada");
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-[900px] flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header con Título y Cerrar */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 z-10">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Ver permiso</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-neutral-800 rounded-xl transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-4 pt-10 flex justify-center bg-gray-100 dark:bg-neutral-950 min-h-[300px]"
        >
          <div 
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: '850px',
              height: `${850 * scale}px`
            }}
            className="transition-transform duration-200"
          >
             <PermisoTemplate ref={templateRef} permiso={permiso} />
          </div>
        </div>

        {/* Footer with Download */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex justify-center">
          <Button
            onClick={handleDescargar}
            disabled={descargando}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-8 rounded-xl font-bold shadow-lg transition-all"
          >
            {descargando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Descargar Imagen del Permiso
          </Button>
        </div>
      </div>
    </div>
  );
}
