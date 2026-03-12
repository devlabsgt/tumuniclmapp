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
  const templateRef = useRef<HTMLDivElement>(null);
  const [descargando, setDescargando] = useState(false);

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
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-[900px] flex flex-col max-h-[95vh] relative overflow-hidden">
        {/* Header Close Only */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white/80 dark:bg-neutral-800/80 rounded-full transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-100 dark:bg-neutral-950">
          <div className="origin-top scale-[0.6] sm:scale-[0.8] md:scale-100 transition-transform">
             <PermisoTemplate ref={templateRef} permiso={permiso} />
          </div>
        </div>

        {/* Footer with Download */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex justify-center">
          <Button
            onClick={handleDescargar}
            disabled={descargando}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-8 rounded-full font-bold shadow-lg transition-all"
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
