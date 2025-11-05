'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import useUserData from '@/hooks/sesion/useUserData';
import { es } from 'date-fns/locale';
import { 
  format, 
  isSameDay, 
  getHours, 
  getMinutes, 
  getDay, 
  set, 
  addMinutes, 
  isBefore, 
  isAfter, 
  parseISO 
} from 'date-fns';
import { Clock, CalendarCheck, CalendarDays } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import Calendario from './Calendario';
import Mapa from '../ui/modals/Mapa';
import Cargando from '@/components/ui/animations/Cargando';
import Swal from 'sweetalert2';

import {
  marcarNuevaAsistencia
} from '@/lib/asistencia/acciones';
import useFechaHora from '@/hooks/utility/useFechaHora';
import { useAsistenciaUsuario } from '@/hooks/asistencia/useAsistenciaUsuario';
import useGeolocalizacion from '@/hooks/utility/useGeolocalizacion';

const formatScheduleTime = (timeString: string | null | undefined) => {
  if (!timeString) return '--';
  try {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${minutes} ${period}`;
  } catch (e) {
    return timeString;
  }
};

const formatScheduleDays = (days: number[] | null | undefined): string => {
  if (!days || days.length === 0) return 'Horario no asignado';
  
  if (days.length === 5 && days[0] === 1 && days[1] === 2 && days[2] === 3 && days[3] === 4 && days[4] === 5) {
    return 'Lunes a Viernes';
  }

  if (days.length === 6 && days[0] === 1 && days[1] === 2 && days[2] === 3 && days[3] === 4 && days[4] === 5 && days[5] === 6) {
    return 'Lunes a Sábado';
  }

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days.sort((a, b) => a - b).map(d => dayNames[d] || '?').join(', ');
};

export default function Asistencia() {
  const { 
    userId, 
    nombre, 
    cargando: cargandoUsuario, 
    horario_nombre,
    horario_dias,
    horario_entrada,
    horario_salida 
  } = useUserData();
  
  const { asistencias: todosLosRegistros, loading: cargandoRegistros, fetchAsistencias } = useAsistenciaUsuario(userId, null, null);
  const fechaHoraGt = useFechaHora();
  const { ubicacion, cargando: cargandoGeo, obtenerUbicacion } = useGeolocalizacion();

  const [cargando, setCargando] = useState(false);
  const [notas, setNotas] = useState('');
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });
  const [activeTab, setActiveTab] = useState<'controlResumen' | 'semanal'>('controlResumen');
  const [tipoRegistroPendiente, setTipoRegistroPendiente] = useState<'Entrada' | 'Salida' | null>(null);
  const [notasPendientes, setNotasPendientes] = useState('');

  const {
    estaFueraDeHorario,
    scheduleEntrada,
    scheduleSalida,
    scheduleSalidaTarde,
    horarioFormateado
  } = useMemo(() => {
    const horaEntradaStr = horario_entrada || '08:00:00';
    const horaSalidaStr = horario_salida || '16:00:00';
    const diasLaborales = horario_dias || [1, 2, 3, 4, 5];

    const [hE, mE, sE] = horaEntradaStr.split(':').map(Number);
    const [hS, mS, sS] = horaSalidaStr.split(':').map(Number);

    const scheduleEntrada = set(fechaHoraGt, { hours: hE, minutes: mE, seconds: sE || 0, milliseconds: 0 });
    const scheduleSalida = set(fechaHoraGt, { hours: hS, minutes: mS, seconds: sS || 0, milliseconds: 0 });
    const scheduleSalidaTarde = addMinutes(scheduleSalida, 15);

    const diaDeLaSemana = getDay(fechaHoraGt);
    const esDiaLaboral = diasLaborales.includes(diaDeLaSemana);

    const estaFueraDeHorario = !esDiaLaboral || isBefore(fechaHoraGt, scheduleEntrada) || isAfter(fechaHoraGt, scheduleSalida);
    
    const horarioFormateado = {
      nombre: horario_nombre || 'Normal',
      dias: formatScheduleDays(horario_dias),
      entrada: formatScheduleTime(horario_entrada),
      salida: formatScheduleTime(horario_salida)
    };
    
    return { estaFueraDeHorario, scheduleEntrada, scheduleSalida, scheduleSalidaTarde, horarioFormateado };
  }, [fechaHoraGt, horario_entrada, horario_salida, horario_dias, horario_nombre]);

  const registroEntradaHoy = useMemo(() => {
    if (!todosLosRegistros) return null;
    return todosLosRegistros.find((r: any) =>
      isSameDay(parseISO(r.created_at), fechaHoraGt) && r.tipo_registro === 'Entrada'
    );
  }, [todosLosRegistros, fechaHoraGt]);

  const registroSalidaHoy = useMemo(() => {
    if (!todosLosRegistros) return null;
    return todosLosRegistros.find((r: any) =>
      isSameDay(parseISO(r.created_at), fechaHoraGt) && r.tipo_registro === 'Salida'
    );
  }, [todosLosRegistros, fechaHoraGt]);

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
      handleMarcarAsistencia(tipoRegistroPendiente, ubicacion, notasPendientes);
      setTipoRegistroPendiente(null);
      setNotasPendientes('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubicacion, tipoRegistroPendiente]);

  const handleIniciarMarcado = async (tipo: 'Entrada' | 'Salida') => {
    let notasDeJustificacion = notas;
    let proceder = false;

    if (tipo === 'Salida') {
      const esSalidaTemprana = isBefore(fechaHoraGt, scheduleSalida);
      const esSalidaTarde = isAfter(fechaHoraGt, scheduleSalidaTarde);

      if (esSalidaTemprana || esSalidaTarde) {
        const motivo = esSalidaTemprana ? 'antes' : 'después';
        const titulo = esSalidaTemprana ? 'Justificación de Salida Temprana' : 'Justificación de Salida Tarde';
        
        const { value: notasSwal, isConfirmed } = await Swal.fire({
          title: titulo,
          text: `Está marcando su salida ${motivo} del horario asignado (${format(scheduleSalida, 'h:mm a', { locale: es })}). Por favor, ingrese una justificación.`,
          input: 'textarea',
          inputPlaceholder: 'Escriba su justificación aquí...',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Marcar Salida',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value) {
              return '¡Necesita escribir una justificación para marcar su salida!';
            }
          }
        });

        if (isConfirmed && notasSwal) {
          if (esSalidaTemprana) {
            notasDeJustificacion = `Salida Temprano: ${notasSwal}`;
          } else {
            notasDeJustificacion = `Salida Tarde: ${notasSwal}`;
          }
          proceder = true;
        }
      } else {
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
          proceder = true;
        }
      }
    } else {
      const scheduleEntradaTarde = addMinutes(scheduleEntrada, 15);
      const esEntradaTarde = isAfter(fechaHoraGt, scheduleEntradaTarde);

      if (esEntradaTarde) {
        const { value: notasSwal, isConfirmed } = await Swal.fire({
          title: 'Justificación de Entrada Tarde',
          text: `Está marcando su entrada después del límite de 15 minutos (${format(scheduleEntradaTarde, 'h:mm a', { locale: es })}). Por favor, ingrese una justificación.`,
          input: 'textarea',
          inputPlaceholder: 'Escriba su justificación aquí...',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Marcar Entrada',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (!value) {
              return '¡Necesita escribir una justificación para marcar su entrada!';
            }
          }
        });

        if (isConfirmed && notasSwal) {
          notasDeJustificacion = `Entrada Tarde: ${notasSwal}`;
          proceder = true;
        }
      } else {
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
          proceder = true;
        }
      }
    }

    if (proceder) {
      setNotasPendientes(notasDeJustificacion);
      setTipoRegistroPendiente(tipo);
      obtenerUbicacion();
    }
  };

  const handleMarcarAsistencia = async (tipo: string, ubicacionActual: { lat: number; lng: number }, notasDeMarcado: string) => {
    setCargando(true);
    if (!userId) {
      Swal.fire('Error', 'No se encontró el ID de usuario.', 'error');
      setCargando(false);
      return;
    }

    const nuevoRegistro = await marcarNuevaAsistencia(userId, tipo, ubicacionActual, notasDeMarcado);

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
      <div className="w-full xl:max-w-3xl mx-auto">
        <div className="border-b flex mb-4 flex-wrap justify-center">
          <button onClick={() => setActiveTab('controlResumen')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${activeTab === 'controlResumen' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            <Clock className="h-4 w-4" /> Asistencia
          </button>
          <button onClick={() => setActiveTab('semanal')} className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${activeTab === 'semanal' ? ' border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            <CalendarCheck className="h-4 w-4" /> Registro Semanal
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'controlResumen' ? (
            <motion.div key="controlResumen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="flex flex-col gap-8 w-full">
                <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
                  
                  <div className="text-center bg-slate-100 p-3 rounded-md">
                    <p className="font-semibold text-xs lg:text-sm">{nombre || 'Usuario no identificado'}</p>
                  </div>
                                    <div className="text-center text-xs font-semibold text-blue-600 flex flex-col lg:flex-row justify-center lg:gap-4">
                    <p className='pb-2'>
                      Horario: {horarioFormateado.nombre}
                    </p>
                     <p className="flex items-center justify-center gap-1 pb-2">
                      <Clock className="h-3 w-3" />
                      {horarioFormateado.entrada} a {horarioFormateado.salida}
                    </p>
                    <p className="flex items-center justify-center gap-1 pb-2">
                      <CalendarDays className="h-3 w-3" />
                      {horarioFormateado.dias}
                    </p>

                  </div>
                  {
                    !salidaMarcada && (
                      <>
                      <div className="text-center border-y py-4">
                        <p className="text-xs lg:text-sm text-slate-600">
                          <span className="capitalize">
                            {format(fechaHoraGt, "EEEE, dd/MM/yyyy", { locale: es })}
                          </span>
                            <span className={`font-mono font-bold ml-2 ${estaFueraDeHorario ? 'text-red-700' : ''}`}>
                              {format(fechaHoraGt, 'hh:mm:ss aa', { locale: es })}
                            </span>
                        </p>
                      </div>
                        
                        <div className="flex gap-4 items-stretch">
                          <textarea 
                            value={notas} 
                            onChange={(e) => setNotas(e.target.value)} 
                            placeholder="Agregar notas (opcional para entrada)..." 
                            className="w-3/5 md:w-4/5 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs lg:text-sm"
                          />
                          
                          <div className="w-2/5 md:w-1/5">
                            {!entradaMarcada ? (
                              <Button onClick={() => handleIniciarMarcado('Entrada')} disabled={cargando || cargandoGeo} className="w-full h-full bg-green-600 hover:bg-green-700 text-xs lg:text-sm">
                                {cargandoGeo ? 'Obteniendo ubicación...' : (cargando ? 'Marcando...' : 'Marcar Entrada')}
                              </Button>
                            ) : (
                              <Button onClick={() => handleIniciarMarcado('Salida')} disabled={cargando || cargandoGeo} className="w-full h-full bg-red-600 hover:bg-red-700 text-xs lg:text-sm">
                                {cargandoGeo ? 'Obteniendo ubicación...' : (cargando ? 'Marcando...' : 'Marcar Salida')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  }

                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-xs lg:text-sm font-semibold mb-2">Registros de hoy:</h4>
                    {(registroEntradaHoy || registroSalidaHoy) ? (
                      <>
                        <p className="text-xs text-gray-500 mb-2">Haga clic en el registro para ver las ubicaciones.</p>
                        <div 
                          onClick={handleAbrirMapaHoy}
                          className="p-3 rounded-md bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors flex justify-between items-center gap-4"
                        >
                          <p className="text-xs lg:text-sm font-mono">
                            <span className="font-semibold">Entrada:</span> {formatTimeWithAMPM(registroEntradaHoy?.created_at)}
                          </p>
                          <p className="text-xs lg:text-sm font-mono">
                            <span className="font-semibold">Salida:</span> {formatTimeWithAMPM(registroSalidaHoy?.created_at)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs lg:text-sm text-gray-500">No hay registros hoy.</p>
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