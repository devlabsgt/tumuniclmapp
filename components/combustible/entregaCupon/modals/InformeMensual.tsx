'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, FileText, Loader2 } from 'lucide-react';
import { generarPdfMensualOficinas } from '../lib/ReporteMensual';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  datos: any; 
  mesNombre: string;
}

export default function InformeMensualModal({ isOpen, onClose, datos, mesNombre }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    await generarPdfMensualOficinas(datos, mesNombre);
    setIsGenerating(false);
  };

  const oficinas = Object.keys(datos);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 bg-slate-100 dark:bg-neutral-900 border-none overflow-hidden">
        
        <DialogHeader className="p-4 bg-white dark:bg-neutral-800 border-b flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600">
                <FileText size={20} />
             </div>
             <div className="flex flex-col text-left">
                <DialogTitle className="text-lg font-bold">Vista Previa de Informe Oficial</DialogTitle>
             </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={onClose} className="gap-2">
                <X size={18} /> <span className="hidden sm:inline">Cerrar</span>
             </Button>
             <Button onClick={handleDownload} disabled={isGenerating} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                <span className="hidden sm:inline">Generar PDF Oficial</span>
             </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 md:p-12 bg-gray-200/50 dark:bg-black/20">
            
            <div className="w-fit mx-auto transform scale-[0.42] origin-top-left sm:scale-75 sm:origin-top md:scale-100 md:origin-top transition-transform duration-200 flex flex-col gap-12 mb-[-60%] sm:mb-[-20%] md:mb-0">
                
                {oficinas.map((oficina) => {
                    const infoOficina = datos[oficina];

                    return (
                        <div key={oficina} className="w-[816px] min-h-[1247px] bg-white shadow-2xl p-20 text-black flex flex-col relative leading-tight">
                            
                            <div className="flex justify-between items-start mb-12">
                                
                                <div className="flex justify-start -mt-10"> 
                                    <img 
                                        src="/images/logo-muni.png" 
                                        alt="Logo" 
                                        className="h-[100px] object-contain" 
                                    />
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-[11px] text-black mb-1">
                                        INFORME No. {infoOficina.informeNo || 'T3208-XXX-2026'}.
                                    </p>
                                    <p className="text-[11px] text-black">
                                        Concepción Las Minas, Chiquimula.
                                    </p>
                                    <p className="text-[11px] text-black">
                                        {new Date().toLocaleDateString('es-GT', { day: 'numeric' })} de {mesNombre.toLowerCase()} del año 2,026.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8 text-[11px] font-bold space-y-0.5">
                                <p>NELBIA SUCELY DUARTE RAMOS</p>
                                <p>DIRECTORA DAFIM</p>
                                <p>DIRECCIÓN DE ADMINISTRACIÓN FINANCIERA INTEGRADA MUNICIPAL</p>
                                <p>MUNICIPALIDAD DE CONCEPCIÓN LAS MINAS, CHIQUIMULA.</p>
                            </div>

                            <p className="text-[11px] mb-6">Reciba un Cordial Saludo,</p>

                            <p className="text-[11px] mb-8 text-justify leading-relaxed">
                                Por medio de la Presente me permito Trasladarle el informe sobre los cupones de combustibles consumidos para el funcionamiento de planes, programas y proyectos para el año 2026, correspondientes al mes de <strong>{mesNombre.toUpperCase()}</strong> para iniciar el proceso de pago de factura.
                            </p>

                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead>
                                    <tr className="bg-blue-100/50 border-b border-black">
                                        <th colSpan={6} className="p-3 text-center font-bold uppercase leading-tight text-[#0066CC]">
                                            {oficina}
                                        </th>
                                    </tr>
                                    <tr className="bg-blue-50 border-b border-black font-bold">
                                        <th className="border-r border-black p-2 w-8 text-center">No.</th>
                                        <th className="border-r border-black p-2 text-center uppercase">Número de Correlativo</th>
                                        <th className="border-r border-black p-2 text-center uppercase">Cantidad</th>
                                        <th className="border-r border-black p-2 text-center uppercase">Vehículo</th>
                                        <th className="border-r border-black p-2 text-center uppercase">Fecha</th>
                                        <th className="p-2 text-center uppercase">Tipo de Combustible</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {infoOficina.items.map((d: any, i: number) => (
                                        <tr key={i} className="border-b border-black">
                                            <td className="border-r border-black p-2 text-center">{i + 1}</td>
                                            <td className="border-r border-black p-2 text-center font-mono font-bold">
                                                {d.correlativoInicio && d.correlativoFin 
                                                    ? (d.correlativoInicio === d.correlativoFin ? d.correlativoInicio : `${d.correlativoInicio} al ${d.correlativoFin}`)
                                                    : '---'}
                                            </td>
                                            <td className="border-r border-black p-2 text-center whitespace-nowrap">Q{d.monto.toFixed(2)}</td>
                                            <td className="border-r border-black p-2 text-center uppercase font-medium">{d.placa}</td>
                                            <td className="border-r border-black p-2 text-center">{d.fecha}</td>
                                            <td className="p-2 text-center uppercase font-bold">{d.tipo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="font-bold border-t border-black">
                                    <tr>
                                        <td colSpan={2} className="border-r border-black p-2 text-left uppercase bg-gray-50">CANTIDAD TOTAL:</td>
                                        <td className="border-r border-black p-2 text-center bg-gray-50">
                                            Q{infoOficina.items.reduce((acc: number, curr: any) => acc + curr.monto, 0).toFixed(2)}
                                        </td>
                                        <td colSpan={3} className="p-2"></td>
                                    </tr>
                                </tfoot>
                            </table>

                            <p className="text-[11px] mt-8 mb-20">Sin otro particular, muy atentamente,</p>

                            <div className="mt-auto flex flex-col items-center gap-1">
                                <p className="text-[11px] font-bold uppercase">Diana Raquel Martínez Mejía</p>
                                <p className="text-[11px] font-bold uppercase">Oficial II de la Dirección de Secretaría Municipal</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}