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
     if (comisionAVer && comisiones) {
      const comisionActualizada = comisiones.find(c => c.id === comisionAVer.id);
      if (comisionActualizada) {
        setComisionAVer(comisionActualizada);
      } else {
        setComisionAVer(null);
      }
    }
  }, [comisiones, comisionAVer]);

  useEffect(() => {
    setComisionAVer(null);
  }, [mesSeleccionado, anioSeleccionado, paginaActual]);

  const handleCrearComision = () => {
    setComisionAEditar(null);
    setComisionAVer(null);
    setModalAbierto(true);
  };

  const handleEditarComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAEditar(comision);
    setModalAbierto(true);     
  };

  const handleEliminarComision = async (comisionId: string) => {
    let timerInterval: NodeJS.Timeout;
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer y eliminará todos los registros y asistencias.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        if (!confirmButton) return;
        let timerSeconds = 5;
        confirmButton.disabled = true;
        confirmButton.textContent = `Sí, eliminar en (${timerSeconds})`;
        timerInterval = setInterval(() => {
          timerSeconds -= 1;
          if (timerSeconds > 0) {
            confirmButton.textContent = `Sí, eliminar en (${timerSeconds})`;
          } else {
            clearInterval(timerInterval);
            confirmButton.disabled = false;
            confirmButton.textContent = 'Sí, eliminar';
          }
        }, 1000);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/comision`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: comisionId }),
        });
        if (res.ok) {
          customToast('#4CAF50').fire({ icon: 'success', title: 'Eliminada correctamente' });
          refetch();
          setComisionAVer(null);
        } else {
          const { error } = await res.json();
          customToast('#F27474').fire({ icon: 'error', title: error || 'No se pudo eliminar' });
        }
      } catch (error) {
        customToast('#F27474').fire({ icon: 'error', title: 'Error de conexión' });
      }
    }
  };

  const handleVerComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAVer(comision);
  };

  const handleGuardado = () => { refetch(); };

  const handleAbrirMapa = (registrosDeUsuario: { entrada: any, salida: any }, nombreDeUsuario: string) => {
    setRegistrosParaMapa(registrosDeUsuario);
    setNombreParaMapa(nombreDeUsuario);
    setModalMapaAbierto(true);
  };

  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisiones) return [];
    const termino = terminoBusqueda.toLowerCase();
    return comisiones.filter(c =>
      c.titulo.toLowerCase().includes(termino) ||
      c.asistentes?.some(a => (a.nombre || '').toLowerCase().includes(termino))
    );
  }, [comisiones, terminoBusqueda, loading, error]);

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    comisionesFiltradas.forEach(comision => {
      const fecha = parseISO(comision.fecha_hora.replace(' ', 'T'));
      const fechaClave = format(fecha, 'EEEE, d MMMM yyyy', { locale: es });
      if (!grupos[fechaClave]) grupos[fechaClave] = [];
      grupos[fechaClave].push(comision);
    });
    return grupos;
  }, [comisionesFiltradas]);
  
  const totalPaginas = Math.ceil(Object.keys(comisionesAgrupadasPorFecha).length / ITEMS_POR_PAGINA);
  const fechasPaginadas = useMemo(() => {
    const fechas = Object.keys(comisionesAgrupadasPorFecha);
    fechas.sort((a, b) => {
        const comisionA = comisionesAgrupadasPorFecha[a][0];
        const comisionB = comisionesAgrupadasPorFecha[b][0];
        const fechaA = parseISO(comisionA.fecha_hora.replace(' ', 'T'));
        const fechaB = parseISO(comisionB.fecha_hora.replace(' ', 'T'));
        return fechaB.getTime() - fechaA.getTime();
    });
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
                <select value={mesSeleccionado} onChange={(e) => { setMesSeleccionado(Number(e.target.value)); setPaginaActual(1); }} className="text-xs capitalize focus:ring-0">
                    {meses.map((mes, index) => <option key={index} value={index}>{format(setMonth(new Date(), index), 'MMMM', { locale: es })}</option>)}
                </select>
                <select value={anioSeleccionado} onChange={(e) => { setAnioSeleccionado(Number(e.target.value)); setPaginaActual(1); }} className="text-xs focus:ring-0">
                    {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
                </select>
            </div>
            <Button onClick={handleCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
                Crear Comisión
            </Button>
        </div>

        <div className="border-t pt-4 space-y-4 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/6 relative">
            {comisionesFiltradas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron comisiones.</p>
            ) : (
                <div className="space-y-4">
                  {fechasPaginadas.map(fecha => (
                    <div key={fecha}>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 capitalize">{fecha}</h4>
                      <div className="space-y-2">
                        {comisionesAgrupadasPorFecha[fecha].map(comision => (
                         <div 
                            key={comision.id}
                            onClick={() => handleVerComision(comision)}
                            className="bg-slate-50 rounded-xl border border-gray-200 p-4 transition-all duration-300 ease-in-out hover:border-gray-400 hover:-translate-y-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <h3 className="text-xs font-bold text-gray-800">{comision.titulo}</h3>
                              <p className="text-xs text-gray-600">
                                {format(parseISO(comision.fecha_hora.replace(' ', 'T')), 'h:mm a', { locale: es })} | {comision.asistentes?.length || 0} Integrantes
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
          <div className="w-full md:w-4/6">
            {comisionAVer ? (
              <VerComision 
                comision={comisionAVer} 
                usuarios={usuarios} 
                rol={rol}
                onClose={() => setComisionAVer(null)} 
                onAbrirMapa={handleAbrirMapa}
                onEdit={handleEditarComision}
                onDelete={handleEliminarComision}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">Seleccione una comisión para ver sus detalles</p>
              </div>
            )}
          </div>
        </div>
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
    </>
  );
}