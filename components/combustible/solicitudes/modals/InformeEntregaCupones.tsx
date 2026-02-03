'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { getDatosSolicitudImpresion } from '../actions'; 
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: number | null;
}

interface DatosSolicitud {
  id: number;
  created_at: string;
  municipio_destino: string;
  departamento_destino: string;
  kilometraje_inicial: number;
  justificacion: string;
  solicitante_nombre: string;
  solicitante_dpi: string;
  unidad_direccion: string;
  aprobador: string; 
  vehiculo: {
    tipo: string;
    placa: string;
    modelo: string;
    combustible: string;
  };
  detalles: {
    fecha_inicio: string;
    fecha_fin: string;
    lugar_visitar: string;
    kilometros_recorrer: number;
  }[];
  cupones: {
      cantidad: number;
      producto: string;
      denominacion: number;
      inicio: number;
      fin: number;
      subtotal: number;
  }[];
}

export default function SolicitudPrintModal({ isOpen, onClose, solicitudId }: Props) {
  const [datos, setDatos] = useState<DatosSolicitud | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && solicitudId) {
      setLoading(true);
      getDatosSolicitudImpresion(solicitudId)
        .then((data: any) => {
          if (data) setDatos(data);
          else {
            Swal.fire('Error', 'No se encontraron datos para esta solicitud.', 'warning');
            onClose();
          }
        })
        .catch((err) => {
          console.error(err);
          Swal.fire('Error', 'Error al cargar los datos.', 'error');
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, solicitudId]);

  const generatePdf = async () => {
    if (!printRef.current || !datos) return;
    setIsPrinting(true);
    try {
      const element = printRef.current;
      const dataUrl = await htmlToImage.toJpeg(element, { quality: 1.0, backgroundColor: '#ffffff', pixelRatio: 2.5 });
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: [8.5, 13] });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Solicitud_Comision_${datos.id}.pdf`);
    } catch (error) {
      console.error('Error generando PDF', error);
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const formatDate = (dateStr: string) => {
      if(!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('es-GT');
  }

  const getCargoYDireccion = (raw: string) => {
      if (!raw) return { direccion: '', cargo: '' };
      const parts = raw.split(' / ');
      if (parts.length >= 2) {
          return { direccion: parts[0], cargo: parts[1] };
      }
      return { direccion: parts[0], cargo: '' };
  };

  const { direccion, cargo } = datos ? getCargoYDireccion(datos.unidad_direccion) : { direccion: '', cargo: '' };
  const totalKm = datos?.detalles.reduce((acc, curr) => acc + (curr.kilometros_recorrer || 0), 0) || 0;
  const valorTotalCupones = datos?.cupones.reduce((acc, curr) => acc + curr.subtotal, 0) || 0;

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
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Formulario de Solicitud</DialogTitle>
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

        {/* CORRECCIÓN: 'items-start' permite el scroll en PC desde el inicio. 'justify-center' centra horizontalmente. */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center bg-gray-200/50 dark:bg-black/20">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 w-full gap-4 text-gray-500 m-auto">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <span>Cargando formato...</span>
                </div>
            ) : datos ? (
                // CORRECCIÓN: Quitamos 'm-auto' para evitar conflictos con items-start.
                // 'origin-top' asegura que al escalar se mantenga arriba y centrado.
                <div className="transform scale-[0.42] sm:scale-75 md:scale-100 origin-top h-fit mb-[-60%] sm:mb-[-20%] md:mb-0 transition-transform duration-200 shadow-2xl bg-white">
                    
                    <div ref={printRef} className="w-[816px] min-h-[1248px] bg-white text-black relative flex flex-col px-12 pb-12 box-border">
                        
                        {/* === ENCABEZADO === */}
                        <div className="flex justify-between items-center mb-2 border-b-2 border-[#0066CC] pb-2">
                            <div className="w-1/4 flex justify-start pl-2">
                                <img 
                                    src="/images/logo-muni.png" 
                                    alt="Logo" 
                                    className="h-[80px] object-contain" 
                                />
                            </div>
                            <div className="w-1/2 flex flex-col items-center text-center">
                                <h2 className="text-sm font-extrabold text-[#0066CC] uppercase leading-tight tracking-wide">
                                    Municipalidad de Concepción Las Minas
                                </h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase leading-tight">
                                    Departamento de Chiquimula, Guatemala C.A.
                                </p>
                            </div>
                            <div className="w-1/4 flex justify-end"></div>
                        </div>

                        {/* === TÍTULO === */}
                        <div className="w-full text-center mb-6">
                            <h1 className="text-xs font-bold uppercase text-black leading-tight">
                                FORMULARIO DE SOLICITUD DE COMBUSTIBLE POR COMISIÓN
                            </h1>
                        </div>

                        {/* LUGAR Y FECHA */}
                        <div className="flex justify-end items-end text-[11px] mb-4 gap-2 font-bold text-gray-800">
                            <span>CONCEPCIÓN LAS MINAS,</span>
                            <div className="border-b border-black min-w-[150px] text-center px-2">
                                {new Date(datos.created_at).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        {/* DATOS DEL SOLICITANTE */}
                        <div className="flex flex-col gap-2 text-[10px] uppercase font-bold text-gray-700 mb-4">
                            <div className="flex items-end w-full gap-2">
                                <span className="whitespace-nowrap">NOMBRE DEL SOLICITANTE:</span>
                                <div className="flex-1 border-b border-black px-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                    {datos.solicitante_nombre}
                                </div>
                            </div>
                            
                            <div className="flex items-end w-full gap-2 text-[9px]">
                                <span className="whitespace-nowrap">CARGO:</span>
                                <div className="flex-[0.6] border-b border-black px-1 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                    {cargo}
                                </div>
                                <span className="whitespace-nowrap ml-1">UNIDAD EJECUTORA/DIRECCIÓN:</span>
                                <div className="flex-1 border-b border-black px-1 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                    {direccion}
                                </div>
                            </div>

                            <div className="flex items-end w-full gap-2">
                                <span className="whitespace-nowrap">PARA CUMPLIMIENTO DE COMISIÓN EN: MUNICIPIO:</span>
                                <div className="flex-1 border-b border-black px-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                    {datos.municipio_destino}
                                </div>
                                <span className="whitespace-nowrap">DEPTO:</span>
                                <div className="flex-[0.6] border-b border-black px-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                    {datos.departamento_destino}
                                </div>
                            </div>
                        </div>

                        {/* DATOS DEL VEHÍCULO */}
                        <div className="border border-black rounded-sm p-1 mb-4">
                            <div className="bg-gray-200 text-center text-[10px] font-bold uppercase border-b border-black mb-2 py-0.5">
                                DATOS DEL VEHÍCULO:
                            </div>
                            <div className="grid grid-cols-1 gap-2 px-2 pb-2 text-[10px] font-bold uppercase text-gray-700">
                                <div className="flex items-end gap-2">
                                    <span className="whitespace-nowrap">TIPO DE VEHÍCULO ASIGNADO:</span>
                                    <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{datos.vehiculo.tipo}</div>
                                    <span className="whitespace-nowrap">No. DE PLACA:</span>
                                    <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{datos.vehiculo.placa}</div>
                                    <span className="whitespace-nowrap">MODELO:</span>
                                    <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{datos.vehiculo.modelo}</div>
                                </div>
                                <div className="flex items-end gap-2 mt-1">
                                    <span className="whitespace-nowrap">KILOMETRAJE INICIAL:</span>
                                    <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{datos.kilometraje_inicial}</div>
                                    <span className="whitespace-nowrap ml-8">TIPO DE COMBUSTIBLE:</span>
                                    <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{datos.vehiculo.combustible}</div>
                                </div>
                            </div>
                        </div>

                        {/* TABLA COMISIÓN */}
                        <div className="mb-2">
                            <div className="text-center text-[10px] font-bold uppercase mb-1">
                                DATOS DE LA COMISIÓN
                            </div>
                            <table className="w-full text-[10px] border-collapse border border-black">
                                <thead>
                                    <tr className="bg-blue-100/50 text-center font-bold">
                                        <th className="border border-black py-1 w-1/5" colSpan={2}>FECHA</th>
                                        <th className="border border-black py-1 w-2/5" rowSpan={2}>LUGARES A VISITAR</th>
                                        <th className="border border-black py-1 w-1/5" rowSpan={2}>KILOMETROS A<br/>RECORRER</th>
                                    </tr>
                                    <tr className="bg-blue-100/50 text-center font-bold">
                                        <th className="border border-black py-1">DEL</th>
                                        <th className="border border-black py-1">AL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.detalles.map((det, idx) => (
                                        <tr key={idx} className="text-center h-8">
                                            <td className="border border-black px-1">{formatDate(det.fecha_inicio)}</td>
                                            <td className="border border-black px-1">{formatDate(det.fecha_fin)}</td>
                                            <td className="border border-black px-1 text-left uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{det.lugar_visitar}</td>
                                            <td className="border border-black px-1">{det.kilometros_recorrer}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="border border-black text-right pr-2 font-bold uppercase py-1">
                                            TOTAL DE KILOMETROS A RECORRER:
                                        </td>
                                        <td className="border border-black text-center font-bold py-1">
                                            {totalKm}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* JUSTIFICACIÓN */}
                        <div className="flex flex-col gap-1 mb-6">
                            <div className="flex items-end w-full gap-2 text-[10px] uppercase font-bold text-gray-700">
                                <span className="whitespace-nowrap">JUSTIFICACIÓN:</span>
                                <div className="flex-1 border-b border-black px-2 text-black italic normal-case text-xs leading-tight pb-1">
                                    {datos.justificacion}
                                </div>
                            </div>
                        </div>

                        {/* FIRMAS SUPERIORES */}
                        <div className="flex justify-between items-start px-4 mb-6 mt-10">
                            <div className="flex-1 text-center flex flex-col items-center">
                                <div className="w-[80%] border-t border-black pt-1">
                                    <p className="text-[10px] font-bold uppercase text-gray-700">FIRMA DEL SOLICITANTE</p>
                                </div>
                            </div>
                            <div className="flex-1 text-center flex flex-col items-center">
                                <div className="w-[80%] border-t border-black pt-1">
                                    <p className="text-[10px] font-bold uppercase text-gray-700">FIRMA JEFE DE DEPARTAMENTO/DIRECCIÓN SOLICITANTE</p>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN USO EXCLUSIVO MUNICIPAL */}
                        <div className="border border-black bg-gray-50/50 p-2 text-[10px]">
                            <div className="text-center font-bold uppercase mb-2 text-xs">PARA USO EXCLUSIVO MUNICIPAL</div>
                            
                            <div className="flex justify-between mb-3 px-2 gap-8">
                                <div className="flex items-end gap-2 w-1/2">
                                    <span className="font-bold uppercase whitespace-nowrap">KMS AUTORIZADOS:</span>
                                    <div className="flex-1 border-b border-black text-center font-mono">
                                    {datos.cupones.length > 0 ? totalKm : ''}
                                    </div>
                                </div>
                                <div className="flex items-end gap-2 w-1/2">
                                    <span className="font-bold uppercase whitespace-nowrap">
                                        TIPO DE COMBUSTIBLE:
                                    </span>
                                    <div className="flex-1 border-b border-black text-center font-mono">
                                        {datos.vehiculo.combustible ? datos.vehiculo.combustible.toUpperCase() : ''}
                                    </div>
                                </div>
                            </div>

                            <table className="w-full border-collapse border border-black mb-2">
                                <thead className="bg-blue-100/30 text-center font-bold uppercase">
                                    <tr>
                                        <th rowSpan={2} className="border border-black py-1 w-[20%]">Denominación</th>
                                        <th rowSpan={2} className="border border-black py-1 w-[20%]">Cantidad Asignada</th>
                                        <th rowSpan={2} className="border border-black py-1 w-[20%]">Total</th>
                                        <th colSpan={2} className="border border-black py-1 w-[40%]">Correlativo</th>
                                    </tr>
                                    <tr>
                                        <th className="border border-black py-1 w-[20%]">De</th>
                                        <th className="border border-black py-1 w-[20%]">Al</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.cupones.length > 0 ? (
                                        datos.cupones.map((c, idx) => (
                                            <tr key={idx} className="text-center font-mono text-[9px] h-6">
                                                <td className="border border-black">Q.{c.denominacion}</td>
                                                <td className="border border-black">{c.cantidad}</td>
                                                <td className="border border-black">Q.{c.subtotal.toFixed(2)}</td>
                                                <td className="border border-black">{c.inicio}</td>
                                                <td className="border border-black">{c.fin}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <>
                                            <tr className="h-6"><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td></tr>
                                            <tr className="h-6"><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td></tr>
                                        </>
                                    )}
                                    <tr className="font-bold bg-gray-100">
                                        <td colSpan={2} className="border border-black text-right pr-2 py-1 uppercase">Valor Total</td>
                                        <td className="border border-black text-center">Q. {valorTotalCupones > 0 ? valorTotalCupones.toFixed(2) : ''}</td>
                                        <td colSpan={2} className="border border-black bg-gray-200"></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Footer Exclusivo */}
                            <div className="mt-4 mb-2 px-2">
                                <div className="flex items-end gap-2"> 
                                    <span className="text-[9px] font-bold uppercase mb-6 whitespace-nowrap">ELABORADO POR (F):</span>
                                    <div className="flex flex-col items-start w-48"> 
                                        <div className="w-full border-b border-black"></div>
                                        <span className="text-[9px] font-bold uppercase mt-1 text-left">
                                            {datos.aprobador}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase text-left text-gray-600">
                                            ENCARGADO DE ENTREGA DE CUPONES
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* === SECCIÓN PIE DE PÁGINA (RECIBÍ CONFORME) === */}
                        <div className="mt-12 text-[10px] font-bold uppercase text-gray-700">
                            <div className="flex items-end gap-2 mb-4">
                                <span className="whitespace-nowrap">RECIBÍ CONFORME NUMERO DE CUPON:</span>
                                <div className="border-b border-black w-32"></div> 
                                
                                <span className="whitespace-nowrap ml-4">POR UN VALOR DE:</span>
                                <div className="flex-1 border-b border-black text-center text-black pb-2">
                                    Q. {valorTotalCupones > 0 ? valorTotalCupones.toFixed(2) : ''}
                                </div>
                            </div>

                            <div className="flex items-end gap-2 mb-4">
                                <span className="whitespace-nowrap w-16">NOMBRE:</span>
                                <div className="flex-1 border-b border-black px-2 text-black pb-2">
                                    {datos.solicitante_nombre}
                                </div>
                                
                                <span className="whitespace-nowrap w-12 ml-4">FIRMA:</span>
                                <div className="flex-1 border-b border-black"></div>
                            </div>

                            <div className="flex items-end gap-2">
                                <span className="whitespace-nowrap w-16">DPI:</span>
                                <div className="flex-1 border-b border-black px-2 text-black pb-2">
                                    {datos.solicitante_dpi}
                                </div>
                                
                                <span className="whitespace-nowrap w-12 ml-4">FECHA:</span>
                                <div className="flex-1 border-b border-black px-2 text-black text-center pb-2">
                                    {new Date(datos.created_at).toLocaleDateString('es-GT')}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="text-red-500 font-bold">No se encontraron datos.</div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}