'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  const [pendingAction, setPendingAction] = useState<{ tipo: 'Entrada' | 'Salida'; comisionId: string } | null>(null);

  const registrosDeLaComision = useMemo(() => {
    const registrosFiltrados = registros.filter(r => r.comision_id === comision.id);
    const registroEntrada = registrosFiltrados.find(r => r.tipo_registro === 'Entrada') || null;
    const registroSalida = registrosFiltrados.find(r => r.tipo_registro === 'Salida') || null;
    return { registroEntrada, registroSalida };
  }, [registros, comision.id]);


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
        <div className="flex flex-col gap-8 w-full border-t-4 pt-5">
          <div className="px-4 pb-4 bg-white space-y-4">         
            
              <>
                <div className="text-center flex justify-center items-center gap-4">
                  <p className="font-mono  text-sm capitalize text-slate-600">
                    {format(fechaHoraGt, "EEEE, d MMM", { locale: es })}
                  </p>
                  <p className="font-mono text-lg font-bold">
                    {fechaHoraGt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                {!entradaMarcada ? (
                  <div className="flex gap-4 items-stretch">
                    <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agregar notas (opcional)..." rows={2} className="w-3/5 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"/>
                    <Button onClick={() => handleIniciarMarcado('Entrada', comision.id)} disabled={cargandoMarcaje || cargandoGeo} className="w-2/5 bg-green-600 hover:bg-green-700 text-xs py-4 h-auto">
                      {cargandoGeo ? 'Obteniendo ubicación...' : (cargandoMarcaje ? 'Marcando...' : 'Marcar Entrada')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-stretch">
                    <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agregar notas (opcional)..." rows={2} className="w-3/5 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"/>
                    <Button onClick={() => handleIniciarMarcado('Salida', comision.id)} disabled={cargandoMarcaje || salidaMarcada || cargandoGeo} className="w-2/5 bg-orange-600 hover:bg-orange-700 text-xs py-4 h-auto">
                      {cargandoGeo ? 'Obteniendo ubicación...' : (salidaMarcada ? 'Salida ya marcada' : (cargandoMarcaje ? 'Marcando...' : 'Marcar Salida'))}
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