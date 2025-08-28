'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import useUserData from '@/hooks/useUserData';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { X, Clock, CalendarCheck, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendario from './Calendario';
import Mapa from './modal/Mapa';
import Cargando from '@/components/ui/animations/Cargando'; 
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';


const supabase = createClient();

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
}

export default function Asistencia() {
  const { userId, nombre, cargando: cargandoUsuario } = useUserData();

  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [notas, setNotas] = useState('');

  const [fechaHoraGt, setFechaHoraGt] = useState(new Date());

  const [registrosHoy, setRegistrosHoy] = useState<Registro[]>([]);
  const [cargandoHoy, setCargandoHoy] = useState(true);

  const [todosLosRegistros, setTodosLosRegistros] = useState<Registro[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(true);

  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Registro | null>(null);
  
  const [modalNotasAbierto, setModalNotasAbierto] = useState(false);
  const [notaSeleccionada, setNotaSeleccionada] = useState('');
  
  // Nuevo estado para el modal de opciones
  const [modalOpcionesAbierto, setModalOpcionesAbierto] = useState(false);


  const [activeTab, setActiveTab] = useState<'controlResumen' | 'semanal'>('controlResumen');

  useEffect(() => {
    const timerId = setInterval(() => {
      setFechaHoraGt(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Hook para controlar el scroll del body
  useEffect(() => {
    if (modalMapaAbierto || modalNotasAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalMapaAbierto, modalNotasAbierto]);

  const verificarAsistenciaHoy = async () => {
    if (!userId) return;
    setCargandoHoy(true);
    const hoyEnGt = new Date();

    const inicioDelDiaUtc = new Date(hoyEnGt.getFullYear(), hoyEnGt.getMonth(), hoyEnGt.getDate()).toISOString();
    const finDelDiaUtc = new Date(hoyEnGt.getFullYear(), hoyEnGt.getMonth(), hoyEnGt.getDate() + 1).toISOString();

    const { data } = await supabase
      .from('registros_asistencia')
      .select('created_at, tipo_registro, ubicacion, notas')
      .eq('user_id', userId)
      .gte('created_at', inicioDelDiaUtc)
      .lt('created_at', finDelDiaUtc);

    setRegistrosHoy(data || []);
    setCargandoHoy(false);
  };

  // 💡 Nuevo useEffect para verificar la asistencia cada día
  useEffect(() => {
    if (userId) {
      const hoyEnGt = new Date();
      const fechaHoyFormato = hoyEnGt.toISOString().split('T')[0]; // Ejemplo: '2025-08-28'
      
      const interval = setInterval(() => {
        const nuevaFechaHoy = new Date().toISOString().split('T')[0];
        if (nuevaFechaHoy !== fechaHoyFormato) {
          verificarAsistenciaHoy();
        }
      }, 60000); // 💡 Verifica cada minuto
      
      verificarAsistenciaHoy(); // 💡 Llama a la función al inicio
      return () => clearInterval(interval);
    }
  }, [userId, fechaHoraGt.toISOString().split('T')[0]]);

  useEffect(() => {
    if (!userId) return;
    const consultarTodosLosRegistros = async () => {
      setCargandoRegistros(true);
      const { data } = await supabase
        .from('registros_asistencia')
        .select('created_at, tipo_registro, ubicacion, notas')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      setTodosLosRegistros(data || []);
      setCargandoRegistros(false);
    };
    consultarTodosLosRegistros();
  }, [userId]);


  const handleMarcarAsistencia = async (tipo: string) => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'Su navegador no soporta la geolocalización.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: `¿Quiere marcar su ${tipo} ahora?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, marcar ${tipo}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setCargando(true);
      setMensaje('');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const ubicacionActual = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUbicacion(ubicacionActual);

          const { data: nuevoRegistro, error } = await supabase
            .from('registros_asistencia')
            .insert({
              tipo_registro: tipo,
              ubicacion: ubicacionActual,
              user_id: userId,
              notas: notas,
            })
            .select('created_at, tipo_registro, ubicacion, notas')
            .single();

          if (error) {
            Swal.fire('Error', `Error al guardar: ${error.message}`, 'error');
          } else if (nuevoRegistro) {
            Swal.fire({
              title: `¡${tipo} Marcada!`,
              text: `Se ha registrado su ${tipo.toLowerCase()} correctamente.`,
              icon: 'success',
              confirmButtonText: 'Aceptar',
            });
            setMensaje(`¡${tipo} marcada con éxito para ${nombre}!`);
            setRegistrosHoy(prev => [...prev, nuevoRegistro]);
            setTodosLosRegistros(prev => [...prev, nuevoRegistro].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            setNotas('');
          }
          setCargando(false);
        },
        () => {
          Swal.fire('Error', 'No se pudo obtener la ubicación. Por favor, asegúrese de que la geolocalización esté habilitada.', 'error');
          setCargando(false);
        }
      );
    }
  };


  const handleAbrirMapa = (registro: Registro) => {
    if (registro.ubicacion) {
      setRegistroSeleccionado(registro);
      setModalMapaAbierto(true);
    }
  };

  // Funciones para el nuevo modal de opciones
  const handleAbrirModalOpciones = (registro: Registro) => {
    setRegistroSeleccionado(registro);
    setModalOpcionesAbierto(true);
  };

  const handleVerUbicacion = () => {
    setModalOpcionesAbierto(false);
    if (registroSeleccionado) {
      handleAbrirMapa(registroSeleccionado);
    }
  };


  const handleVerNotas = (nota: string | null) => {
    setModalOpcionesAbierto(false); // Cierra el modal de opciones si se llama desde él
    setNotaSeleccionada(nota || 'No se han agregado notas para este registro.');
    setModalNotasAbierto(true);
  };
  
  const entradaMarcada = registrosHoy.some(r => r.tipo_registro === 'Entrada');
  const salidaMarcada = registrosHoy.some(r => r.tipo_registro === 'Salida');

  if (cargandoUsuario || cargandoHoy || cargandoRegistros) {
    return <Cargando texto='Asistencia...'/>;
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
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <p className="font-mono text-xl lg:text-3xl font-bold">
                        {fechaHoraGt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <textarea 
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Agregar notas..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    {!entradaMarcada ? (
                      <Button
                        onClick={() => handleMarcarAsistencia('Entrada')}
                        disabled={cargando}
                        className="w-full bg-green-600 hover:bg-green-700 text-xl lg:text-3xl py-12"
                      >
                        {cargando ? 'Marcando...' : 'Marcar Entrada'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleMarcarAsistencia('Salida')}
                        disabled={cargando || salidaMarcada}
                        className="w-full bg-red-600 hover:bg-red-700 text-xl lg:text-3xl py-12"
                      >
                        {salidaMarcada ? 'Salida ya marcada' : (cargando ? 'Marcando...' : 'Marcar Salida')}
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 border-t pt-4 ">
                    <h4 className="text-xl lg:text-3xl font-semibold mb-2">Registros de hoy:</h4>
                    <p className="text-xs text-gray-500 mb-2">Haga clic en un registro para ver las notas.</p>
                    {registrosHoy.length > 0 ? (
                      <ul className="space-y-1 text-xl lg:text-3xl  ">
                        {registrosHoy.map((reg, index) => (
                          <li 
                            key={index} 
                            onClick={() => handleAbrirModalOpciones(reg)} 
                            className={`flex justify-between p-2 rounded-md bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors`}>
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
              </div>
            </motion.div>
          ) : (
            <motion.div key="semanal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <Calendario
                todosLosRegistros={todosLosRegistros}
                onAbrirMapa={handleAbrirMapa}
                onVerNotas={handleVerNotas}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Modal para Mapa */}
      <AnimatePresence>
        {modalMapaAbierto && registroSeleccionado?.ubicacion && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registro={registroSeleccionado}
            nombreUsuario={nombre}
          />
        )}
      </AnimatePresence>
      {/* Modal para Notas */}
      <AnimatePresence>
        {modalNotasAbierto && (
          <Transition show={modalNotasAbierto} as={Fragment}>
            <Dialog onClose={() => setModalNotasAbierto(false)} className="relative z-50">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
              </TransitionChild>
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                    <DialogTitle className="text-xl font-bold mb-4 flex justify-between items-center">
                      Notas del registro
                      <button onClick={() => setModalNotasAbierto(false)} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                      </button>
                    </DialogTitle>
                    <p className="text-gray-700 whitespace-pre-line">{notaSeleccionada}</p>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </Dialog>
          </Transition>
        )}
      </AnimatePresence>

      {/* Nuevo Modal de Opciones */}
      <AnimatePresence>
        {modalOpcionesAbierto && (
          <Transition show={modalOpcionesAbierto} as={Fragment}>
            <Dialog onClose={() => setModalOpcionesAbierto(false)} className="relative z-50">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
              </TransitionChild>
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                    <DialogTitle className="text-xl font-bold mb-4 flex justify-between items-center">
                      Opciones
                      <button onClick={() => setModalOpcionesAbierto(false)} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                      </button>
                    </DialogTitle>
                    <div className="flex flex-col gap-4">
                      {registroSeleccionado?.ubicacion && (
                        <Button
                          onClick={handleVerUbicacion}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <MapPin size={20} /> Ver Ubicación
                        </Button>
                      )}
                      <Button
                        onClick={() => handleVerNotas(registroSeleccionado?.notas || null)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <FileText size={20} /> Ver Notas
                      </Button>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </Dialog>
          </Transition>
        )}
      </AnimatePresence>
    </>
  );
}