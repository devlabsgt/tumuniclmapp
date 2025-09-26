'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, setMonth, parseISO, isPast, isToday, differenceInCalendarDays } from 'date-fns';
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ComisionForm from './forms/Comision';
import VerComision from './VerComision';
import VerComisiones from './VerComisiones';
import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Swal from 'sweetalert2';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/asistencia/modal/Mapa';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CalendarClock, CheckSquare, Square, CalendarCheck } from 'lucide-react';

// --- FUNCIÓN HELPER ---
const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

// --- COMPONENTE PRINCIPAL ---
export default function Ver({ usuarios }: { usuarios: Usuario[] }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [comisionAEditar, setComisionAEditar] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionAVer, setComisionAVer] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionesSeleccionadas, setComisionesSeleccionadas] = useState<ComisionConFechaYHoraSeparada[]>([]);
  const [comisionesAVerMultiples, setComisionesAVerMultiples] = useState<ComisionConFechaYHoraSeparada[] | null>(null);

  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });
  const [nombreParaMapa, setNombreParaMapa] = useState('');

  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [vista, setVista] = useState<'proximas' | 'terminadas'>('proximas');

  const { rol, cargando } = useUserData();
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado);

  const timeZone = 'America/Guatemala';

  useEffect(() => {
     if (comisionAVer && comisiones) {
      const comisionActualizada = comisiones.find(c => c.id === comisionAVer.id);
      setComisionAVer(comisionActualizada || null);
    }
  }, [comisiones, comisionAVer]);

  useEffect(() => {
    setComisionAVer(null);
    setComisionesAVerMultiples(null);
    setComisionesSeleccionadas([]);
  }, [mesSeleccionado, anioSeleccionado]);

  const handleCrearComision = () => {
    setComisionAEditar(null);
    setComisionAVer(null);
    setComisionesAVerMultiples(null);
    setModalAbierto(true);
  };

  const handleEditarComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAEditar(comision);
    setModalAbierto(true);
  };

  const handleEliminarComision = async (comisionId: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?', text: "Esta acción no se puede deshacer.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/comision`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: comisionId }),
        });
        if (res.ok) {
          Swal.fire('¡Eliminada!', 'La comisión ha sido eliminada.', 'success');
          refetch();
          setComisionAVer(null);
        } else {
          const { error } = await res.json();
          Swal.fire('Error', error || 'No se pudo eliminar la comisión.', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Hubo un problema de conexión.', 'error');
      }
    }
  };

  const handleVerComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAVer(comision);
    setComisionesAVerMultiples(null);
  };

  const handleGuardado = () => { refetch(); };

  const handleAbrirMapa = (registrosDeUsuario: { entrada: any, salida: any }, nombreDeUsuario: string) => {
    setRegistrosParaMapa(registrosDeUsuario);
    setNombreParaMapa(nombreDeUsuario);
    setModalMapaAbierto(true);
  };
  
  const handleSeleccionarComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionesSeleccionadas(prev =>
      prev.some(c => c.id === comision.id)
        ? prev.filter(c => c.id !== comision.id)
        : [...prev, comision]
    );
  };

  const handleVerMultiplesComisiones = () => {
    setComisionAVer(null);
    const comisionesOrdenadas = [...comisionesSeleccionadas].sort((a,b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
    setComisionesAVerMultiples(comisionesOrdenadas);
  };
  
  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisiones) return [];
    
    // Filtro por término de búsqueda
    const termino = terminoBusqueda.toLowerCase();
    const comisionesPorTermino = comisiones.filter(c =>
      c.titulo.toLowerCase().includes(termino) ||
      c.asistentes?.some(a => (getUsuarioNombre(a.id, usuarios) || '').toLowerCase().includes(termino))
    );

    // Filtro por vista (próximas o terminadas)
    const ahora = new Date();
    return comisionesPorTermino.filter(c => {
      const fechaComision = parseISO(c.fecha_hora.replace(' ', 'T') + 'Z');
      const esPasada = isPast(fechaComision) && !isToday(fechaComision);
      if (vista === 'proximas') {
        return !esPasada;
      } else {
        return esPasada;
      }
    });

  }, [comisiones, terminoBusqueda, loading, error, usuarios, vista]);

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    comisionesFiltradas.forEach(comision => {
      const fechaUtc = parseISO(comision.fecha_hora.replace(' ', 'T') + 'Z');
      const fechaLocal = toZonedTime(fechaUtc, timeZone);
      const fechaClave = formatInTimeZone(fechaLocal, 'EEEE, d MMMM yyyy', { locale: es, timeZone });
      
      if (!grupos[fechaClave]) grupos[fechaClave] = [];
      grupos[fechaClave].push(comision);
    });

    const fechasOrdenadas = Object.keys(grupos).sort((a, b) => {
      const fechaA = parseISO(grupos[a][0].fecha_hora.replace(' ', 'T'));
      const fechaB = parseISO(grupos[b][0].fecha_hora.replace(' ', 'T'));
      return fechaA.getTime() - fechaB.getTime();
    });

    const gruposOrdenados: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    fechasOrdenadas.forEach(fecha => {
        gruposOrdenados[fecha] = grupos[fecha];
    });

    return gruposOrdenados;
  }, [comisionesFiltradas]);


  if (loading || cargando) return <Cargando texto='Cargando comisiones...'/>;
  if (error) return <p className="text-center text-red-500 py-8">Error al cargar datos: {error}</p>;

  return (
    <>
      <div className="bg-white rounded-lg w-full md:px-4">
        <AnimatePresence mode="wait">
          {comisionAVer ? (
            <motion.div key="verComision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VerComision 
                comision={comisionAVer} usuarios={usuarios} rol={rol}
                onClose={() => setComisionAVer(null)} onAbrirMapa={handleAbrirMapa}
                onEdit={handleEditarComision} onDelete={handleEliminarComision}
              />
            </motion.div>
          ) : comisionesAVerMultiples ? (
             <motion.div key="multiples" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VerComisiones
                  comisiones={comisionesAVerMultiples} usuarios={usuarios}
                  onClose={() => { setComisionesAVerMultiples(null); setComisionesSeleccionadas([]); }}
              />
            </motion.div>
          ) : (
            <motion.div key="lista-principal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
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
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <Input placeholder="Buscar por título o integrante..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} className="w-full" />
                  <div className='flex gap-2 items-center'>
                      <select value={mesSeleccionado} onChange={(e) => { setMesSeleccionado(Number(e.target.value)); }} className="text-sm capitalize focus:ring-0 border-gray-300 rounded-md">
                          {Array.from({length: 12}).map((_, index) => <option key={index} value={index}>{formatInTimeZone(setMonth(new Date(), index), 'MMMM', { locale: es })}</option>)}
                      </select>
                      <select value={anioSeleccionado} onChange={(e) => { setAnioSeleccionado(Number(e.target.value)); }} className="text-sm focus:ring-0 border-gray-300 rounded-md">
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(anio => <option key={anio} value={anio}>{anio}</option>)}
                      </select>
                  </div>
                  <Button onClick={handleCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                      Crear Comisión
                  </Button>
              </div>

              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">Seleccione una comisión para ver sus detalles</h2>
                {comisionesFiltradas.length > 0 ? (
                  <div className="space-y-4">
                    {Object.keys(comisionesAgrupadasPorFecha).map(fecha => (
                      <div key={fecha}>
                        <h3 className="text-sm font-bold text-gray-800 mb-2 capitalize sticky top-0 bg-white/80 backdrop-blur-sm py-2">{fecha}</h3>
                        <div className="space-y-2">
                          {comisionesAgrupadasPorFecha[fecha].map(comision => {
                              const ahora = new Date();
                              const fechaUtc = parseISO(comision.fecha_hora.replace(' ', 'T') + 'Z');
                              const fechaComision = toZonedTime(fechaUtc, timeZone);
                              
                              // --- LÓGICA DE CÁLCULO MEJORADA ---
                              const diasRestantes = differenceInCalendarDays(fechaComision, ahora);
                              const integrantesCount = comision.asistentes?.length || 0;
                              const isSelected = comisionesSeleccionadas.some(c => c.id === comision.id);

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
                                <motion.div
                                  key={comision.id}
                                  layout
                                  className={`w-full p-4 border rounded-lg cursor-pointer flex justify-between items-center transition-all duration-300 ${isSelected ? 'bg-blue-50 border-blue-400 shadow-md' : 'hover:bg-gray-50'}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div onClick={() => handleVerComision(comision)} className="flex-grow flex flex-col">
                                    <span className="font-semibold text-gray-900 text-xs md:text-lg">{comision.titulo}</span>
                                    <span className="text-xs text-gray-500">{formatInTimeZone(fechaComision, "h:mm a", { locale: es, timeZone })}</span>
                                  </div>
                                  <div onClick={() => handleVerComision(comision)} className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-6 text-xs text-right">
                                      <div className={`flex items-center gap-2 ${colorDias}`}>
                                          <CalendarClock size={16} />
                                          <span>{textoDias}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-blue-600">
                                          <Users size={16} />
                                          <span>{integrantesCount}</span>
                                      </div>
                                  </div>
                                  <button
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleSeleccionarComision(comision);
                                      }}
                                      className="ml-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                                      aria-label={isSelected ? "Deseleccionar comisión" : "Seleccionar comisión"}
                                  >
                                      {isSelected ? <CheckSquare className="text-blue-600" /> : <Square className="text-gray-400" />}
                                  </button>
                                </motion.div>
                              );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-gray-500">No se encontraron comisiones para este período.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ComisionForm 
        isOpen={modalAbierto} 
        onClose={() => { setModalAbierto(false); setComisionAEditar(null); }} 
        onSave={handleGuardado} 
        usuarios={usuarios} 
        comisionAEditar={comisionAEditar}
      />

      <AnimatePresence>
        {modalMapaAbierto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Mapa
              isOpen={modalMapaAbierto}
              onClose={() => setModalMapaAbierto(false)}
              registros={registrosParaMapa}
              nombreUsuario={nombreParaMapa}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {comisionesSeleccionadas.length > 0 && !comisionAVer && !comisionesAVerMultiples && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <Button onClick={handleVerMultiplesComisiones} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
              Ver {comisionesSeleccionadas.length} comision{comisionesSeleccionadas.length > 1 ? 'es' : ''}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}