'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Camera, LogOut, Clock, CalendarDays, Users, StickyNote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toBlob } from 'html-to-image';
import Swal from 'sweetalert2';

interface VerComisionesProps {
  comisiones: ComisionConFechaYHoraSeparada[];
  usuarios: Usuario[];
  onClose: () => void;
}

// Utilidad optimizada para formatear nombres
const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  if (!user?.nombre) return 'Desconocido';

  const parts = user.nombre.trim().split(/\s+/);
  if (parts.length <= 2) return user.nombre;

  // Lógica simplificada de nombres comunes
  const preposiciones = new Set(['de', 'del', 'la', 'los', 'las']);
  
  if (parts.length === 3) {
    return preposiciones.has(parts[1].toLowerCase()) ? user.nombre : `${parts[0]} ${parts[2]}`;
  }
  if (parts.length === 4) {
    return preposiciones.has(parts[1].toLowerCase()) 
      ? `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}` 
      : `${parts[0]} ${parts[2]}`;
  }
  return `${parts[0]} ${parts[2]}`; // Default fallback
};

export default function VerComisiones({ comisiones, usuarios, onClose }: VerComisionesProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Memorización de notas para evitar recálculos
  const { notasGenerales, notasPorComision } = useMemo(() => {
    const conteo = new Map<string, number>();
    const notasSet = new Set<string>();

    comisiones.forEach(c => c.comentarios?.forEach(nota => 
      conteo.set(nota, (conteo.get(nota) || 0) + 1)
    ));

    conteo.forEach((count, nota) => { if (count > 1) notasSet.add(nota); });

    const mapNotas = new Map<string, string[]>();
    comisiones.forEach(c => {
      const unicas = c.comentarios?.filter(n => !notasSet.has(n)) || [];
      if (unicas.length > 0) mapNotas.set(c.id, unicas);
    });

    return { notasGenerales: Array.from(notasSet), notasPorComision: mapNotas };
  }, [comisiones]);

  // Agrupación optimizada
  const comisionesAgrupadas = useMemo(() => {
    return comisiones.reduce((acc, c) => {
      const fecha = format(parseISO(c.fecha_hora.replace(' ', 'T')), 'EEEE, d MMMM yyyy', { locale: es });
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(c);
      return acc;
    }, {} as { [key: string]: ComisionConFechaYHoraSeparada[] });
  }, [comisiones]);
  
  const handleExportar = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    const logo = document.getElementById('export-logo-container');
    if (logo) logo.classList.remove('hidden');

    try {
      const blob = await toBlob(exportRef.current, {
        cacheBust: true, backgroundColor: '#ffffff', quality: 0.95,
        filter: (node) => !node.classList?.contains('exclude-from-capture')
      });
      if (blob) window.open(URL.createObjectURL(blob), '_blank');
    } catch (e) {
      Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    } finally {
      if (logo) logo.classList.add('hidden');
      setIsExporting(false);
    }
  };

  const fechasOrdenadas = useMemo(() => Object.keys(comisionesAgrupadas).sort((a, b) => {
    const dateA = parseISO(comisionesAgrupadas[a][0].fecha_hora.replace(' ', 'T'));
    const dateB = parseISO(comisionesAgrupadas[b][0].fecha_hora.replace(' ', 'T'));
    return dateA.getTime() - dateB.getTime();
  }), [comisionesAgrupadas]);

  return (
    <div ref={exportRef} className="bg-white rounded-xl border border-gray-200 px-2 pb-6 flex flex-col h-full relative text-xs">     
      <div className="exclude-from-capture border-t pt-4">
        <div className="flex flex-wrap justify-start items-center gap-4 mt-4 text-xs md:text-sm">
          <Button variant="link" onClick={onClose} className="absolute top-0 left-2 exclude-from-capture">
              <LogOut className="mr-2 h-4 w-4 rotate-180" /> Mostrar todas
          </Button>
          <div className="hidden xl:block">
            <Button variant="link" onClick={handleExportar} disabled={isExporting} className="text-blue-600 gap-2">
                <Camera className="h-4 w-4" /> {isExporting ? 'Capturando...' : 'Imagen'}
            </Button>
          </div>
        </div>
      </div>
      
      <div id="export-logo-container" className="text-start hidden">
        <img src="/images/logo-muni.png" alt="Logo Municipalidad" className="w-auto mx-auto h-[100px] lg:h-[200px]" />
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto">
        {fechasOrdenadas.map(fecha => (
          <div key={fecha}>
            <h4 className="font-semibold text-gray-900 mb-2 capitalize flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> {fecha}
            </h4>
            <div className="space-y-2">
              {comisionesAgrupadas[fecha]
                .sort((a, b) => a.titulo.localeCompare(b.titulo))
                .map(comision => {
                  const encargado = comision.asistentes?.find(a => a.encargado);
                  const asistentes = comision.asistentes?.filter(a => !a.encargado)
                    .sort((a, b) => getUsuarioNombre(a.id, usuarios).localeCompare(getUsuarioNombre(b.id, usuarios)));
                  const notas = notasPorComision.get(comision.id);

                  return (
                    <div key={comision.id} className="bg-gray-50 rounded-md px-3 py-2 border-2 border-gray-400">                      
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-blue-600 flex items-center gap-2">{comision.titulo}</h5>
                          <p className="font-bold text-blue-600 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(parseISO(comision.fecha_hora.replace(' ', 'T')), "h:mm a", { locale: es })}
                          </p>
                        </div>
                        <div className="border-t mt-2 pt-2">
                          <div className="flex items-center gap-1 my-1">
                            <span className="font-semibold text-blue-600 flex items-center gap-2"><Users className="h-4 w-4" /> Encargado:</span>
                            <span className="text-gray-600 font-semibold">{encargado ? getUsuarioNombre(encargado.id, usuarios) : 'No asignado'}</span>
                          </div>
                          {asistentes && asistentes.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="grid grid-cols-3 gap-y-1 text-gray-600 leading-relaxed font-semibold">
                                {asistentes.map((a, i) => (
                                  <span key={a.id} className={`pl-2 ${i % 3 === 0 ? '' : 'border-l border-gray-300'}`}>
                                    {getUsuarioNombre(a.id, usuarios)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {notas && (
                        <div className="border-t mt-2 pt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-semibold text-blue-600 flex items-center gap-2"><StickyNote className="h-4 w-4" /> Notas:</span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-2 gap-y-1 text-gray-600 leading-relaxed font-semibold">
                            {notas.map((n, i) => <div key={i}>{n}</div>)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        ))}
        {notasGenerales.length > 0 && (
          <div className="border-t m-4 py-4">
            <span className="font-semibold text-blue-600 mb-4 block">Notas generales:</span>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1 font-semibold text-gray-600">
              {notasGenerales.map((n, i) => <div key={i}>{n}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}