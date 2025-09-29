'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Camera, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toBlob } from 'html-to-image';
import Swal from 'sweetalert2';

interface VerComisionesProps {
  comisiones: ComisionConFechaYHoraSeparada[];
  usuarios: Usuario[];
  onClose: () => void;
}

const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

export default function VerComisiones({ comisiones, usuarios, onClose }: VerComisionesProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { notasGenerales, notasPorComision } = useMemo(() => {
    const conteoNotas = new Map<string, number>();
    const notasGeneralesSet = new Set<string>();

    comisiones.forEach(comision => {
      comision.comentarios?.forEach(comentario => {
        conteoNotas.set(comentario, (conteoNotas.get(comentario) || 0) + 1);
      });
    });

    conteoNotas.forEach((count, nota) => {
      if (count > 1) {
        notasGeneralesSet.add(nota);
      }
    });

    const notasPorComisionMap = new Map<string, string[]>();
    comisiones.forEach(comision => {
      const notasUnicas = comision.comentarios?.filter(comentario => !notasGeneralesSet.has(comentario)) || [];
      notasPorComisionMap.set(comision.id, notasUnicas);
    });

    return { notasGenerales: Array.from(notasGeneralesSet), notasPorComision: notasPorComisionMap };
  }, [comisiones]);

  const comisionesAgrupadasPorFecha = comisiones.reduce((grupos, comision) => {
    const fecha = format(parseISO(comision.fecha_hora.replace(' ', 'T')), 'EEEE, d MMMM yyyy', { locale: es });
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(comision);
    return grupos;
  }, {} as { [key: string]: ComisionConFechaYHoraSeparada[] });
  
  const handleExportarComoImagen = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);

    const logoContainerElement = document.getElementById('export-logo-container');
    if (logoContainerElement) {
        logoContainerElement.classList.remove('hidden');
    }

    try {
      const filter = (node: HTMLElement) => {
        return !node.classList?.contains('exclude-from-capture');
      };

      const blob = await toBlob(exportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
          quality: 0.95,
        filter: filter
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error al exportar la imagen:', error);
      Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    } finally {
      if (logoContainerElement) {
          logoContainerElement.classList.add('hidden');
      }
      setIsExporting(false);
    }
  };

  return (
    <div ref={exportRef} className="bg-white rounded-xl border border-gray-200 px-2 pb-6 flex flex-col h-full relative">
            
      <div className="exclude-from-capture border-t pt-4">
        <div className="flex flex-wrap justify-start items-center gap-4 mt-4 text-xs md:text-sm">
          <Button
            variant="link"
            onClick={onClose}
            className="absolute top-0 left-2 exclude-from-capture "
          >
              <LogOut className="mr-2 h-4 w-4 rotate-180" />
              Mostrar todas las comisiones
          </Button>
          <div className="hidden xl:block">
            <Button
                variant="link"
                onClick={handleExportarComoImagen}
                disabled={isExporting}
                className="text-blue-600 gap-2"
            >
                <Camera className="h-4 w-4" />
                {isExporting ? 'Capturando...' : 'Imagen'}
            </Button>
          </div>
        </div>
      </div>
      <div
        id="export-logo-container"
        className="text-start"
      >
        <img
        src="/images/logo-muni.png"
        alt="Logo Municipalidad"
        className="w-auto mx-auto"
        style={{ height: '200px' }}
        />
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto">
        {Object.keys(comisionesAgrupadasPorFecha).sort((a, b) => {
          const comisionA = comisionesAgrupadasPorFecha[a][0];
          const comisionB = comisionesAgrupadasPorFecha[b][0];
          const fechaA = parseISO(comisionA.fecha_hora.replace(' ', 'T'));
          const fechaB = parseISO(comisionB.fecha_hora.replace(' ', 'T'));
          return fechaA.getTime() - fechaB.getTime();
        }).map(fecha => (
          <div key={fecha}>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 capitalize">{fecha}</h4>
            <div className="space-y-2">
              {comisionesAgrupadasPorFecha[fecha]
                .sort((a, b) => a.titulo.localeCompare(b.titulo))
                .map(comision => {
                  const encargado = comision.asistentes?.find(a => a.encargado);
                  const asistentes = comision.asistentes
                    ?.filter(a => !a.encargado)
                    .sort((a, b) => getUsuarioNombre(a.id, usuarios).localeCompare(getUsuarioNombre(b.id, usuarios)));
                  const notasUnicasComision = notasPorComision.get(comision.id) || [];
                  return (
                    <div key={comision.id} className="bg-gray-50 rounded-md px-3 py-2 border-2 border-gray-400">                      
                      <div className="flex flex-wrap -mx-2">
                        <div className="w-[80%] pl-2">
                          <div className="flex items-start">
                            <h5 className="text-md font-bold text-gray-800">{comision.titulo}</h5>
                            <p className="text-sm ml-4 text-gray-600">{format(parseISO(comision.fecha_hora.replace(' ', 'T')), "h:mm a", { locale: es })}</p>
                          </div>
                          <div className="border-t mt-2 pt-2">
                            <div className="flex items-center gap-1 my-1">
                              <span className="text-md font-semibold text-gray-700">Encargado:</span>
                              <span className="text-md text-gray-600">{encargado ? getUsuarioNombre(encargado.id, usuarios) : 'No asignado'}</span>
                            </div>
                            {asistentes && asistentes.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-lg text-gray-600">
                                  {asistentes.map(a => (
                                    <span key={a.id}>{getUsuarioNombre(a.id, usuarios)}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-[20%] py-2 pl-2 border-l">
                          {notasUnicasComision && notasUnicasComision.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-sm font-semibold text-gray-700">Notas:</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {notasUnicasComision.map((comentario, index) => <div key={index}>{comentario}</div>)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        ))}
        {notasGenerales.length > 0 && (
          <div className="border-t m-4 py-4">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-semibold text-gray-700">Notas generales:</span>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside ml-4 text-lg font-semibold text-gray-600">
              {notasGenerales.map((comentario, index) => <li key={index}>{comentario}</li>)}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}