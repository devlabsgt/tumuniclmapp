'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, getMonth, getYear, setMonth, parseISO, isToday, isPast, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CalendarCheck, Users, CalendarClock } from 'lucide-react';

import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Cargando from '@/components/ui/animations/Cargando';
import { Usuario } from '@/lib/usuarios/esquemas';
import Mapa from '@/components/asistencia/modal/Mapa'; 
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';

import VerComision from '../VerComision';
import AsistenciaComision from './AsistenciaComision';

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);
const timeZone = 'America/Guatemala';

export default function MisComisiones() {
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [openComisionId, setOpenComisionId] = useState<string | null>(null);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<any>(null);
  const [nombreUsuarioParaMapa, setNombreUsuarioParaMapa] = useState('');
  const [vista, setVista] = useState<'proximas' | 'terminadas'>('proximas');
  
  const { userId, nombre, cargando: cargandoUsuario } = useUserData();
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado, userId);
  
  useEffect(() => {
    const html = document.documentElement;
    if (modalMapaAbierto) {
      html.classList.add('overflow-hidden');
    } else {
      html.classList.remove('overflow-hidden');
    }
    return () => {
      html.classList.remove('overflow-hidden');
    };
  }, [modalMapaAbierto]);

  const comisionesParaMostrar = useMemo(() => {
    let comisionesFiltradas = comisiones || [];

    // Filtrar por vista (Próximas o Terminadas)
    const ahora = new Date();
    comisionesFiltradas = comisionesFiltradas.filter(c => {
        const fechaComision = parseISO(c.fecha_hora.replace(' ', 'T'));
        const esPasada = isPast(fechaComision) && !isToday(fechaComision);
        if (vista === 'proximas') {
            return !esPasada;
        } else {
            return esPasada;
        }
    });

    // Si hay una comisión abierta, mostrar solo esa
    if (openComisionId) {
        return comisionesFiltradas.filter(c => c.id === openComisionId);
    }
    
    return comisionesFiltradas;
  }, [comisiones, openComisionId, vista]);

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    if (!comisionesParaMostrar) return grupos;

    comisionesParaMostrar.forEach(comision => {
      const fecha = parseISO(comision.fecha_hora.replace(' ', 'T'));
      const fechaClave = format(fecha, 'EEEE d', { locale: es });
      if (!grupos[fechaClave]) {
        grupos[fechaClave] = [];
      }
      grupos[fechaClave].push(comision);
    });
    return grupos;
  }, [comisionesParaMostrar]);

  const handleToggleComision = (comisionId: string) => {
    setOpenComisionId(prevId => (prevId === comisionId ? null : comisionId));
  };

  const handleAbrirMapa = (registros: any, nombreUsuario: string) => {
    setRegistrosParaMapa(registros);
    setNombreUsuarioParaMapa(nombreUsuario);
    setModalMapaAbierto(true);
  };
  
  const handleCerrarMapa = () => {
    setModalMapaAbierto(false);
    setRegistrosParaMapa(null);
    setNombreUsuarioParaMapa('');
  };

  const handleAsistenciaMarcada = () => {
    refetch();
  };

  if (loading || cargandoUsuario) {
    return <Cargando texto='Cargando sus comisiones...' />;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">Error: {error}</p>;
  }

  return (
    <>
      <div className="bg-white rounded-lg w-full mx-auto">
        <div className="flex flex-col gap-4 border-b pb-5 mb-5">
<div className="border-b flex mb-4 flex-wrap justify-center">
    <button 
        onClick={() => setVista('proximas')} 
        className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'proximas' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
    >
        <CalendarCheck className="h-4 w-4" /> Próximas
    </button>
    <button 
        onClick={() => setVista('terminadas')} 
        className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs lg:text-sm ${vista === 'terminadas' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500'}`}
    >
        <CalendarCheck className="h-4 w-4" /> Terminadas
    </button>
</div>
            <div className='flex gap-2 items-center justify-center md:justify-start'>
                <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 capitalize">
                    {meses.map((mes, index) => <option key={index} value={index}>{mes}</option>)}
                </select>
                <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
                </select>
            </div>
        </div>

        <div className="space-y-8">
          {Object.keys(comisionesAgrupadasPorFecha).length === 0 ? (
            <p className="text-center text-gray-500 py-10">No tiene comisiones asignadas para este mes.</p>
          ) : (
            Object.entries(comisionesAgrupadasPorFecha).map(([fecha, comisionesDelDia]) => (
              <div key={fecha}>
                <h3 className="text-xs md:text-lg font-bold text-blue-500 mb-3 capitalize">{fecha}</h3>
                <div className="space-y-4">
                  {comisionesDelDia.map(comision => {
                    const usuariosDeLaComision = (comision.asistentes?.map(a => ({ id: a.id, nombre: a.nombre })) || []) as Usuario[];
                    const isOpen = openComisionId === comision.id;
                    const fechaHora = parseISO(comision.fecha_hora.replace(' ', 'T'));
                    const esHoy = isToday(fechaHora);

                    const ahora = new Date();
                    const fechaComision = toZonedTime(fechaHora, timeZone);
                    const diasRestantes = differenceInCalendarDays(fechaComision, ahora);
                    const integrantesCount = comision.asistentes?.length || 0;

                    let textoDias = '';
                    let colorDias = 'text-gray-500';

                    if (isToday(fechaComision)) {
                      textoDias = 'Hoy';
                      colorDias = 'text-blue-600 font-semibold';
                    } else if (diasRestantes === 1) {
                      textoDias = 'Mañana';
                      colorDias = 'text-green-600';
                    } else if (diasRestantes > 1) {
                      textoDias = `En ${diasRestantes} días`;
                      colorDias = 'text-green-600';
                    } else if (diasRestantes === -1) {
                      textoDias = 'Ayer';
                      colorDias = 'text-red-500';
                    } else if (diasRestantes < -1) {
                      textoDias = `Hace ${Math.abs(diasRestantes)} días`;
                      colorDias = 'text-red-500';
                    }

                    return (
                      <div key={comision.id} className="rounded-xl border border-gray-200 overflow-hidden relative">
                        <div className="cursor-pointer p-4" onClick={() => handleToggleComision(comision.id)}>
                          <div className="flex justify-between items-center">
                            {isOpen ? (
                              <div className='flex-grow'>
                                {esHoy ? (
                                  <p className="text-lg font-semibold text-gray-600">Recuerda marcar tu asistencia</p>
                                ) : (
                                  <p className="text-lg font-semibold text-gray-600">Detalles de la comisión</p>
                                )}
                              </div>
                            ) : (
                            <div className='flex-grow flex flex-col md:gap-3'>
                                <div className="flex items-center justify-between gap-2 pr-2">
                                    <h4 className="text-xs font-bold text-gray-800">{comision.titulo}</h4>
                                    <div className="flex items-center gap-1 text-blue-600">
                                        <Users size={12} />
                                        <span>{integrantesCount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 pr-2">
                                    <p className="text-xs  text-gray-700 whitespace-nowrap capitalize">{format(fechaHora, 'h:mm a', { locale: es })}</p>
                                    <div className={`flex items-center gap-1 ${colorDias}`}>
                                        <CalendarClock size={12} />
                                        <span>{textoDias}</span>
                                    </div>
                                </div>
                            </div>
                            )}
                            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div>
                                <div className="[&_.exclude-from-capture]:hidden [&>div]:shadow-none [&>div]:border-none">
                                  <VerComision
                                    comision={comision}
                                    usuarios={usuariosDeLaComision}
                                    rol={null}
                                    onClose={() => {}}
                                    onAbrirMapa={handleAbrirMapa}
                                    onEdit={() => {}}
                                    onDelete={() => {}}
                                  />
                                </div>
                                {esHoy && (
                                  <AsistenciaComision 
                                    comision={comision} 
                                    userId={userId!} 
                                    nombreUsuario={nombre!} 
                                    onAsistenciaMarcada={handleAsistenciaMarcada}
                                  />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalMapaAbierto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Mapa
              isOpen={modalMapaAbierto}
              onClose={handleCerrarMapa}
              registros={registrosParaMapa}
              nombreUsuario={nombreUsuarioParaMapa}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}