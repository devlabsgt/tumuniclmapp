'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import useUserData from '@/hooks/useUserData';
import { es } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addDays, subDays, getYear, getMonth, isSameDay } from 'date-fns';
import { X } from 'lucide-react';

const supabase = createClient();

interface Registro {
  fecha: string;
  hora: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
}

const esRegistroAnomalo = (registro: Registro): boolean => {
  if (!registro.tipo_registro) return false;
  // HORAS UTC: 08:09 AM GT = 14:09 UTC | 04:00 PM GT = 22:00 UTC
  const esEntradaTardia = registro.tipo_registro === 'Entrada' && registro.hora > '14:09:59';
  const esSalidaTemprana = registro.tipo_registro === 'Salida' && registro.hora < '22:00:00';
  return esEntradaTardia || esSalidaTemprana;
};

export default function Asistencia() {
  const { userId, nombre, cargando: cargandoUsuario } = useUserData();
  
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());

  const [registrosHoy, setRegistrosHoy] = useState<Registro[]>([]);
  const [cargandoHoy, setCargandoHoy] = useState(true);
  
  const [registrosDeLaSemana, setRegistrosDeLaSemana] = useState<Registro[]>([]);
  const [cargandoSemana, setCargandoSemana] = useState(true);

  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>(undefined);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Registro | null>(null);

  const inicioDeSemana = startOfWeek(fechaDeReferencia, { locale: es });
  const diasDeLaSemana = eachDayOfInterval({ start: inicioDeSemana, end: endOfWeek(fechaDeReferencia, { locale: es }) });

  const irSemanaSiguiente = () => setFechaDeReferencia(addDays(fechaDeReferencia, 7));
  const irSemanaAnterior = () => setFechaDeReferencia(subDays(fechaDeReferencia, 7));
  
  const handleSeleccionFecha = (anio: number, mes: number) => {
    const nuevaFecha = new Date(anio, mes, 1);
    setFechaDeReferencia(startOfWeek(nuevaFecha, { locale: es }));
  };
  
  const handleSeleccionDia = (dia: Date) => {
    const yaEstaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
    setDiaSeleccionado(yaEstaSeleccionado ? undefined : dia);
  };

  useEffect(() => {
    const timerId = setInterval(() => setFechaHora(new Date()), 1000);
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

  useEffect(() => {
    if (!userId) return;
    const verificarAsistenciaHoy = async () => {
      setCargandoHoy(true);
      const { data } = await supabase
        .from('registros_asistencia')
        .select('fecha, hora, tipo_registro, ubicacion')
        .eq('user_id', userId)
        .eq('fecha', format(new Date(), 'yyyy-MM-dd'));
      setRegistrosHoy(data || []);
      setCargandoHoy(false);
    };
    verificarAsistenciaHoy();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const consultarSemana = async () => {
      setDiaSeleccionado(undefined);
      setCargandoSemana(true);
      
      const inicio = startOfWeek(fechaDeReferencia, { locale: es });
      const fin = endOfWeek(fechaDeReferencia, { locale: es });
      
      const { data } = await supabase
        .from('registros_asistencia')
        .select('fecha, hora, tipo_registro, ubicacion')
        .eq('user_id', userId)
        .gte('fecha', format(inicio, 'yyyy-MM-dd'))
        .lte('fecha', format(fin, 'yyyy-MM-dd'))
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true });
      setRegistrosDeLaSemana(data || []);
      setCargandoSemana(false);
    };
    consultarSemana();
  }, [userId, fechaDeReferencia]);

  const handleMarcarAsistencia = async (tipo: string) => {
    if (!ubicacion) {
      setMensaje('Error: No se ha podido determinar la ubicación.');
      return;
    }
    setCargando(true);
    setMensaje('');
    const hoy = new Date();
    const { data: nuevoRegistro, error } = await supabase
      .from('registros_asistencia')
      .insert({ 
        tipo_registro: tipo, 
        ubicacion: ubicacion, 
        user_id: userId,
        fecha: format(hoy, 'yyyy-MM-dd')
      })
      .select('fecha, hora, tipo_registro, ubicacion')
      .single();

    if (error) {
      setMensaje(`Error al guardar: ${error.message}`);
    } else if (nuevoRegistro) {
      setMensaje(`¡${tipo} marcada con éxito para ${nombre}!`);
      setRegistrosHoy(prev => [...prev, nuevoRegistro]);
      if (isSameDay(hoy, fechaDeReferencia)) {
          setRegistrosDeLaSemana(prev => [...prev, nuevoRegistro].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()));
      }
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
      const registroActual = {
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora: new Date().toTimeString().split(' ')[0],
        tipo_registro: 'Ubicación Actual',
        ubicacion: ubicacion
      };
      setRegistroSeleccionado(registroActual);
      setModalAbierto(true);
    }
  };

  const entradaMarcada = registrosHoy.some(r => r.tipo_registro === 'Entrada');
  const salidaMarcada = registrosHoy.some(r => r.tipo_registro === 'Salida');

  const registrosAgrupadosPorDia = registrosDeLaSemana.reduce((acc, registro) => {
    const fecha = registro.fecha;
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(registro);
    return acc;
  }, {} as Record<string, Registro[]>);
  
  const registrosAMostrar = diaSeleccionado 
    ? { [format(diaSeleccionado, 'yyyy-MM-dd')]: registrosAgrupadosPorDia[format(diaSeleccionado, 'yyyy-MM-dd')] || [] }
    : registrosAgrupadosPorDia;


  if (cargandoUsuario || cargandoHoy) {
    return <div className="text-center p-6">Cargando...</div>;
  }
  
  return (
    <>
      {/* --- CAMBIO: Este div ahora controla el layout principal --- */}
      <div className="flex flex-col lg:flex-row justify-center items-start gap-8">
        {/* Columna Izquierda: Control de Asistencia */}
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md space-y-4 w-full">
          <h2 className="text-2xl font-bold text-center">Control de Asistencia</h2>
          <div className="text-center bg-slate-100 p-3 rounded-md">
            <p className="font-semibold text-lg">{nombre || 'Usuario no identificado'}</p>
          </div>
          
          <div className="text-center border-y py-4 space-y-2">
            <p className="text-lg capitalize text-slate-600">
              {format(fechaHora, "eeee, dd/MM/yyyy", { locale: es })}
            </p>
            <p className="font-mono text-3xl font-bold">
              {fechaHora.toLocaleTimeString('es-GT')}
            </p>
            <div className="text-sm pt-1">
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
              <Button onClick={() => handleMarcarAsistencia('Entrada')} disabled={cargando || !ubicacion} className="w-full bg-green-600 hover:bg-green-700">
                {cargando ? 'Marcando...' : 'Marcar Entrada'}
              </Button>
            ) : (
              <Button onClick={() => handleMarcarAsistencia('Salida')} disabled={cargando || !ubicacion || salidaMarcada} className="w-full bg-red-600 hover:bg-red-700">
                {salidaMarcada ? 'Salida ya marcada' : (cargando ? 'Marcando...' : 'Marcar Salida')}
              </Button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Registro Semanal */}
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md space-y-4 w-full">
          <h3 className="text-xl font-bold text-center">Registro Semanal</h3>
          <div className="flex justify-between items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <button onClick={irSemanaAnterior} className="p-2 rounded-full hover:bg-slate-200" aria-label="Semana anterior"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
            <div className='flex gap-2'>
              <select value={getMonth(fechaDeReferencia)} onChange={(e) => handleSeleccionFecha(getYear(fechaDeReferencia), parseInt(e.target.value))} className="p-1 border rounded-md text-sm bg-white" aria-label="Seleccionar mes">
                {Array.from({ length: 12 }).map((_, i) => (<option key={i} value={i} className="capitalize">{format(new Date(2000, i, 1), 'LLLL', { locale: es })}</option>))}
              </select>
              <select value={getYear(fechaDeReferencia)} onChange={(e) => handleSeleccionFecha(parseInt(e.target.value), getMonth(fechaDeReferencia))} className="p-1 border rounded-md text-sm bg-white" aria-label="Seleccionar año">
                {Array.from({ length: 10 }).map((_, i) => { const anio = getYear(new Date()) - 5 + i; return <option key={anio} value={anio}>{anio}</option>; })}
              </select>
            </div>
            <button onClick={irSemanaSiguiente} className="p-2 rounded-full hover:bg-slate-200" aria-label="Siguiente semana"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
          </div>

          <div className="flex justify-around items-center">
            {diasDeLaSemana.map((dia) => {
              const esDiaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
              return (
                <div key={dia.toString()} onClick={() => handleSeleccionDia(dia)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-md transition-all cursor-pointer ${isToday(dia) && !esDiaSeleccionado ? 'bg-blue-100 text-blue-800' : ''} ${esDiaSeleccionado ? 'bg-blue-600 text-white font-bold shadow-lg scale-110' : 'hover:bg-slate-100 text-slate-600'}`}>
                  <span className="text-xs uppercase">{format(dia, 'eee', { locale: es })}</span>
                  <span className="text-lg">{format(dia, 'd')}</span>
                </div>
              );
            })}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className='text-md font-semibold text-center mb-2'>{diaSeleccionado ? `Registros para el ${format(diaSeleccionado, 'eeee d', { locale: es })}` : 'Todos los registros de la semana'}</h4>
            {cargandoSemana ? (<p className="text-center text-gray-500">Cargando registros...</p>) : Object.keys(registrosAMostrar).length > 0 && Object.values(registrosAMostrar).some(arr => arr && arr.length > 0) ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-2">Hora</th>
                    <th className="px-4 py-2">Registro</th>
                    <th className="px-4 py-2">Ubicación</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(registrosAMostrar).map(fecha => (
                    <React.Fragment key={fecha}>
                      {!diaSeleccionado && (<tr><td colSpan={3} className="bg-slate-100 px-4 py-2 font-bold text-slate-700 border-t border-b border-slate-200">{format(new Date(fecha + 'T00:00:00'), 'eeee, d \'de\' LLLL', { locale: es })}</td></tr>)}
                      {(registrosAMostrar[fecha] || []).map((registro, index) => (
                        <tr key={index} className={`border-b ${esRegistroAnomalo(registro) ? 'bg-rose-50 text-rose-800' : ''}`}>
                          <td className="px-4 py-2 font-mono">{new Date(`1970-01-01T${registro.hora}Z`).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-2">{registro.tipo_registro}</td>
                          <td className="px-4 py-2">{registro.ubicacion && (<button onClick={() => handleAbrirMapa(registro)} className="text-blue-600 hover:underline font-medium">Ver mapa</button>)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (<p className="text-center text-gray-500">{diaSeleccionado ? 'No hay registros para este día.' : 'No hay registros para esta semana.'}</p>)}
          </div>
        </div>
      </div>

      {modalAbierto && registroSeleccionado?.ubicacion && createPortal(
        <div onClick={() => setModalAbierto(false)} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-base font-semibold">
                {registroSeleccionado.tipo_registro === 'Ubicación Actual' 
                  ? `Ubicación Actual de ${nombre}`
                  : `Asistencia de ${nombre} - ${format(new Date(registroSeleccionado.fecha + 'T00:00:00'), 'PPP', { locale: es })}`
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