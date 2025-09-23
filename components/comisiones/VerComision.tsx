'use client';

import React, { useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { X, Calendar, Users, User, FileText, Camera, Pencil, Trash2 } from 'lucide-react';
import { useRegistrosDeComision } from '@/hooks/comisiones/useRegistrosDeComision';
import Cargando from '@/components/ui/animations/Cargando';
import { toBlob } from 'html-to-image';
import Swal from 'sweetalert2';

const RegistroAsistenciaItem = ({ asistenteId, registros, nombre, onAbrirMapa }: any) => {
  const registrosDelAsistente = useMemo(() => {
    const registroEntrada = registros.find((r: any) => r.user_id === asistenteId && r.tipo_registro === 'Entrada') || null;
    const registroSalida = registros.find((r: any) => r.user_id === asistenteId && r.tipo_registro === 'Salida') || null;
    return { entrada: registroEntrada, salida: registroSalida };
  }, [registros, asistenteId]);

  const duracionComision = useMemo(() => {
    const { entrada, salida } = registrosDelAsistente;
    if (!entrada || !salida) return null;
    const diff = new Date(salida.created_at).getTime() - new Date(entrada.created_at).getTime();
    if (diff < 0) return null;
    let minutos = Math.floor(diff / 60000);
    let horas = Math.floor(minutos / 60);
    minutos = minutos % 60;
    const parts = [];
    if (horas > 0) parts.push(`${horas}h`);
    if (minutos > 0) parts.push(`${minutos}m`);
    return parts.join(' ') || "0m";
  }, [registrosDelAsistente]);

  const formatTime = (dateString: string | undefined) => dateString ? format(new Date(dateString), 'h:mm a', { locale: es }) : '---';

  const { entrada, salida } = registrosDelAsistente;
  const tieneRegistros = entrada || salida;

  return (
    <div className="pl-8 px-2 mt-2">
      <div 
        onClick={tieneRegistros ? () => onAbrirMapa(registrosDelAsistente, nombre) : undefined} 
        className={`px-3 py-2 rounded-md bg-slate-100 flex items-center justify-between flex-wrap gap-x-4 
          ${tieneRegistros ? 'cursor-pointer hover:bg-slate-200' : 'opacity-70'}`
        }
      >
        <p className="text-gray-800 font-semibold flex-grow text-xs">{nombre}</p>
        
        {tieneRegistros ? (
          <div className="flex items-center gap-x-4 text-xs ">
            <p className="font-mono text-green-600">
              <span className="font-semibold">Entrada:</span> {formatTime(entrada?.created_at)}
            </p>
            <p className="font-mono text-red-600">
              <span className="font-semibold">Salida:</span> {formatTime(salida?.created_at)}
            </p>
            {duracionComision && (
              <p className="font-mono text-blue-800">
                <span className="font-semibold">Duración:</span> {duracionComision}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Sin registros de asistencia</p>
        )}
      </div>
    </div>
  );
};

interface VerComisionDetalleProps {
  comision: ComisionConFechaYHoraSeparada;
  usuarios: Usuario[];
  rol: string | null;
  onClose: () => void;
  onAbrirMapa: (registros: any, nombre: string) => void;
  onEdit: (comision: ComisionConFechaYHoraSeparada) => void;
  onDelete: (comisionId: string) => void;
}

const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

export default function VerComision({ comision, usuarios, rol, onClose, onAbrirMapa, onEdit, onDelete }: VerComisionDetalleProps) {
  const { registros, loading: cargandoRegistros } = useRegistrosDeComision(comision.id);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fechaCompleta = parseISO(comision.fecha_hora.replace(' ', 'T'));
  const fechaHoraAbreviada = format(fechaCompleta, "EEE, d MMM, yyyy | h:mm a", { locale: es });

  const encargado = comision.asistentes?.find(a => a.encargado);
  const asistentes = comision.asistentes?.filter(a => !a.encargado);
  
  const handleExportarComoImagen = async () => {
    if (!exportRef.current) return;

    const logoElement = document.getElementById('export-logo');
    if (!logoElement) return;
    
    setIsExporting(true);
    logoElement.style.opacity = '1';
    logoElement.style.pointerEvents = 'auto';

    try {
      const filter = (node: HTMLElement) => {
        return !node.classList?.contains('exclude-from-capture');
      };

      const blob = await toBlob(exportRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
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
      logoElement.style.opacity = '0';
      logoElement.style.pointerEvents = 'none';
      setIsExporting(false);
    }
  };

  return (
    <div ref={exportRef} className="bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col h-full border relative">
      <div className="flex justify-between items-start">
        <h2 className="text-sm font-bold text-gray-800">{comision.titulo}</h2>
      </div>

      <div className="flex-grow text-gray-700">
        
        <div className="flex items-center gap-3 my-4">
          <h3 className="text-xs font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500" /> Fecha y Hora:</h3>
          <span className="text-xs capitalize">{fechaHoraAbreviada}</span>
        </div>
        
        <div className="border-t">
          <h3 className="text-xs font-semibold flex items-center gap-2 mt-2"><User className="h-5 w-5 text-blue-500" /> Encargado</h3>
          {cargandoRegistros ? <Cargando /> : encargado ? (
            <RegistroAsistenciaItem  asistenteId={encargado.id} registros={registros} nombre={getUsuarioNombre(encargado.id, usuarios)} onAbrirMapa={onAbrirMapa} />
          ) : <p className="pl-8 text-gray-500 my-4">No asignado</p>}
        </div>

        {asistentes && asistentes.length > 0 && (
          <div className="border-t mt-4">
            <h3 className="text-xs font-semibold flex items-center gap-2 mt-2"><Users className="h-5 w-5 text-blue-500" /> Integrantes</h3>
            {cargandoRegistros ? <Cargando /> : (
              asistentes.map(asistente => (
                <RegistroAsistenciaItem key={asistente.id} asistenteId={asistente.id} registros={registros} nombre={getUsuarioNombre(asistente.id, usuarios)} onAbrirMapa={onAbrirMapa} />
              ))
            )}
          </div>
        )}
        
        {comision.comentarios && comision.comentarios.length > 0 && (
          <div className="border-t mt-4">
            <h3 className="text-xs font-semibold flex items-center gap-2 my-2"><FileText className="h-5 w-5 text-blue-500" /> Notas</h3>
            <ul className="list-disc list-inside pl-8 my-4">
              {comision.comentarios.map((comentario, index) => <li key={index} className="text-gray-800 text-xs my-1">{comentario}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t exclude-from-capture">
          <div className="flex justify-between items-center gap-4 mt-4 text-xs">
        
                <Button
                  variant="link"
                  onClick={() => onEdit(comision)}
                  className="text-green-600 gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="link"
                  onClick={() => onDelete(comision.id)}
                  className="text-red-600 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
        
            
            <Button
              variant="link"
              onClick={handleExportarComoImagen}
              disabled={isExporting}
              className="text-blue-600 gap-2"
            >
              <Camera className="h-4 w-4" />
              {isExporting ? 'Capturando...' : 'Generar Imagen'}
            </Button>
            <Button
              variant="link"
              onClick={onClose}
              className="text-gray-600"
            >
              Cerrar
            </Button>
          </div>
      </div>

      <img
        id="export-logo"
        src="/images/logo-muni.png"
        alt="Logo Municipalidad"
        className="absolute top-0 right-6 w-48 h-auto"
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}