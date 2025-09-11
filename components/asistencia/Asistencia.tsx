'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import useUserData from '@/hooks/sesion/useUserData';
import { es } from 'date-fns/locale';
import { format, isSameDay } from 'date-fns';
import { Clock, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendario from './Calendario';
import Mapa from './modal/Mapa';
import Cargando from '@/components/ui/animations/Cargando';
import Swal from 'sweetalert2';

import {
  marcarNuevaAsistencia
} from '@/lib/asistencia/acciones';
import useFechaHora from '@/hooks/utility/useFechaHora';
import { useAsistenciaUsuario } from '@/hooks/asistencia/useAsistenciaUsuario';
import useGeolocalizacion from '@/hooks/utility/useGeolocalizacion';

export default function Asistencia() {
  const { userId, nombre, cargando: cargandoUsuario } = useUserData();
  const { asistencias: todosLosRegistros, loading: cargandoRegistros, fetchAsistencias } = useAsistenciaUsuario(userId);
  const fechaHoraGt = useFechaHora();
  const { ubicacion, cargando: cargandoGeo, obtenerUbicacion } = useGeolocalizacion();

  const [cargando, setCargando] = useState(false);
  const [notas, setNotas] = useState('');
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });

  const [activeTab, setActiveTab] = useState<'controlResumen' | 'semanal'>('controlResumen');
  const [tipoRegistroPendiente, setTipoRegistroPendiente] = useState<'Entrada' | 'Salida' | null>(null);

  const registroEntradaHoy = useMemo(() => {
    if (!todosLosRegistros) return null;
    return todosLosRegistros.find((r: any) =>
      isSameDay(new Date(r.created_at), new Date()) && r.tipo_registro === 'Entrada'
    );
  }, [todosLosRegistros]);

  const registroSalidaHoy = useMemo(() => {
    if (!todosLosRegistros) return null;
    return todosLosRegistros.find((r: any) =>
      isSameDay(new Date(r.created_at), new Date()) && r.tipo_registro === 'Salida'
    );
  }, [todosLosRegistros]);

  useEffect(() => {
    if (modalMapaAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalMapaAbierto]);

  useEffect(() => {
    if (ubicacion && tipoRegistroPendiente) {
      handleMarcarAsistencia(tipoRegistroPendiente, ubicacion);
      setTipoRegistroPendiente(null);
    }
  }, [ubicacion, tipoRegistroPendiente]);

  const handleIniciarMarcado = async (tipo: 'Entrada' | 'Salida') => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Quiere marcar su ${tipo.toLowerCase()} ahora?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, marcar ${tipo}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setTipoRegistroPendiente(tipo);
      obtenerUbicacion();
    }
  };

  const handleMarcarAsistencia = async (tipo: string, ubicacionActual: { lat: number; lng: number }) => {
    setCargando(true);
    if (!userId) {
      Swal.fire('Error', 'No se encontró el ID de usuario.', 'error');
      setCargando(false);
      return;
    }

    const nuevoRegistro = await marcarNuevaAsistencia(userId, tipo, ubicacionActual, notas);

    if (nuevoRegistro) {
      Swal.fire(`¡${tipo} Marcada!`, `Se ha registrado su ${tipo.toLowerCase()} correctamente.`, 'success');
      fetchAsistencias();
      setNotas('');
    }
    setCargando(false);
  };

  const handleAbrirMapa = (registro: any) => {
    if (!registro?.ubicacion) return;

    const fechaRegistro = new Date(registro.created_at);
    const registrosDeEseDia = todosLosRegistros.filter((r: any) => isSameDay(new Date(r.created_at), fechaRegistro));

    const entrada = registrosDeEseDia.find(r => r.tipo_registro === 'Entrada') || null;
    const salida = registrosDeEseDia.find(r => r.tipo_registro === 'Salida') || null;

    setRegistrosSeleccionadosParaMapa({ entrada, salida });
    setModalMapaAbierto(true);
  };
  
  const handleAbrirMapaHoy = () => {
    if (registroEntradaHoy || registroSalidaHoy) {
      setRegistrosSeleccionadosParaMapa({
        entrada: registroEntradaHoy || null,
        salida: registroSalidaHoy || null,
      });
      setModalMapaAbierto(true);
    }
  };
  
  const formatTimeWithAMPM = (dateString: string | undefined) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    const hora = format(date, 'hh:mm', { locale: es });
    const periodo = format(date, 'a', { locale: es }).replace(/\./g, '').toUpperCase();
    return `${hora} ${periodo}`;
  };

  const entradaMarcada = !!registroEntradaHoy;
  const salidaMarcada = !!registroSalidaHoy;

  if (cargandoUsuario || cargandoRegistros) {
    return <Cargando texto='Asistencia...' />;
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="border-b flex mb-4 flex-wrap justify-center">
          <button onClick={() => setActiveTab('controlResumen')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm lg:text-xl  ${activeTab === 'controlResumen' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            <Clock className="h-4 w-4" /> Asistencia
          </button>
          <button onClick={() => setActiveTab('semanal')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm lg:text-xl ${activeTab === 'semanal' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            <CalendarCheck className="h-4 w-4" /> Registro Semanal
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'controlResumen' ? (
            <motion.div key="controlResumen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="flex flex-col gap-8 w-full">
                <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
                  <div className="text-center bg-slate-100 p-3 rounded-md">
                    <p className="font-semibold text-xl lg:text-3xl">{nombre || 'Usuario no identificado'}</p>
                  </div>

                  <div className="text-center border-y py-4 space-y-2">
                    <p className="text-xl lg:text-3xl capitalize text-slate-600">
                      {format(fechaHoraGt, "eeee, dd/MM/yyyy", { locale: es })}
                    </p>
                    <p className="font-mono text-xl lg:text-3xl font-bold">
                      {fechaHoraGt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  
                  {!salidaMarcada && (
                    <div className="w-full">
                      <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agregar notas..." rows={3} className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {!entradaMarcada ? (
                      <Button onClick={() => handleIniciarMarcado('Entrada')} disabled={cargando || cargandoGeo} className="w-full bg-green-600 hover:bg-green-700 text-xl lg:text-3xl py-12">
                        {cargandoGeo ? 'Obteniendo ubicación...' : (cargando ? 'Marcando...' : 'Marcar Entrada')}
                      </Button>
                    ) : (
                      <Button onClick={() => handleIniciarMarcado('Salida')} disabled={cargando || salidaMarcada || cargandoGeo} className="w-full bg-red-600 hover:bg-red-700 text-xl lg:text-3xl py-12">
                        {cargandoGeo ? 'Obteniendo ubicación...' : (salidaMarcada ? 'Salida ya marcada' : (cargando ? 'Marcando...' : 'Marcar Salida'))}
                      </Button>
                    )}
                  </div>

                  {/* **SECCIÓN DE REGISTROS DE HOY ACTUALIZADA** */}
                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-xl lg:text-3xl font-semibold mb-2">Registros de hoy:</h4>
                    {(registroEntradaHoy || registroSalidaHoy) ? (
                      <>
                        <p className="text-xs text-gray-500 mb-2">Haga clic en el registro para ver las ubicaciones.</p>
                        <div 
                          onClick={handleAbrirMapaHoy}
                          className="p-3 rounded-md bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors flex justify-between items-center gap-4"
                        >
                          <p className="text-lg lg:text-xl font-mono">
                            <span className="font-semibold">Entrada:</span> {formatTimeWithAMPM(registroEntradaHoy?.created_at)}
                          </p>
                          <p className="text-lg lg:text-xl font-mono">
                            <span className="font-semibold">Salida:</span> {formatTimeWithAMPM(registroSalidaHoy?.created_at)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xl lg:text-3xl text-gray-500">No hay registros hoy.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="semanal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Calendario
                todosLosRegistros={todosLosRegistros}
                onAbrirMapa={handleAbrirMapa}
                fechaHoraGt={fechaHoraGt}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {modalMapaAbierto && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registros={registrosSeleccionadosParaMapa}
            nombreUsuario={nombre}
          />
        )}
      </AnimatePresence>
    </>
  );
}