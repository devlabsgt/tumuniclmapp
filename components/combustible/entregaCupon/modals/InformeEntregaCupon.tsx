'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { getDatosImpresion } from '../lib/actions';
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: number | null;
}

// Estructura de datos alineada con lo que devuelve actions.ts
interface DatosReporte {
  id: number;
  created_at: string;
  placa: string;
  municipio_destino: string;
  aprobador: string; // Nombre del admin
  usuario: { nombre: string; dpi: string } | null;
  vehiculo: { modelo: string; tipo_combustible: string } | null;
  items: {
    cantidad: number;
    producto: string;
    denominacion: number;
    inicio: number;
    fin: number;
    subtotal: number;
  }[];
}

export default function InformeEntregaCupon({ isOpen, onClose, solicitudId }: Props) {
  const [datos, setDatos] = useState<DatosReporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && solicitudId) {
      setLoading(true);
      getDatosImpresion(solicitudId)
        .then((data: any) => {
            if(data) setDatos(data);
            else {
                Swal.fire('Error', 'No se encontraron datos para esta solicitud.', 'warning');
                onClose();
            }
        })
        .catch((err) => {
            console.error(err);
            Swal.fire('Error', 'Error al cargar los datos del reporte.', 'error');
            onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, solicitudId]);

  const totalValor = datos?.items.reduce((acc, item) => acc + item.subtotal, 0) || 0;

  const generatePdf = async () => {
    if (!printRef.current || !datos) return;
    setIsPrinting(true);
    try {
        const element = printRef.current;
        const dataUrl = await htmlToImage.toJpeg(element, { quality: 1.0, backgroundColor: '#ffffff', pixelRatio: 2 });
        
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Vale_Entrega_${datos.id}_${datos.placa}.pdf`);
    } catch (error) {
        console.error('Error generando PDF', error);
        Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    } finally {
        setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 bg-gray-100 dark:bg-neutral-900 text-black border-none overflow-hidden">
        
        <DialogHeader className="p-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                <FileText size={20} />
             </div>
             <div className="flex flex-col text-left">
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Vale de Entrega</DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">#{datos?.id || '---'} — Vista previa</p>
             </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={onClose} disabled={isPrinting} className="dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700">
                <X size={18} />
             </Button>
             <Button onClick={generatePdf} disabled={loading || isPrinting || !datos} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                {isPrinting ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                <span className="hidden sm:inline">Descargar PDF</span>
             </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center bg-gray-200/50 dark:bg-black/20">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <span>Cargando datos del vale...</span>
                </div>
            ) : datos ? (
                <div ref={printRef} className="w-[816px] min-h-[1056px] bg-white shadow-2xl p-12 text-black relative flex flex-col">
                    
                    {/* ENCABEZADO */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                        <div className="flex items-center gap-4">
                            {/* IMAGEN A COLOR: Clase grayscale eliminada */}
                            <img src="/images/logo-muni-azul.png" alt="Logo" className="h-20 object-contain" /> 
                            <div>
                                <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">Municipalidad de<br/>Concepción Las Minas</h1>
                                <p className="text-xs font-semibold text-gray-600">Departamento de Chiquimula, Guatemala C.A.</p>
                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Unidad de Transportes y Combustibles</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wider">Vale de<br/>Combustible</h2>
                            <p className="text-xl font-mono text-red-600 font-bold mt-1">No. {datos.id.toString().padStart(6, '0')}</p>
                        </div>
                    </div>

                    {/* DATOS GENERALES */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs mb-8 border border-gray-200 p-5 rounded-lg bg-gray-50">
                        <div>
                            <span className="font-bold text-gray-500 uppercase block mb-1">Fecha de Emisión:</span>
                            <span className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div>
                            <span className="font-bold text-gray-500 uppercase block mb-1">Destino de Comisión:</span>
                            <span className="text-sm font-medium uppercase text-slate-900">{datos.municipio_destino}</span>
                        </div>
                        
                        <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">Solicitado Por (Piloto):</span>
                                    <span className="text-sm font-bold uppercase text-slate-900">{datos.usuario?.nombre || '---'}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">DPI / Identificación:</span>
                                    <span className="text-sm font-mono font-medium text-slate-900">{datos.usuario?.dpi || '________________________'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 border-t border-gray-200 pt-3 mt-1 flex gap-8 items-center">
                            <div>
                                <span className="font-bold text-gray-500 uppercase mr-2">Vehículo:</span>
                                <span className="font-medium uppercase text-slate-900">{datos.vehiculo?.modelo || '---'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-500 uppercase mr-2">Placa:</span>
                                <span className="font-mono font-bold bg-white border border-gray-300 px-2 py-0.5 rounded text-slate-900">{datos.placa}</span>
                            </div>
                            {datos.vehiculo?.tipo_combustible && (
                                <div>
                                    <span className="font-bold text-gray-500 uppercase mr-2">Combustible:</span>
                                    <span className="font-bold uppercase text-slate-900">{datos.vehiculo.tipo_combustible}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TABLA DE CUPONES */}
                    <div className="mb-12">
                        <h3 className="text-xs font-bold uppercase mb-2 border-b border-black pb-1 text-slate-800">Detalle de Cupones Entregados</h3>
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                                    <th className="border border-slate-300 px-3 py-2 text-center w-16">Cant.</th>
                                    <th className="border border-slate-300 px-3 py-2 text-left">Descripción / Producto</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center">Denominación</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center">Rango Correlativo (Serie)</th>
                                    <th className="border border-slate-300 px-3 py-2 text-right w-24">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-300 px-3 py-3 text-center font-bold text-slate-900">{item.cantidad}</td>
                                        <td className="border border-slate-300 px-3 py-3 uppercase text-slate-800">{item.producto}</td>
                                        <td className="border border-slate-300 px-3 py-3 text-center text-slate-800">Q{item.denominacion}</td>
                                        <td className="border border-slate-300 px-3 py-3 text-center font-mono text-slate-600">
                                            {item.inicio} <span className="text-gray-400 mx-1">➔</span> {item.fin}
                                        </td>
                                        <td className="border border-slate-300 px-3 py-3 text-right font-medium text-slate-900">Q{item.subtotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 4 - datos.items.length) }).map((_, i) => (
                                    <tr key={`empty-${i}`}>
                                        <td className="border border-slate-300 py-3">&nbsp;</td>
                                        <td className="border border-slate-300">&nbsp;</td>
                                        <td className="border border-slate-300">&nbsp;</td>
                                        <td className="border border-slate-300">&nbsp;</td>
                                        <td className="border border-slate-300">&nbsp;</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900 text-white font-bold">
                                    <td colSpan={4} className="px-4 py-2 text-right uppercase text-[10px] tracking-wider">Total Entregado</td>
                                    <td className="px-3 py-2 text-right text-sm">Q{totalValor.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* AREA DE FIRMAS */}
                    <div className="mt-auto">
                        <div className="text-xs text-justify mb-10 text-slate-600 italic px-4">
                            Declaro haber recibido los cupones de combustible detallados anteriormente, los cuales serán utilizados exclusivamente para la comisión oficial descrita.
                        </div>

                        <div className="flex justify-between items-end px-8 gap-16 mb-8">
                            
                            {/* FIRMA ENTREGA (ADMIN) */}
                            <div className="flex-1 text-center">
                                <div className="h-16 mb-2 border-b border-black"></div>
                                <p className="text-xs font-bold uppercase mb-1 text-slate-900">Entregado Por</p>
                                {/* Nombre dinámico del admin */}
                                <p className="text-[10px] uppercase font-bold text-slate-800">{datos.aprobador}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Encargado de Combustibles</p>
                            </div>

                            {/* FIRMA RECIBE (PILOTO) */}
                            <div className="flex-1 text-center">
                                <div className="h-16 mb-2 border-b border-black"></div>
                                <p className="text-xs font-bold uppercase mb-1 text-slate-900">Recibí Conforme</p>
                                <p className="text-[10px] uppercase font-bold text-slate-800">{datos.usuario?.nombre}</p>
                                <p className="text-[10px] text-gray-500">DPI: {datos.usuario?.dpi || '________________________'}</p>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200 text-[9px] text-gray-400 text-center uppercase flex justify-between">
                            <span>Sistema de Gestión Municipal</span>
                            <span>Impreso el {new Date().toLocaleString()}</span>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-red-500 font-bold">No se encontraron datos para mostrar.</div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}