'use client';

import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, X, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { useDetalleImpresion } from '../hook';
import Swal from 'sweetalert2';
import { formatFechaLarga, formatFechaDateOnly } from '../dateUtils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    solicitudId: number | null;
    fechaComisionOverride?: string;
    kmFinalOverride?: number;
    correlativoOverride?: number;
}

export default function InformeLiquidacionCupones({ isOpen, onClose, solicitudId, fechaComisionOverride, kmFinalOverride, correlativoOverride }: Props) {
    const { data: datos, isLoading: loading, refetch } = useDetalleImpresion(solicitudId || 0);

    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isOpen && solicitudId) {
            refetch();
        }
    }, [isOpen, solicitudId]);

    const handleAction = async (action: 'download' | 'print') => {
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

            if (action === 'print') {
                pdf.autoPrint();
                const blob = pdf.output('bloburl');
                window.open(blob, '_blank');
            } else {
                pdf.save(`Liquidacion_Comision_${datos.id}.pdf`);
            }
        } catch (error) {
            console.error('Error generando documento', error);
            Swal.fire('Error', 'No se pudo generar el documento', 'error');
        } finally {
            setIsPrinting(false);
        }
    };

    const safeDatos = datos as any;
    if (!isOpen) return null;

    const getCargoYDireccion = (raw: string) => {
        if (!raw) return { direccion: '', cargo: '' };
        const parts = raw.split(' / ');
        if (parts.length >= 2) {
            return { direccion: parts[0], cargo: parts[1] };
        }
        return { direccion: parts[0], cargo: '' };
    };

    const { cargo, direccion } = getCargoYDireccion(safeDatos?.unidad_direccion);
    const isMaquinaria = safeDatos?.vehiculo?.tipo?.toUpperCase().includes('MAQUINARIA');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 bg-gray-100 dark:bg-neutral-900 text-black border-none overflow-hidden [&>button]:hidden">

                <DialogHeader className="p-4 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                            <FileText size={20} />
                        </div>
                        <div className="flex flex-col text-left">
                            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Hoja de Liquidación</DialogTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400">#{safeDatos?.id || '---'} — Vista previa</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleAction('print')}
                            disabled={loading || isPrinting || !safeDatos}
                            className="hidden sm:flex gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30"
                        >
                            {isPrinting ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                            <span className="hidden sm:inline">Imprimir Directo</span>
                        </Button>
                        <Button
                            onClick={() => handleAction('download')}
                            disabled={loading || isPrinting || !safeDatos}
                            className="bg-slate-900 text-white hover:bg-slate-800 gap-2"
                        >
                            {isPrinting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            <span className="hidden sm:inline">Descargar PDF</span>
                        </Button>
                        <Button variant="outline" onClick={onClose} disabled={isPrinting} className="dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700">
                            <X size={18} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center bg-gray-200/50 dark:bg-black/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 w-full gap-4 text-gray-500 m-auto">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                            <span>Cargando formato...</span>
                        </div>
                    ) : safeDatos ? (
                        <div className="transform scale-[0.42] sm:scale-75 md:scale-100 origin-top h-fit mb-[-60%] sm:mb-[-20%] md:mb-0 transition-transform duration-200 shadow-2xl bg-white">

                            <div ref={printRef} className="w-[816px] min-h-[1248px] bg-white text-black relative flex flex-col px-12 pt-1 pb-12 box-border">

                                {/* Header con Logos */}
                                <div className="flex justify-between items-center mb-1 pb-1">
                                    <div className="w-[30%] mt-5 flex justify-start pl-2">
                                        <img
                                            src="/images/logo-muni.png"
                                            alt="Logo"
                                            className="h-[100px] object-contain"
                                        />
                                    </div>
                                    <div className="w-[55%] mt-5 flex flex-col items-center text-center">
                                        <h2 className="text-xl font-bold text-center text-[#204184] leading-tight tracking-tight">
                                            Municipalidad de Concepción Las Minas
                                        </h2>
                                        <p className="text-[10px] font-bold text-blue-600 leading-tight mb-2 whitespace-nowrap">
                                            Departamento de Chiquimula, Guatemala C.A. | TEL: 7943-5619 - CEL: 4790-2524
                                        </p>
                                        {/* Barra Segmentada solo para el centro */}
                                        <div className="w-full h-[3.5px] flex rounded-full overflow-hidden">
                                            <div className="w-1/4 h-full bg-[#204184]"></div>
                                            <div className="w-1/4 h-full bg-[#366ac9]"></div>
                                            <div className="w-1/4 h-full bg-[#68a6f2]"></div>
                                            <div className="w-1/4 h-full bg-[#c2dafb]"></div>
                                        </div>
                                    </div>

                                    <div className="w-[15%] flex justify-end items-center pr-2">
                                        <h3 className="text-xl font-bold text-red-600 font-mono">
                                            No. {correlativoOverride ?? safeDatos.liquidacion?.correlativo ?? '---'}
                                        </h3>
                                    </div>
                                </div>

                                <div className="w-full text-center mt-2 mb-6">
                                    <h1 className="text-xs font-bold uppercase text-black leading-tight">
                                        FORMULARIO DE LIQUIDACIÓN DE CUPONES DE COMBUSTIBLE
                                    </h1>
                                </div>

                                <div className="flex justify-end items-end text-[11px] mb-4 gap-2 font-bold text-gray-800">
                                    <span>FECHA DE COMISIÓN:</span>
                                    <div className="min-w-[150px] border-b border-black text-center px-2 h-4">
                                        &nbsp;
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 text-[10px] uppercase font-bold text-gray-700 mb-4 px-4">
                                    <div className="flex items-end w-full gap-2 text-[11px]">
                                        <span className="whitespace-nowrap">SOLICITUD DE COMBUSTIBLE No.</span>
                                        <div className="flex-1 px-2 text-black">
                                            {safeDatos.correlativo || safeDatos.id}
                                        </div>
                                    </div>
                                    <div className="flex items-end w-full gap-2">
                                        <span className="whitespace-nowrap">NOMBRE DE QUIEN LIQUIDA:</span>
                                        <div className="flex-1 px-2 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                            {safeDatos.solicitante_nombre}
                                        </div>
                                    </div>

                                    <div className="flex items-end w-full gap-2 text-[10px]">
                                        <span className="whitespace-nowrap">CARGO:</span>
                                        <div className="flex-1 px-1 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                            {cargo}
                                        </div>
                                    </div>

                                    <div className="flex items-end w-full gap-2 text-[10px]">
                                        <span className="whitespace-nowrap">UNIDAD / DIRECCIÓN:</span>
                                        <div className="flex-1 px-1 text-black whitespace-nowrap overflow-hidden text-ellipsis">
                                            {direccion}
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-black rounded-sm p-1 mb-4">
                                    <div className="bg-gray-200 text-center text-[10px] font-bold uppercase border-b border-black mb-2 py-0.5">
                                        DATOS DEL VEHÍCULO:
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 px-2 pb-2 text-[10px] font-bold uppercase text-gray-700">
                                        <div className="flex items-end gap-2">
                                            <span className="whitespace-nowrap">TIPO DE VEHÍCULO ASIGNADO:</span>
                                            <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{safeDatos.vehiculo.tipo}</div>
                                            <span className="whitespace-nowrap">No. DE PLACA:</span>
                                            <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{safeDatos.vehiculo.placa}</div>
                                            <span className="whitespace-nowrap">MODELO:</span>
                                            <div className="flex-1 border-b border-black px-2 text-black text-center whitespace-nowrap">{safeDatos.vehiculo.modelo}</div>
                                        </div>
                                        <div className="flex items-end gap-2 mt-2 text-[11px]">
                                            <div className="flex gap-2 w-1/3">
                                                <span>{isMaquinaria ? 'HORÓMETRO' : 'KILOMETRAJE'} INICIAL:</span>
                                                <div className="flex-1 border-b border-black text-center">
                                                    {safeDatos.kilometraje_inicial === 0
                                                        ? (isMaquinaria ? 'NO POSEE' : 'NO POSEE')
                                                        : safeDatos.kilometraje_inicial}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-1/3">
                                                <span>{isMaquinaria ? 'HORÓMETRO' : 'KILOMETRAJE'} FINAL:</span>
                                                <div className="flex-1 border-b border-black text-center">&nbsp;</div>
                                            </div>
                                            <div className="flex gap-2 w-1/3 text-red-700 font-bold">
                                                <span>TOTAL {isMaquinaria ? 'HORAS' : 'RECORRIDO'}:</span>
                                                <div className="flex-1 border-b border-black text-center">&nbsp;</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla Firma Autoridad */}
                                <div className="w-full text-center text-[10px] font-bold uppercase mb-1 mt-2">
                                    NOMBRE, FIRMA Y SELLO DE AUTORIDAD LOCAL (DE LOS LUGARES QUE VISITÓ)
                                </div>
                                <div className="w-full border border-black mb-6">
                                    <table className="w-full text-[10px] border-collapse bg-white">
                                        <thead className="bg-blue-100/50 font-bold uppercase border-b border-black">
                                            <tr>
                                                <th className="border-r border-black p-1.5 w-1/4 h-8 text-center">NOMBRE</th>
                                                <th className="border-r border-black p-1.5 w-1/4 text-center">CARGO</th>
                                                <th className="border-r border-black p-1.5 w-1/4 text-center">FIRMA</th>
                                                <th className="p-1.5 w-1/4 text-center">SELLO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td className="border-b border-black border-r p-4 h-10"></td><td className="border-b border-black border-r p-4 h-10"></td><td className="border-b border-black border-r p-4 h-10"></td><td className="border-b border-black p-4 h-10"></td></tr>
                                            <tr><td className="border-b border-black border-r p-4 h-10"></td><td className="border-b border-black border-r p-4 h-10"></td><td className="border-b border-black border-r p-4 h-10"></td><td className="border-b border-black p-4 h-10"></td></tr>
                                            <tr><td className="border-r border-black p-4 h-10"></td><td className="border-r border-black p-4 h-10"></td><td className="border-r border-black p-4 h-10"></td><td className="p-4 h-10"></td></tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Tabla Cupones */}
                                <div className="w-full text-center text-[11px] font-bold uppercase mb-1">
                                    CUPONES DE COMBUSTIBLE ASIGNADOS
                                </div>
                                <div className="w-full mb-6">
                                    <table className="w-full text-[10px] border-collapse border border-black bg-white">
                                        <thead className="bg-blue-100/50 font-bold uppercase border-b border-black">
                                            <tr>
                                                <th className="border-r border-black p-1.5 align-middle h-8">DENOMINACIÓN</th>
                                                <th className="border-r border-black p-1.5 align-middle">CANTIDAD ASIGNADA</th>
                                                <th className="border-r border-black p-1.5 w-24">TOTAL</th>
                                                <th className="p-1.5 flex-[2]">No. DE VALE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {safeDatos.cupones?.map((c: any, i: number) => (
                                                <tr key={i} className="border-b border-black">
                                                    <td className="border-r border-black p-1.5 text-center font-bold">Q {c.denominacion}</td>
                                                    <td className="border-r border-black p-1.5 text-center">{c.cantidad}</td>
                                                    <td className="border-r border-black p-1.5 text-center font-bold">Q {c.subtotal}</td>
                                                    <td className="p-1.5 text-center font-mono">
                                                        {c.inicio} - {c.fin}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!safeDatos.cupones || safeDatos.cupones.length === 0) && (
                                                <tr>
                                                    <td className="border-r border-black p-1.5 text-center h-6"></td>
                                                    <td className="border-r border-black p-1.5 text-center h-6"></td>
                                                    <td className="border-r border-black p-1.5 text-center h-6"></td>
                                                    <td className="p-1.5 text-center h-6"></td>
                                                </tr>
                                            )}
                                            {/* Fila de TOTALES */}
                                            <tr className="bg-blue-100/30 font-bold text-[11px] border-y-2 border-black">
                                                <td colSpan={2} className="text-right p-1.5 pr-4 border-r border-black border-collapse h-8">TOTAL ASIGNADO:</td>
                                                <td className="p-1.5 text-center border-r border-black text-black">
                                                    Q {safeDatos.cupones ? safeDatos.cupones.reduce((acc: number, curr: any) => acc + curr.subtotal, 0) : 0}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Devolución Vales - Tablas juntas */}
                                <div className="flex w-full mt-4 justify-between">
                                    <div className="w-[32%] text-[10px] uppercase font-bold text-gray-800">
                                        <span className="lowercase font-normal">Adjunte los siguientes documentos:</span>
                                        <div className="flex items-center gap-3 mt-4 text-[9px]">
                                            <div className="w-[20px] h-[32px] border border-black flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                <div className="w-full h-full text-white text-[6px]">.</div>
                                            </div>
                                            <span className="w-[150px]">VALES DE COMBUSTIBLE NO UTILIZADOS</span>
                                        </div>
                                    </div>

                                    <div className="w-[65%]">
                                        <div className="text-center text-[10px] font-bold uppercase mb-1">
                                            devolución de vales de combustible no utilizados
                                        </div>
                                        <table className="w-full text-[9px] border-collapse border border-black bg-white">
                                            <thead className="bg-blue-100/50 font-bold uppercase">
                                                <tr>
                                                    <th className="border-b border-r border-black p-1 h-6">CANTIDAD</th>
                                                    <th className="border-b border-r border-black p-1">CANTIDAD ASIGNADA</th>
                                                    <th className="border-b border-r border-black p-1 w-16">TOTAL</th>
                                                    <th className="border-b border-black p-1">CORRELATIVO</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr><td className="border-b border-r border-black p-1.5 h-6"></td><td className="border-b border-r border-black p-1.5 h-6"></td><td className="border-b border-r border-black p-1.5 h-6"></td><td className="border-b border-black p-1.5 h-6"></td></tr>
                                                <tr><td className="border-b border-r border-black p-1.5 h-6"></td><td className="border-b border-r border-black p-1.5 h-6"></td><td className="border-b border-r border-black p-1.5 h-6"></td><td className="border-b border-black p-1.5 h-6"></td></tr>
                                                <tr><td className="border-r border-black p-1 font-bold bg-blue-100/30 h-6">TOTAL</td><td className="border-r border-black p-1 bg-blue-100/30 h-6"></td><td className="border-r border-black p-1"></td><td className="p-1"></td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Firmas */}
                                <div className="w-full flex-grow flex flex-col justify-end mt-12 mb-4 relative">

                                    {/* Fecha lado izquierdo */}
                                    <div className="absolute w-[48%] flex gap-2 items-end bottom-[230px] left-0 text-[11px] font-bold text-gray-800">
                                        <span className="whitespace-nowrap">FECHA DE LIQUIDACIÓN:</span>
                                        <div className="flex-1 border-b border-black text-center px-1 whitespace-nowrap h-4">
                                            &nbsp;
                                        </div>
                                    </div>

                                    <div className="w-full flex flex-col gap-14 mt-16 text-[10px] uppercase font-bold text-black border-none">
                                        <div className="flex justify-between w-full px-4 items-end">
                                            <div className="w-[40%] flex flex-col border-t border-black text-center pt-1">
                                                FIRMA COMISIONADO
                                            </div>
                                        </div>
                                        <div className="flex justify-center w-full">
                                            <div className="w-[40%] flex flex-col text-center font-bold mt-2">
                                                RECIBE LIQUIDACIÓN
                                            </div>
                                        </div>
                                        <div className="flex justify-start w-full px-4 mb-2">
                                            <div className="w-[45%] flex flex-col border-t border-black text-center pt-1">
                                                ENCARGADO DE ENTREGA DE CUPONES
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="m-auto text-gray-500">No hay datos para esta solicitud.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}