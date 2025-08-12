'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import useUserData from '@/hooks/useUserData';
import { es } from 'date-fns/locale';
import { format, isToday } from 'date-fns';
import { X, Clock, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Resumen from './Resumen';
import Calendario from './Calendario';

const supabase = createClient();

const GUATEMALA_TIMEZONE_OFFSET = -6; // UTC-6

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
}

export const esRegistroAnomalo = (registro: Registro): boolean => {
  if (!registro.tipo_registro) return false;

  const registroFechaUtc = new Date(registro.created_at);
  const horaRegistroGt = registroFechaUtc.getUTCHours() + GUATEMALA_TIMEZONE_OFFSET;
  const horaEnMinutos = horaRegistroGt * 60 + registroFechaUtc.getUTCMinutes();

  // Horas límite en minutos (08:10 = 8*60+10, 16:00 = 22*60)
  const horaLimiteEntrada = 8 * 60 + 10;
  const horaLimiteSalida = 14 * 60;

  const esEntradaTardia = registro.tipo_registro === 'Entrada' && horaEnMinutos > horaLimiteEntrada;
  const esSalidaTemprana = registro.tipo_registro === 'Salida' && horaEnMinutos < horaLimiteSalida;

  return esEntradaTardia || esSalidaTemprana;
};

export default function Asistencia() {
  const { userId, nombre, cargando: cargandoUsuario } = useUserData();

  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const [fechaHoraGt, setFechaHoraGt] = useState(new Date());

  const [registrosHoy, setRegistrosHoy] = useState<Registro[]>([]);
  const [cargandoHoy, setCargandoHoy] = useState(true);

  const [todosLosRegistros, setTodosLosRegistros] = useState<Registro[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Registro | null>(null);

  const [activeTab, setActiveTab] = useState<'controlResumen' | 'semanal'>('controlResumen');

  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setFechaHoraGt(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setUbicacion({ lat: position.coords.latitude, lng: position.coords.longitude }); },
        () => { setMensaje('Error: No se pudo obtener la ubicación.'); }
      );
    }
  }, []);

  const verificarAsistenciaHoy = async () => {
    if (!userId) return;
    setCargandoHoy(true);
    const hoyEnGt = new Date();

    const inicioDelDiaUtc = new Date(hoyEnGt.getFullYear(), hoyEnGt.getMonth(), hoyEnGt.getDate()).toISOString();
    const finDelDiaUtc = new Date(hoyEnGt.getFullYear(), hoyEnGt.getMonth(), hoyEnGt.getDate() + 1).toISOString();

    const { data } = await supabase
      .from('registros_asistencia')
      .select('created_at, tipo_registro, ubicacion')
      .eq('user_id', userId)
      .gte('created_at', inicioDelDiaUtc)
      .lt('created_at', finDelDiaUtc);

    setRegistrosHoy(data || []);
    setCargandoHoy(false);
  };

  useEffect(() => {
    if (userId) {
      verificarAsistenciaHoy();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const consultarTodosLosRegistros = async () => {
      setCargandoRegistros(true);
      const { data } = await supabase
        .from('registros_asistencia')
        .select('created_at, tipo_registro, ubicacion')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      setTodosLosRegistros(data || []);
      setCargandoRegistros(false);
    };
    consultarTodosLosRegistros();
  }, [userId]);

  const handleMarcarAsistencia = async (tipo: string) => {
    if (!ubicacion) {
      setMensaje('Error: No se ha podido determinar la ubicación.');
      return;
    }
    setCargando(true);
    setMensaje('');

    const { data: nuevoRegistro, error } = await supabase
      .from('registros_asistencia')
      .insert({
        tipo_registro: tipo,
        ubicacion: ubicacion,
        user_id: userId,
      })
      .select('created_at, tipo_registro, ubicacion')
      .single();

    if (error) {
      setMensaje(`Error al guardar: ${error.message}`);
    } else if (nuevoRegistro) {
      setMensaje(`¡${tipo} marcada con éxito para ${nombre}!`);
      setRegistrosHoy(prev => [...prev, nuevoRegistro]);
      setTodosLosRegistros(prev => [...prev, nuevoRegistro].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    }
    setCargando(false);
  };

  const handleAbrirMapa = (registro: Registro) => {
    if (registro.ubicacion) {
      setRegistroSeleccionado(registro);
      setModalAbierto(true);
    }
  };

  const handleAbrirMapaActual = () => {
    if (ubicacion) {
      const hoy = new Date();
      const registroActual = {
        created_at: hoy.toISOString(),
        tipo_registro: 'Ubicación Actual',
        ubicacion: ubicacion
      };
      setRegistroSeleccionado(registroActual);
      setModalAbierto(true);
    }
  };

  const entradaMarcada = registrosHoy.some(r => r.tipo_registro === 'Entrada');
  const salidaMarcada = registrosHoy.some(r => r.tipo_registro === 'Salida');

  if (cargandoUsuario || cargandoHoy || cargandoRegistros) {
    return <div className="text-center p-6 text-xl lg:text-3xl">Cargando...</div>;
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
                    <div className="text-xl lg:text-3xl pt-5">
                      {ubicacion ? (
                        <button onClick={handleAbrirMapaActual} className="font-semibold text-blue-600 hover:underline">
                          Ver mi ubicación actual
                        </button>
                      ) : (
                        <span className="text-gray-500">Obteniendo ubicación...</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {!entradaMarcada ? (
                      <Button
                        onClick={() => handleMarcarAsistencia('Entrada')}
                        disabled={cargando || !ubicacion}
                        className="w-full bg-green-600 hover:bg-green-700 text-xl lg:text-3xl py-12"
                      >
                        {cargando ? 'Marcando...' : 'Marcar Entrada'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleMarcarAsistencia('Salida')}
                        disabled={cargando || !ubicacion || salidaMarcada}
                        className="w-full bg-red-600 hover:bg-red-700 text-xl lg:text-3xl py-12"
                      >
                        {salidaMarcada ? 'Salida ya marcada' : (cargando ? 'Marcando...' : 'Marcar Salida')}
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 border-t pt-4 ">
                    <h4 className="text-xl lg:text-3xl font-semibold mb-2">Registros de hoy:</h4>
                    {registrosHoy.length > 0 ? (
                      <ul className="space-y-1 text-xl lg:text-3xl  ">
                        {registrosHoy.map((reg, index) => (
                          <li key={index} className={`flex justify-between p-2 rounded-md ${esRegistroAnomalo(reg) ? 'bg-rose-100' : 'bg-slate-100'}`}>
                            <span className="font-mono text-xl lg:text-3xl ">{new Date(reg.created_at).toLocaleTimeString('es-GT')}</span>
                            <span className="font-medium text-xl lg:text-3xl ">{reg.tipo_registro}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xl lg:text-3xl text-gray-500">No hay registros hoy.</p>
                    )}
                  </div>
                </div>

                <Resumen registros={todosLosRegistros} fechaDeReferencia={fechaDeReferencia} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="semanal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Calendario
                todosLosRegistros={todosLosRegistros}
                onAbrirMapa={handleAbrirMapa}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {modalAbierto && registroSeleccionado?.ubicacion && createPortal(
        <div onClick={() => setModalAbierto(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold">
                {registroSeleccionado.tipo_registro === 'Ubicación Actual'
                  ? `Ubicación Actual de ${nombre}`
                  : `Asistencia de ${nombre} - ${format(new Date(registroSeleccionado.created_at), 'PPP', { locale: es })}`
                }
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-500 hover:text-gray-800"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-2">
              <iframe
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_Maps_API_KEY}&q=${registroSeleccionado.ubicacion.lat},${registroSeleccionado.ubicacion.lng}&zoom=16&maptype=satellite`}              >
              </iframe>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}