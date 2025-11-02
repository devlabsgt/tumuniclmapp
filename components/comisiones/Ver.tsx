// src/app/Ver.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, setMonth, parseISO, isPast, isToday, differenceInCalendarDays } from 'date-fns';
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Usuario } from '@/lib/usuarios/esquemas';
import ComisionForm from './forms/Comision';
import VerComision from './VerComision';
import VerComisiones from './VerComisiones';
import ListaComisiones from './ListaComisiones'; // Nuevo componente importado
import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Swal from 'sweetalert2';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/ui/modals/Mapa';
import { motion, AnimatePresence } from 'framer-motion';

// --- FUNCIÓN HELPER ---
export const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
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
  }, [mesSeleccionado, anioSeleccionado, vista]);

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

  const handleSeleccionarTodas = () => {
    if (comisionesSeleccionadas.length === comisionesFiltradas.length) {
      setComisionesSeleccionadas([]);
    } else {
      setComisionesSeleccionadas(comisionesFiltradas);
    }
  };

  const handleVerMultiplesComisiones = () => {
    setComisionAVer(null);
    const comisionesOrdenadas = [...comisionesSeleccionadas].sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
    setComisionesAVerMultiples(comisionesOrdenadas);
  };

  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisiones) return [];
    const termino = terminoBusqueda.toLowerCase();
    const comisionesPorTermino = comisiones.filter(c =>
      c.titulo.toLowerCase().includes(termino) ||
      c.asistentes?.some(a => (getUsuarioNombre(a.id, usuarios) || '').toLowerCase().includes(termino))
    );
    const ahora = new Date();
    return comisionesPorTermino.filter(c => {
      const fechaComision = parseISO(c.fecha_hora.replace(' ', 'T') + 'Z');
      const esPasada = isPast(fechaComision) && !isToday(fechaComision);
      return vista === 'proximas' ? !esPasada : esPasada;
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

  if (loading || cargando) return <Cargando texto='Cargando comisiones...' />;
  if (error) return <p className="text-center text-red-500 py-8">Error al cargar datos: {error}</p>;

  return (
    <>
      <div className="bg-white rounded-lg w-full max-w-7xl mx-auto px-2 lg:px-8">
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
              <ListaComisiones
                vista={vista}
                setVista={setVista}
                terminoBusqueda={terminoBusqueda}
                setTerminoBusqueda={setTerminoBusqueda}
                mesSeleccionado={mesSeleccionado}
                setMesSeleccionado={setMesSeleccionado}
                anioSeleccionado={anioSeleccionado}
                setAnioSeleccionado={setAnioSeleccionado}
                comisionesFiltradas={comisionesFiltradas}
                comisionesAgrupadasPorFecha={comisionesAgrupadasPorFecha}
                onVerComision={handleVerComision}
                onCrearComision={handleCrearComision}
                comisionesSeleccionadas={comisionesSeleccionadas}
                onSeleccionarComision={handleSeleccionarComision}
                onSeleccionarTodas={handleSeleccionarTodas}
                onVerMultiplesComisiones={handleVerMultiplesComisiones}
                rolActual={rol}
              />
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
    </>
  );
}