'use client';

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { X, Calendar, Users, User, FileText } from 'lucide-react';
import { useRegistrosDeComision } from '@/hooks/comisiones/useRegistrosDeComision';
import Cargando from '@/components/ui/animations/Cargando';

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

  return (
    <div className="pl-8 py-2">
      <p className="text-gray-800 font-semibold">{nombre}</p>
      {(!entrada && !salida) ? (
        <p className="text-sm text-gray-500">Sin registros de asistencia</p>
      ) : (
        <div 
          onClick={() => onAbrirMapa(registrosDelAsistente, nombre)} 
          className="mt-2 p-3 rounded-md bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors flex flex-wrap justify-start items-center gap-x-4 gap-y-1"
        >
          <p className="text-sm font-mono"><span className="font-semibold">Entrada:</span> {formatTime(entrada?.created_at)}</p>
          <p className="text-sm font-mono"><span className="font-semibold">Salida:</span> {formatTime(salida?.created_at)}</p>
          {duracionComision && (<p className="text-sm font-mono text-blue-800"><span className="font-semibold">Duración:</span> {duracionComision}</p>)}
        </div>
      )}
    </div>
  );
};

interface VerComisionDetalleProps {
  comision: ComisionConFechaYHoraSeparada;
  usuarios: Usuario[];
  onClose: () => void;
  onAbrirMapa: (registros: any, nombre: string) => void;
}

const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

export default function VerComision({ comision, usuarios, onClose, onAbrirMapa }: VerComisionDetalleProps) {
  const { registros, loading: cargandoRegistros } = useRegistrosDeComision(comision.id);

  const fechaHoraAbreviada = format(parseISO(comision.fecha_hora), "EEE, d MMM, yyyy | h:mm a", { locale: es });
  const encargado = comision.asistentes?.find(a => a.encargado);
  const asistentes = comision.asistentes?.filter(a => !a.encargado);
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col h-full border">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{comision.titulo}</h2>
        <Button variant="ghost" className="text-gray-500 hover:bg-gray-200 p-2 -mr-2 -mt-2" onClick={onClose} aria-label="Cerrar">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6 text-gray-700">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-500" />
          <span className="text-lg capitalize">{fechaHoraAbreviada}</span>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><User className="h-5 w-5 text-blue-500" /> Encargado</h3>
          {cargandoRegistros ? <Cargando /> : encargado ? (
            <RegistroAsistenciaItem asistenteId={encargado.id} registros={registros} nombre={getUsuarioNombre(encargado.id, usuarios)} onAbrirMapa={onAbrirMapa} />
          ) : <p className="pl-8 text-gray-500">No asignado</p>}
        </div>

        {asistentes && asistentes.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-blue-500" /> Asistentes</h3>
            {cargandoRegistros ? <Cargando /> : (
              asistentes.map(asistente => (
                <RegistroAsistenciaItem key={asistente.id} asistenteId={asistente.id} registros={registros} nombre={getUsuarioNombre(asistente.id, usuarios)} onAbrirMapa={onAbrirMapa} />
              ))
            )}
          </div>
        )}
        
        {comision.comentarios && comision.comentarios.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><FileText className="h-5 w-5 text-blue-500" /> Notas</h3>
            <ul className="list-disc list-inside pl-8 space-y-1">
              {comision.comentarios.map((comentario, index) => <li key={index} className="text-gray-800">{comentario}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}