'use client'

import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getDatosLoteMasivo } from '../lib/actions';
import { Loader2, Printer, X, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    loteId: number;
}

export default function InformeLoteMasivo({ isOpen, onClose, loteId }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && loteId) {
            setLoading(true);
            getDatosLoteMasivo(loteId).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [isOpen, loteId]);

    const handleAction = async (action: 'download' | 'print') => {
        if (!printRef.current || !data) return;

        setIsPrinting(true);
        try {
            const element = printRef.current;
            // Aumentamos pixelRatio para mejor calidad en impresión masiva
            const dataUrl = await htmlToImage.toJpeg(element, {
                quality: 1.0,
                backgroundColor: '#ffffff',
                pixelRatio: 2.5
            });

            // Oficio Landscape: 13 x 8.5 pulgadas
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [13, 8.5]
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            if (action === 'print') {
                pdf.autoPrint();
                const blob = pdf.output('bloburl');
                window.open(blob, '_blank');
            } else {
                pdf.save(`Liquidacion_General_M-${data.loteCorrelativo}.pdf`);
                Swal.fire({
                    title: '¡Descargado!',
                    text: 'El documento ha sido generado con éxito.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error generando documento', error);
            Swal.fire('Error', 'No se pudo generar el documento', 'error');
        } finally {
            setIsPrinting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-[1300px] bg-slate-100 dark:bg-neutral-900 border-none shadow-2xl p-0 flex flex-col h-[90vh] overflow-hidden [&>button]:hidden">

                <DialogHeader className="p-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                            <FileText size={20} />
                        </div>
                        <div className="flex flex-col text-left">
                            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Formulario de Liquidación General</DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400">#{data?.loteCorrelativo || '---'} — Vista previa</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleAction('print')}
                            disabled={loading || isPrinting || !data}
                            className="hidden sm:flex gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30 font-bold px-4"
                        >
                            {isPrinting ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                            Imprimir Directo
                        </Button>

                        <Button
                            onClick={() => handleAction('download')}
                            disabled={loading || isPrinting || !data}
                            className="flex gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-neutral-700 dark:hover:bg-neutral-600 font-bold shadow-md px-3 sm:px-4"
                        >
                            {isPrinting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            <span className="hidden sm:inline">Descargar PDF</span>
                        </Button>

                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center bg-gray-500 dark:bg-neutral-950">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center text-white gap-3 h-full">
                            <Loader2 size={32} className="animate-spin text-blue-400" />
                            <p className="font-medium">Cargando Documento...</p>
                        </div>
                    ) : data ? (
                        <div className="transform scale-[0.5] sm:scale-75 md:scale-100 origin-top h-fit transition-transform duration-200 shadow-2xl bg-white mb-8">
                            <div ref={printRef} className="w-[1248px] min-h-[816px] text-black bg-white px-10 py-8 relative flex flex-col box-border">

                                {/* Header con Logos Copiado */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="w-[20%] flex justify-start">
                                        <img
                                            src="/images/logo-muni.png"
                                            alt="Logo"
                                            className="h-[90px] object-contain"
                                        />
                                    </div>
                                    <div className="w-[60%] flex flex-col items-center text-center mt-2">
                                        <h2 className="text-2xl font-bold text-center text-[#204184] leading-tight tracking-tight uppercase">
                                            Municipalidad de Concepción Las Minas
                                        </h2>
                                        <p className="text-[12px] font-bold text-blue-600 leading-tight mb-2 whitespace-nowrap">
                                            Departamento de Chiquimula, Guatemala C.A. | TEL: 7943-5619 - CEL: 4790-2524
                                        </p>
                                        {/* Barra Segmentada solo para el centro */}
                                        <div className="w-full h-[4.5px] flex rounded-full overflow-hidden">
                                            <div className="w-1/4 h-full bg-[#204184]"></div>
                                            <div className="w-1/4 h-full bg-[#366ac9]"></div>
                                            <div className="w-1/4 h-full bg-[#68a6f2]"></div>
                                            <div className="w-1/4 h-full bg-[#c2dafb]"></div>
                                        </div>
                                    </div>

                                    <div className="w-[20%] flex flex-col justify-center items-end pr-2">
                                        <h3 className="text-2xl font-bold text-red-600 font-mono">
                                            No. {data.loteCorrelativo}
                                        </h3>
                                    </div>
                                </div>

                                <div className="w-full text-center mb-6">
                                    <h1 className="text-md font-bold uppercase text-black leading-tight underline decoration-2 underline-offset-4">
                                        FORMULARIO GENERAL DE LIQUIDACIÓN DE CUPONES DE COMBUSTIBLE POR TRABAJOS MUNICIPALES
                                    </h1>
                                </div>

                                <div className="flex flex-col gap-3 text-[12px] uppercase font-bold text-gray-800 px-2 mb-6">
                                    <div className="flex items-end w-full gap-2">
                                        <span className="whitespace-nowrap">NOMBRE DE QUIEN LIQUIDA:</span>
                                        <div className="flex-1 text-black px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {data.creadorNombre}
                                        </div>
                                    </div>

                                    <div className="flex items-end w-full gap-4 mt-1">
                                        <div className="flex items-end w-[45%] gap-2">
                                            <span className="whitespace-nowrap">CARGO:</span>
                                            <div className="flex-1 text-black px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {data.creadorCargo}
                                            </div>
                                        </div>
                                        <div className="flex items-end w-[55%] gap-2">
                                            <span className="whitespace-nowrap">UNIDAD / DIRECCIÓN:</span>
                                            <div className="flex-1 text-black px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {data.creadorDireccion}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full text-[9px] border-collapse border border-black bg-white mt-1">
                                    <thead className="bg-[#eff6ff] font-bold uppercase border-b border-black">
                                        <tr>
                                            <th className="border-r border-black p-1.5 align-middle h-8 w-[4%]">No.</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[5%]">No. Sol.</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[5%]">No. Liq.</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[9%]">Empleado</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[10%]">No de Cupón</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[6%]">Valor Q.</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[8%]">Modelo</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[13%]">Destino</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[7%]">Fecha</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[7%]">Tipo<br />Combust.</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[7%]">H/Km<br />Inicial</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[7%]">H/Km<br />Final</th>
                                            <th className="border-r border-black p-1.5 align-middle w-[6%]">Total<br />Diferencia</th>
                                            <th className="p-1.5 align-middle w-[6%]">Placa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="border-b border-black">
                                                <td className="border-r border-black p-1.5 text-center">{idx + 1}</td>
                                                <td className="border-r border-black p-1.5 text-center font-bold text-gray-700">{item.id_solicitud || '---'}</td>
                                                <td className="border-r border-black p-1.5 text-center text-gray-600">{item.id_liquidacion || '---'}</td>
                                                <td className="border-r border-black p-1.5"></td>
                                                <td className="border-r border-black p-1.5 text-center font-mono">{item.no_cupon}</td>
                                                <td className="border-r border-black p-1.5 text-center font-bold">Q {item.valor_q.toFixed(2)}</td>
                                                <td className="border-r border-black p-1.5 text-center truncate">{item.modelo}</td>
                                                <td className="border-r border-black p-1.5 text-center">{item.destino}</td>
                                                <td className="border-r border-black p-1.5 text-center">{item.fecha}</td>
                                                <td className="border-r border-black p-1.5 text-center">{item.tipo_combustible}</td>
                                                <td className="border-r border-black p-1.5 text-center">
                                                    {item.inicial_val === 0 ? "NO FUNCIONA" : item.inicial_val}
                                                </td>
                                                <td className="border-r border-black p-1.5 text-center">
                                                    {item.final_val === 0 ? "NO FUNCIONA" : item.final_val}
                                                </td>
                                                <td className="border-r border-black p-1.5 text-center font-bold">
                                                    {item.diferencia_val === 0 && (item.inicial_val === 0 || item.final_val === 0) ? '---' : `${item.diferencia_val} ${item.is_maquina ? 'HRS' : 'KM'}`}
                                                </td>
                                                <td className="p-1.5 text-center whitespace-nowrap">{item.placa}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-white">Error cargando el formato...</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
