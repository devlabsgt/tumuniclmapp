'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence } from 'framer-motion';
import Mapa from '@/components/asistencia/modal/Mapa';
import Cargando from '@/components/ui/animations/Cargando';
import Swal from 'sweetalert2';

import { useAsistenciaComisionUsuario } from '@/hooks/comisiones/useAsistenciaComision';
import { marcarAsistenciaComision } from '@/lib/comisiones/acciones';
import useGeolocalizacion from '@/hooks/utility/useGeolocalizacion';
import useFechaHora from '@/hooks/utility/useFechaHora';
import { ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';

interface AsistenciaComisionProps {
  comision: ComisionConFechaYHoraSeparada;
  userId: string;
  nombreUsuario: string;
}

export default function AsistenciaComision({ comision, userId, nombreUsuario }: AsistenciaComisionProps) {
  const { ubicacion, cargando: cargandoGeo, obtenerUbicacion } = useGeolocalizacion();
  const fechaHoraGt = useFechaHora();
  const { registros, loading: cargandoRegistros, fetchRegistros } = useAsistenciaComisionUsuario(userId);

  const [cargandoMarcaje, setCargandoMarcaje] = useState(false);
  const [notas, setNotas] = useState('');
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });
  const [pendingAction, setPendingAction] = useState<{ tipo: 'Entrada' | 'Salida'; comisionId: string } | null>(null);

  const registrosDeLaComision = useMemo(() => {
    const registrosFiltrados = registros.filter(r => r.comision_id === comision.id);
    const registroEntrada = registrosFiltrados.find(r => r.tipo_registro === 'Entrada') || null;
    const registroSalida = registrosFiltrados.find(r => r.tipo_registro === 'Salida') || null;
    return { registroEntrada, registroSalida };
  }, [registros, comision.id]);

  const duracionComision = useMemo(() => {
    const { registroEntrada, registroSalida } = registrosDeLaComision;
    if (!registroEntrada || !registroSalida) return null;

    const fechaEntrada = new Date(registroEntrada.created_at);
    const fechaSalida = new Date(registroSalida.created_at);
    const diferenciaMs = fechaSalida.getTime() - fechaEntrada.getTime();

    if (diferenciaMs < 0) return null;

    let segundosTotales = Math.floor(diferenciaMs / 1000);
    let horas = Math.floor(segundosTotales / 3600);
    segundosTotales %= 3600;
    let minutos = Math.floor(segundosTotales / 60);

    const parts = [];
    if (horas > 0) parts.push(`${horas}h`);
    if (minutos > 0) parts.push(`${minutos}m`);
    
    if (parts.length === 0) return "<1m";
    
    return parts.join(' ');
  }, [registrosDeLaComision]);


  useEffect(() => {
    if (ubicacion && pendingAction) {
      handleMarcarAsistencia(pendingAction.tipo, pendingAction.comisionId, ubicacion);
      setPendingAction(null);
    }
  }, [ubicacion, pendingAction]);

  const handleIniciarMarcado = async (tipo: 'Entrada' | 'Salida', comisionId: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Quiere marcar su ${tipo.toLowerCase()} ahora?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, marcar ${tipo}`,
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      setPendingAction({ tipo, comisionId });
      obtenerUbicacion();
    }
  };
  
  const handleMarcarAsistencia = async (tipo: string, comisionId: string, ubicacionActual: { lat: number; lng: number }) => {
    setCargandoMarcaje(true);
    const registro = await marcarAsistenciaComision(userId, comisionId, tipo, ubicacionActual, notas);
    if (registro) {
      Swal.fire('¡Éxito!', `Se ha registrado su ${tipo.toLowerCase()} correctamente.`, 'success');
      fetchRegistros();
      setNotas('');
    } else {
      Swal.fire('Error', 'No se pudo realizar el marcaje.', 'error');
    }
    setCargandoMarcaje(false);
  };
  
  const handleAbrirMapa = () => {
    const { registroEntrada, registroSalida } = registrosDeLaComision;
    if (registroEntrada || registroSalida) {
      setRegistrosParaMapa({ entrada: registroEntrada, salida: registroSalida });
      setModalMapaAbierto(true);
    }
  };

  const formatTimeWithAMPM = (dateString: string | undefined) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return format(date, 'hh:mm a', { locale: es });
  };

  const { registroEntrada, registroSalida } = registrosDeLaComision;
  const entradaMarcada = !!registroEntrada;
  const salidaMarcada = !!registroSalida;

  if (cargandoRegistros) {
    return <div className="py-4"><Cargando texto="Cargando registros..." /></div>;
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-col gap-8 w-full">
          <div className="p-6 bg-white rounded-lg shadow-md space-y-4">

            {!salidaMarcada && (
              <>
                <div className="text-center border-y py-4 space-y-2">
                  <p className="text-xl capitalize text-slate-600">
                    {format(fechaHoraGt, "eeee, dd/MM/yyyy", { locale: es })}
                  </p>
                  <p className="font-mono text-xl font-bold">
                    {fechaHoraGt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                
                <div className="w-full">
                  <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agregar notas (opcional)..." rows={3} className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>

                <div className="flex gap-4">
                  {!entradaMarcada ? (
                    <Button onClick={() => handleIniciarMarcado('Entrada', comision.id)} disabled={cargandoMarcaje || cargandoGeo} className="w-full bg-green-600 hover:bg-green-700 text-xl py-12">
                      {cargandoGeo ? 'Obteniendo ubicación...' : (cargandoMarcaje ? 'Marcando...' : 'Marcar Entrada')}
                    </Button>
                  ) : (
                    <Button onClick={() => handleIniciarMarcado('Salida', comision.id)} disabled={cargandoMarcaje || salidaMarcada || cargandoGeo} className="w-full bg-red-600 hover:bg-red-700 text-xl py-12">
                      {cargandoGeo ? 'Obteniendo ubicación...' : (salidaMarcada ? 'Salida ya marcada' : (cargandoMarcaje ? 'Marcando...' : 'Marcar Salida'))}
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="mt-6 border-t pt-4">
              <h4 className="text-lg font-semibold mb-2">Registros de la comisión:</h4>
              {(entradaMarcada || salidaMarcada) ? (
                <>
                  <div 
                    onClick={handleAbrirMapa}
                    className="p-3 rounded-md bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors flex flex-wrap justify-center items-center gap-x-6 gap-y-2"
                  >
                    <p className="text-md font-mono">
                      <span className="font-semibold">Entrada:</span> {formatTimeWithAMPM(registroEntrada?.created_at)}
                    </p>
                    <p className="text-md font-mono">
                      <span className="font-semibold">Salida:</span> {formatTimeWithAMPM(registroSalida?.created_at)}
                    </p>
                    {duracionComision && (
                      <p className="text-md font-mono text-blue-800">
                        <span className="font-semibold">Duración:</span> {duracionComision}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Haga clic en el registro para ver las ubicaciones.</p>
                </>
              ) : (
                <p className="text-gray-500">Aún no hay registros para esta comisión.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {modalMapaAbierto && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registros={registrosParaMapa}
            nombreUsuario={nombreUsuario}
          />
        )}
      </AnimatePresence>
    </>
  );
}