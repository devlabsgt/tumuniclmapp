'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';

import { useAsistenciaComisionUsuario } from '@/hooks/comisiones/useAsistenciaComision';
import { marcarAsistenciaComision } from '@/lib/comisiones/acciones';
import { useObtenerUbicacion } from '@/hooks/ubicacion/useObtenerUbicacion';
import useFechaHora from '@/hooks/utility/useFechaHora';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';

interface AsistenciaComisionProps {
  comision: ComisionConFechaYHoraSeparada;
  userId: string;
  nombreUsuario: string;
  onAsistenciaMarcada: () => void;
}

const formatarMinutos = (minutos: number) => {
  const absMinutos = Math.abs(minutos);
  const horas = Math.floor(absMinutos / 60);
  const minsRestantes = absMinutos % 60;
  let resultado = '';

  if (horas > 0) {
    resultado += `${horas} hora${horas > 1 ? 's' : ''}`;
  }
  if (minsRestantes > 0) {
    resultado += `${horas > 0 ? ' y ' : ''}${minsRestantes} minuto${minsRestantes > 1 ? 's' : ''}`;
  }
  if (resultado === '') {
    return '0 minutos';
  }
  return resultado;
};

export default function AsistenciaComision({ comision, userId, nombreUsuario, onAsistenciaMarcada }: AsistenciaComisionProps) {
  const { cargando: cargandoGeo, obtenerUbicacion, error: errorGeo } = useObtenerUbicacion();
  const fechaHoraGt = useFechaHora();
  const { registros, loading: cargandoRegistros, fetchRegistros } = useAsistenciaComisionUsuario(userId);

  const [cargandoMarcaje, setCargandoMarcaje] = useState(false);

  const registrosDeLaComision = useMemo(() => {
    const registrosFiltrados = registros.filter(r => r.comision_id === comision.id);
    const registroEntrada = registrosFiltrados.find(r => r.tipo_registro === 'Entrada') || null;
    const registroSalida = registrosFiltrados.find(r => r.tipo_registro === 'Salida') || null;
    return { registroEntrada, registroSalida };
  }, [registros, comision.id]);

  const handleIniciarMarcado = async (tipo: 'Entrada' | 'Salida', comisionId: string) => {
    let notaParaEnviar = '';

    if (tipo === 'Entrada') {
      const fechaComision = parseISO(comision.fecha_hora.replace(' ', 'T'));
      const diffMinutes = differenceInMinutes(fechaHoraGt, fechaComision);
      let requiereNotas = false;
      let justificacionHtml = '';

      if (diffMinutes > 15) {
        requiereNotas = true;
        const tiempoFormateado = formatarMinutos(diffMinutes);
        justificacionHtml = `Está marcando <b>${tiempoFormateado} tarde</b>.<br/>Por favor, ingrese una justificación:`;
      } else if (diffMinutes < -15) {
        requiereNotas = true;
        const tiempoFormateado = formatarMinutos(diffMinutes);
        justificacionHtml = `Está marcando <b>${tiempoFormateado} temprano</b>.<br/>Por favor, ingrese una justificación:`;
      }

      if (requiereNotas) {
        const { value: justificacion, isConfirmed } = await Swal.fire({
          title: 'Justificación Requerida',
          html: justificacionHtml,
          icon: 'warning',
          input: 'textarea',
          inputPlaceholder: 'Escriba su justificación aquí...',
          showCancelButton: true,
          confirmButtonText: 'Confirmar y Marcar Entrada',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value || value.trim() === '') {
              return '¡Necesita escribir una justificación!';
            }
            return null;
          }
        });

        if (!isConfirmed) return;
        notaParaEnviar = justificacion;
      
      } else {
        const { value: notaOpcional, isConfirmed } = await Swal.fire({
          title:`Marcar ${tipo.toLowerCase()}`,
          text: `¿Confirme si desea marcar su ${tipo.toLowerCase()} ahora?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: `Sí, marcar ${tipo}`,
          cancelButtonText: 'Cancelar',
          input: 'textarea',
          inputPlaceholder: 'Agrege una justificación o nota (opcional)',
          inputValue: '',
          inputAttributes: {
            'aria-label': 'Notas (opcional)'
          },
        });

        if (!isConfirmed) return;
        notaParaEnviar = notaOpcional || '';
      }
    } else {
      const { value: notaOpcional, isConfirmed } = await Swal.fire({
        title: '¿Está seguro?',
        text: `¿Quiere marcar su ${tipo.toLowerCase()} ahora?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Sí, marcar ${tipo}`,
        cancelButtonText: 'Cancelar',
        input: 'textarea',
        inputPlaceholder: 'Notas (opcional)...',
        inputValue: '',
        inputAttributes: {
          'aria-label': 'Notas (opcional)'
        },
      });
      if (!isConfirmed) return;
      notaParaEnviar = notaOpcional || '';
    }

    const coords = await obtenerUbicacion();

    if (coords) {
      handleMarcarAsistencia(tipo, comisionId, coords, notaParaEnviar);
    } else {
      Swal.fire('Error de Ubicación', 'No se pudo obtener una ubicación precisa. Verifique su GPS e intente nuevamente.', 'error');
    }
  };
  
  const handleMarcarAsistencia = async (
    tipo: string, 
    comisionId: string, 
    ubicacionActual: { lat: number; lng: number }, 
    notaFinal: string
  ) => {
    setCargandoMarcaje(true);
    const registro = await marcarAsistenciaComision(userId, comisionId, tipo, ubicacionActual, notaFinal);
    if (registro) {
      Swal.fire('¡Éxito!', `Se ha registrado su ${tipo.toLowerCase()} correctamente.`, 'success');
      fetchRegistros();
      onAsistenciaMarcada();
    } else {
      Swal.fire('Error', 'No se pudo realizar el marcaje.', 'error');
    }
    setCargandoMarcaje(false);
  };
  
  const { registroEntrada, registroSalida } = registrosDeLaComision;
  const entradaMarcada = !!registroEntrada;
  const salidaMarcada = !!registroSalida;

  if (cargandoRegistros) {
    return <div className="py-4"></div>;
  }

  return (
    <>
    {!salidaMarcada && (
      <div>
        <div className="flex flex-col gap-8 w-full border-t-4 border-gray-200 dark:border-neutral-800 pt-5 transition-colors">
          <div className="px-4 pb-4 bg-white dark:bg-neutral-950 space-y-4 transition-colors">         
            
              <>
                <div className="text-center flex justify-center items-center gap-4">
                  <p className="font-mono text-sm capitalize text-slate-600 dark:text-gray-400">
                    {format(fechaHoraGt, "EEEE, d MMM", { locale: es })}
                  </p>
                  <p className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
                    {fechaHoraGt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                {!entradaMarcada ? (
                  <div className="flex gap-4 items-stretch">
                    <Button onClick={() => handleIniciarMarcado('Entrada', comision.id)} disabled={cargandoMarcaje || cargandoGeo} className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-xs py-4 h-auto border-0 text-white">
                      {cargandoGeo ? 'Obteniendo ubicación...' : (cargandoMarcaje ? 'Marcando...' : 'Entrada')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-stretch">
                    <Button onClick={() => handleIniciarMarcado('Salida', comision.id)} disabled={cargandoMarcaje || salidaMarcada || cargandoGeo} className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-xs py-4 h-auto border-0 text-white">
                      {cargandoGeo ? 'Obteniendo ubicación...' : (salidaMarcada ? 'Salida ya marcada' : (cargandoMarcaje ? 'Marcando...' : 'Salida'))}
                    </Button>
                  </div>
                )}
              </>
          
          </div>
        </div>
      </div>
        )}
    </>
  );
}