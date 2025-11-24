'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { AnimatePresence } from 'framer-motion';

import { useAsistenciaAgendaUsuario } from '@/hooks/agenda/useAsistenciaAgenda';
import { marcarAsistenciaAgenda } from '@/components/concejo/agenda/lib/acciones';
import { useObtenerUbicacion } from '@/hooks/ubicacion/useObtenerUbicacion';
import useFechaHora from '@/hooks/utility/useFechaHora';
import { AgendaConcejo } from '@/components/concejo/agenda/lib/esquemas';
import Mapa from '@/components/ui/modals/Mapa'; 

interface AsistenciaAgendaProps {
  agenda: AgendaConcejo;
  userId: string;
  nombreUsuario: string;
  puesto: string;
  onAsistenciaMarcada?: () => void;
}

const calcularDuracion = (entradaDate: string, salidaDate: string) => {
  const diff = new Date(salidaDate).getTime() - new Date(entradaDate).getTime();
  if (diff < 0) return null;
  let minutos = Math.floor(diff / 60000);
  let horas = Math.floor(minutos / 60);
  minutos = minutos % 60;
  const parts = [];
  if (horas > 0) parts.push(`${horas}h`);
  if (minutos > 0) parts.push(`${minutos}m`);
  return parts.join(' ') || "0m";
};

const formatTime = (dateString: string | undefined) => 
  dateString ? format(new Date(dateString), 'h:mm a', { locale: es }) : '--:--';

export default function AsistenciaUsuario({ agenda, userId, nombreUsuario, puesto, onAsistenciaMarcada }: AsistenciaAgendaProps) {
  const { cargando: cargandoGeo, obtenerUbicacion } = useObtenerUbicacion();
  const fechaHoraGt = useFechaHora();
  const { registros, loading: cargandoRegistros, fetchRegistros } = useAsistenciaAgendaUsuario(userId, agenda.id);

  const [cargandoMarcaje, setCargandoMarcaje] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);

  const registrosDeLaAgenda = useMemo(() => {
    const registroEntrada = registros.find(r => r.tipo_registro === 'Entrada') || null;
    const registroSalida = registros.find(r => r.tipo_registro === 'Salida') || null;
    return { registroEntrada, registroSalida };
  }, [registros]);

  const { registroEntrada, registroSalida } = registrosDeLaAgenda;
  const entradaMarcada = !!registroEntrada;
  const salidaMarcada = !!registroSalida;
  const asistenciaCompleta = entradaMarcada && salidaMarcada;

  const duracion = useMemo(() => {
    if (registroEntrada && registroSalida) {
      return calcularDuracion(registroEntrada.created_at, registroSalida.created_at);
    }
    return null;
  }, [registroEntrada, registroSalida]);

  // Función vital para corregir coordenadas (latitude -> lat)
  const normalizarRegistro = (registro: any) => {
    if (!registro) return null;
    // Si la ubicación viene como JSON con latitude/longitude, la convertimos a lat/lng
    let ubicacionCorregida = registro.ubicacion;
    if (ubicacionCorregida && ubicacionCorregida.latitude !== undefined) {
        ubicacionCorregida = {
            lat: ubicacionCorregida.latitude,
            lng: ubicacionCorregida.longitude
        };
    }
    return {
        ...registro,
        ubicacion: ubicacionCorregida
    };
  };

  const handleBloqueoPorTiempo = () => {
    Swal.fire({
      title: 'Fuera de Tiempo',
      text: 'Ha excedido el tiempo límite de 15 minutos para marcar su asistencia.',
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  };

  const handleIniciarMarcado = async (tipo: 'Entrada' | 'Salida') => {
    const fechaActual = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy - h:mm a", { locale: es });

    const { value: notaOpcional, isConfirmed } = await Swal.fire({
      title: `Marcar ${tipo}`,
      html: `
        <div class="text-sm text-gray-600 mb-4">
          ${fechaActual}
        </div>
        <p>¿Confirme si desea marcar su ${tipo.toLowerCase()} ahora?</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, marcar`,
      cancelButtonText: 'Cancelar',
      input: 'textarea',
      inputPlaceholder: 'Notas (opcional)...',
    });

    if (!isConfirmed) return;

    const coords = await obtenerUbicacion();

    if (coords) {
      setCargandoMarcaje(true);
      const registro = await marcarAsistenciaAgenda(userId, agenda.id, tipo, coords, notaOpcional || '');
      if (registro) {
        Swal.fire('¡Éxito!', 'Marcaje registrado.', 'success');
        fetchRegistros();
        if (onAsistenciaMarcada) onAsistenciaMarcada();
      } else {
        Swal.fire('Error', 'No se pudo realizar el marcaje.', 'error');
      }
      setCargandoMarcaje(false);
    } else {
      Swal.fire('Error GPS', 'No se pudo obtener ubicación.', 'error');
    }
  };

  if (cargandoRegistros) {
    return <div className="animate-pulse h-14 bg-gray-200 rounded-lg w-full border border-gray-300"></div>;
  }

  const fechaReunion = parseISO(agenda.fecha_reunion);
  const diffMinutes = differenceInMinutes(fechaHoraGt, fechaReunion);
  const esTarde = diffMinutes > 15;

  return (
    <>
      <div 
        onClick={() => setIsMapaOpen(true)}
        className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm mb-4 md:mb-0 cursor-pointer hover:bg-gray-50 transition-colors"
      >
          
          <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span className=" uppercase text-gray-900">{puesto}:</span>
              <span className="  text-blue-600">{nombreUsuario}</span>
          </div>

          <div className="w-full md:w-auto">
              {asistenciaCompleta ? (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 bg-green-50 px-3 py-2 rounded border border-green-100">
                      <span className="whitespace-nowrap"><b>Entrada:</b> {formatTime(registroEntrada?.created_at)}</span>
                      <span className="whitespace-nowrap border-l border-green-200 pl-4"><b>Salida:</b> {formatTime(registroSalida?.created_at)}</span>
                      <span className="whitespace-nowrap border-l border-green-200 pl-4 text-blue-700 font-bold">Duración: {duracion}</span>
                  </div>
              ) : (
                  <>
                      {!entradaMarcada ? (
                          <Button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                esTarde ? handleBloqueoPorTiempo() : handleIniciarMarcado('Entrada');
                              }} 
                              disabled={cargandoMarcaje || cargandoGeo} 
                              size="sm"
                              className={`w-full md:w-auto uppercase font-bold text-sm h-10 px-6 ${
                                  esTarde 
                                  ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                          >
                              {cargandoGeo ? 'GPS...' : (esTarde ? 'TIEMPO AGOTADO' : 'MARCAR ENTRADA')}
                          </Button>
                      ) : (
                          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                              <span className="text-xs font-mono text-green-800 whitespace-nowrap bg-green-50 px-3 py-2 rounded border border-green-200 w-full md:w-auto text-center shadow-sm">
                                  Entrada: <b>{formatTime(registroEntrada?.created_at)}</b>
                              </span>
                              <Button 
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleIniciarMarcado('Salida');
                                  }} 
                                  disabled={cargandoMarcaje || salidaMarcada || cargandoGeo} 
                                  size="sm"
                                  className="w-full md:w-auto uppercase font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white h-10 px-6"
                              >
                                  {cargandoGeo ? 'GPS...' : 'MARCAR SALIDA'}
                              </Button>
                          </div>
                      )}
                  </>
              )}
          </div>
      </div>

      <AnimatePresence>
        {isMapaOpen && (
          <Mapa
            isOpen={isMapaOpen}
            onClose={() => setIsMapaOpen(false)}
            registros={{ 
                entrada: normalizarRegistro(registroEntrada), 
                salida: normalizarRegistro(registroSalida),
                multiple: undefined 
            }}
            nombreUsuario={nombreUsuario}
            titulo="Concejo Municipal"
          />
        )}
      </AnimatePresence>
    </>
  );
}