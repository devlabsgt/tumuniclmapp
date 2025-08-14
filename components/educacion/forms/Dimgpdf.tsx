'use client';

import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

interface DimgpdfProps {
  rootElementRef: React.RefObject<HTMLDivElement | null>;
  fileName: string;
}

export default function Dimgpdf({ rootElementRef, fileName }: DimgpdfProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const captureAndDownload = async (type: 'pdf' | 'image') => {
    if (!rootElementRef.current) {
      toast.error('No se pudo encontrar el elemento para generar el archivo.');
      return;
    }

    const element = rootElementRef.current;
    
    setIsDropdownOpen(false);
    
    // Ocultar todos los botones de control para la captura
    const buttonsToHide = element.querySelectorAll('button, [id="download-button"], [id="close-modal-button"]');
    buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'none');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
      });

      if (type === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const contentWidth = canvas.width;
        const contentHeight = canvas.height;

        const ratio = Math.min(pdfWidth * 0.8 / contentWidth, pdfHeight * 0.8 / contentHeight);

        const newWidth = contentWidth * ratio;
        const newHeight = contentHeight * ratio;

        const x = (pdfWidth - newWidth) / 2;
        const y = (pdfHeight - newHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', x, y, newWidth, newHeight);
        
        window.open(pdf.output('bloburl'), '_blank');
      } else if (type === 'image') {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          } else {
            toast.error('Error al crear la imagen.');
          }
        }, 'image/png');
      }
      
      toast.success(`${type === 'pdf' ? 'PDF' : 'Imagen'} abierto en una nueva pestaña.`);

    } catch (error) {
      console.error(`Error generando ${type}:`, error);
      toast.error(`Error al generar el ${type === 'pdf' ? 'PDF' : 'imagen'}.`);
    } finally {
      // Mostrar todos los botones de control de nuevo
      buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'flex');
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        id="download-button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-blue-600 hover:bg-blue-700 shadow-lg gap-2 w-full"
      >
        <Download className="h-4 w-4" />
        Descargar
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 right-0 w-full rounded-lg bg-blue-600 shadow-xl z-20 overflow-hidden"
          >
            <button
              onClick={() => captureAndDownload('pdf')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
            >
              PDF
            </button>
            <button
              onClick={() => captureAndDownload('image')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
            >
              Imagen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
