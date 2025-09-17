'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, getMonth, getYear, setMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ComisionForm from './forms/Comision';
import VerComision from './VerComision';
import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import { Trash2, Eye, Pencil } from 'lucide-react';
import useUserData from '@/hooks/sesion/useUserData';
import Swal from 'sweetalert2';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/asistencia/modal/Mapa';
import { motion, AnimatePresence } from 'framer-motion';

interface VerProps {
  usuarios: Usuario[];
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);
const ITEMS_POR_PAGINA = 10;

const customToast = (color: string) => Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
      const progressBar = toast.querySelector('.swal2-timer-progress-bar') as HTMLElement;
      if (progressBar) progressBar.style.backgroundColor = color;
    }
});

export default function Ver({ usuarios }: VerProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [comisionAEditar, setComisionAEditar] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionAVer, setComisionAVer] = useState<ComisionConFechaYHoraSeparada | null>(null);
  
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });
  const [nombreParaMapa, setNombreParaMapa] = useState('');

  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [paginaActual, setPaginaActual] = useState(1);

  const { rol, cargando } = useUserData();
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado);

  useEffect(() => {
    if (comisionAEditar && comisiones) {
      const comisionActualizada = comisiones.find(c => c.id === comisionAEditar.id);
      if (comisionActualizada) setComisionAEditar(comisionActualizada);
    }
     if (comisionAVer && comisiones) {
      const comisionActualizada = comisiones.find(c => c.id === comisionAVer.id);
      if (comisionActualizada) setComisionAVer(comisionActualizada);
    }
  }, [comisiones]);

  useEffect(() => {
    setComisionAEditar(null);
    setComisionAVer(null);
  }, [mesSeleccionado, anioSeleccionado, paginaActual]);

  const handleCrearComision = () => {
    setComisionAEditar(null);
    setComisionAVer(null);
    setModalAbierto(true);
  };

  const handleEditarComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAVer(null);
    setComisionAEditar(comision);
  };

  const handleVerComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAEditar(null);
    setComisionAVer(comision);
  };

  const handleEliminarComision = async (comisionId: string) => { /* ... */ };
  const handleGuardado = () => { refetch(); };

  const handleAbrirMapa = (registrosDeUsuario: { entrada: any, salida: any }, nombreDeUsuario: string) => {
    setRegistrosParaMapa(registrosDeUsuario);
    setNombreParaMapa(nombreDeUsuario);
    setModalMapaAbierto(true);
  };

  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisiones) return [];
    const comisionesBase = [...comisiones];
    if (terminoBusqueda.length > 2) {
      const termino = terminoBusqueda.toLowerCase();
      return comisionesBase.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        c.asistentes?.some(a => (a.nombre || '').toLowerCase().includes(termino))
      );
    }
    return comisionesBase;
  }, [comisiones, terminoBusqueda, loading, error]);

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    comisionesFiltradas.forEach(comision => {
      const fecha = parseISO(comision.fecha_hora);
      const fechaLocal = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000 - 360 * 60 * 1000);
      const fechaClave = format(fechaLocal, 'EEEE, d MMM yyyy', { locale: es });
      if (!grupos[fechaClave]) grupos[fechaClave] = [];
      grupos[fechaClave].push(comision);
    });
    return grupos;
  }, [comisionesFiltradas]);
  
  const totalPaginas = Math.ceil(Object.keys(comisionesAgrupadasPorFecha).length / ITEMS_POR_PAGINA);
  const fechasPaginadas = useMemo(() => {
    const fechas = Object.keys(comisionesAgrupadasPorFecha);
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    return fechas.slice(inicio, fin);
  }, [comisionesAgrupadasPorFecha, paginaActual]);

  if (loading || cargando) return <Cargando texto='Cargando...'/>;
  if (error) return <p className="text-center text-red-500 py-8">Error: {error}</p>;

  return (
    <>
      <div className="bg-white rounded-lg space-y-4 w-full md:px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Input placeholder="Buscar comisiones..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} className="w-full" />
            <div className='flex gap-2 items-center'>
                <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="text-lg capitalize focus:ring-0">
                    {meses.map((mes, index) => <option key={index} value={index}>{format(setMonth(new Date(), index), 'MMM', { locale: es })}</option>)}
                </select>
                <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))} className="text-lg focus:ring-0">
                    {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
                </select>
            </div>
            <Button onClick={handleCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                Crear Comisión
            </Button>
        </div>

        <div className="border-t pt-4 space-y-4 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/5 relative">
            {comisionesFiltradas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron comisiones.</p>
            ) : (
                <div className="space-y-6">
                  {fechasPaginadas.map(fecha => (
                    <div key={fecha}>
                      <h4 className="text-md font-bold text-gray-700 mb-2">{fecha}</h4>
                      <div className="space-y-4">
                        {comisionesAgrupadasPorFecha[fecha].map(comision => (
                          <div key={comision.id} className="bg-slate-50 rounded-xl shadow-lg p-4 transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-base font-bold text-gray-800">{comision.titulo}</h3>
                                <p className="text-sm text-gray-600 mt-1">{format(parseISO(comision.fecha_hora), 'h:mm a', { locale: es })} | {comision.asistentes?.length || 0} asistentes</p>
                              </div>
                              <div className="flex items-center gap-1 -mr-2">
                                <Button onClick={() => handleVerComision(comision)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100"><Eye size={16} /></Button>
                                {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                                  <>
                                    <Button onClick={() => handleEditarComision(comision)} variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100"><Pencil size={16} /></Button>
                                    <Button onClick={() => handleEliminarComision(comision.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100"><Trash2 size={16} /></Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
          <div className="w-full md:w-3/5">
            <div>
              {!comisionAVer && !comisionAEditar && (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-gray-500">Seleccione una comisión para ver sus detalles</p>
                </div>
              )}
              {comisionAVer && (
                <VerComision 
                  comision={comisionAVer} 
                  usuarios={usuarios} 
                  onClose={() => setComisionAVer(null)} 
                  onAbrirMapa={handleAbrirMapa}
                />
              )}
              {comisionAEditar && (
                <ComisionForm
                  isModal={false}
                  onClose={() => setComisionAEditar(null)}
                  onSave={handleGuardado}
                  usuarios={usuarios}
                  comisionAEditar={comisionAEditar}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ComisionForm isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSave={handleGuardado} usuarios={usuarios} comisionAEditar={null} isModal={true} />

      <AnimatePresence>
        {modalMapaAbierto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
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
    </>
  );
}