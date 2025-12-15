'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, parseISO, isSameDay } from 'date-fns';
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Usuario } from '@/lib/usuarios/esquemas';
import ComisionForm from './forms/Comision';
import VerComision from './VerComision';
import VerComisiones from './VerComisiones';
import ListaComisiones from './ListaComisiones';
import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';
import Swal from 'sweetalert2';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/ui/modals/Mapa';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper exportado para reutilizar en hijos
export const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

interface VerProps {
  modo: string;
}

export default function Ver({ modo }: VerProps) {
  // --- Estados de UI ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [haCargadoVistaInicial, setHaCargadoVistaInicial] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // --- Estados de Datos ---
  const [comisionAEditar, setComisionAEditar] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionAVer, setComisionAVer] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionesSeleccionadas, setComisionesSeleccionadas] = useState<ComisionConFechaYHoraSeparada[]>([]);
  const [comisionesAVerMultiples, setComisionesAVerMultiples] = useState<ComisionConFechaYHoraSeparada[] | null>(null);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });
  const [nombreParaMapa, setNombreParaMapa] = useState('');

  // --- Filtros ---
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [vista, setVista] = useState<'hoy' | 'proximas' | 'terminadas' | 'pendientes'>('hoy');

  const { userId, cargando: cargandoSesion } = useUserData();
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado);
  const { usuarios, loading: cargandoUsuarios } = useListaUsuarios();

  const timeZone = 'America/Guatemala';

  // --- Efectos de Configuración ---
  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    setComisionAVer(null);
    setComisionesAVerMultiples(null);
    setComisionesSeleccionadas([]);
  }, [mesSeleccionado, anioSeleccionado, vista]);

  // --- Memorización de Datos ---
  
  // 1. Usuarios: Si es RRHH ve todos (incluyendo SUPER), si no, se filtran los SUPER
  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return [];
    return modo === 'RRHH' ? usuarios : usuarios.filter(u => u.rol !== 'SUPER');
  }, [usuarios, modo]);

  // 2. Comisiones Visibles (LA LÓGICA CRÍTICA)
  const comisionesVisibles = useMemo(() => {
    if (!comisiones) return [];
    
    // Si modo es RRHH devuelve todo sin mirar el creador
    if (modo === 'RRHH') return comisiones;

    // Si no es RRHH, filtra estrictamente por creador
    if (userId) return comisiones.filter(c => c.creado_por === userId);

    return [];
  }, [comisiones, modo, userId]);

  // Actualizar modal si la data de fondo cambia
  useEffect(() => {
    if (comisionAVer && comisionesVisibles) {
      const actualizada = comisionesVisibles.find(c => c.id === comisionAVer.id);
      setComisionAVer(actualizada || null);
    }
  }, [comisionesVisibles, comisionAVer]);

  // 3. Contadores (Optimizado con reduce)
  const counts = useMemo(() => {
    if (!comisionesVisibles.length) return { pendientes: 0, proximas: 0, terminadas: 0, hoy: 0 };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return comisionesVisibles.reduce((acc, c) => {
      const fecha = parseISO(c.fecha_hora.split(' ')[0]);
      if (!c.aprobado) {
        acc.pendientes++;
      } else {
        if (isSameDay(fecha, hoy)) acc.hoy++;
        else if (fecha > hoy) acc.proximas++;
        else acc.terminadas++;
      }
      return acc;
    }, { pendientes: 0, proximas: 0, terminadas: 0, hoy: 0 });
  }, [comisionesVisibles]);

  // 4. Autoselección de Vista
  useEffect(() => {
    if (loading || cargandoUsuarios || !comisiones || haCargadoVistaInicial) return;

    if (counts.hoy > 0) setVista('hoy');
    else if (counts.pendientes > 0) setVista('pendientes');
    else if (counts.proximas > 0) setVista('proximas');
    else if (counts.terminadas > 0) setVista('terminadas');
    else setVista('hoy');

    setHaCargadoVistaInicial(true);
  }, [counts, haCargadoVistaInicial, loading, cargandoUsuarios, comisiones]);

  // 5. Filtrado Final (Pestaña + Buscador)
  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisionesVisibles.length) return [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Primer filtro: Pestaña
    let resultado = comisionesVisibles.filter(c => {
      const fecha = parseISO(c.fecha_hora.split(' ')[0]);
      switch (vista) {
        case 'hoy': return c.aprobado && isSameDay(fecha, hoy);
        case 'pendientes': return !c.aprobado;
        case 'proximas': return c.aprobado && fecha > hoy;
        case 'terminadas': return c.aprobado && fecha < hoy;
        default: return false;
      }
    });

    // Segundo filtro: Buscador
    const termino = terminoBusqueda.toLowerCase();
    if (termino) {
      resultado = resultado.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        (c.asistentes && c.asistentes.some(a => (getUsuarioNombre(a.id, usuariosFiltrados) || '').toLowerCase().includes(termino)))
      );
    }
    return resultado;
  }, [comisionesVisibles, terminoBusqueda, vista, usuariosFiltrados, loading, error]);

  // 6. Agrupación por fecha
  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    
    comisionesFiltradas.forEach(comision => {
      const fechaUtc = parseISO(comision.fecha_hora.replace(' ', 'T') + 'Z');
      const fechaLocal = toZonedTime(fechaUtc, timeZone);
      const fechaClave = formatInTimeZone(fechaLocal, 'EEEE, d MMMM yyyy', { locale: es, timeZone });
      
      if (!grupos[fechaClave]) grupos[fechaClave] = [];
      grupos[fechaClave].push(comision);
    });
    
    // Ordenar claves de fecha
    return Object.keys(grupos)
      .sort((a, b) => {
        const dateA = parseISO(grupos[a][0].fecha_hora.replace(' ', 'T'));
        const dateB = parseISO(grupos[b][0].fecha_hora.replace(' ', 'T'));
        return dateA.getTime() - dateB.getTime();
      })
      .reduce((acc, fecha) => {
        // Ordenar items dentro de la fecha
        acc[fecha] = grupos[fecha].sort((a, b) => 
          parseISO(a.fecha_hora).getTime() - parseISO(b.fecha_hora).getTime()
        );
        return acc;
      }, {} as { [key: string]: ComisionConFechaYHoraSeparada[] });
  }, [comisionesFiltradas, timeZone]);

  // --- Handlers ---
  const handleRefresh = async () => { await refetch(); };
  
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

  const handleAprobarComision = async (comisionId: string) => {
    const comision = comisionesVisibles.find(c => c.id === comisionId);
    if (!comision || !userId) return;

    const nombreUsuario = getUsuarioNombre(userId, usuariosFiltrados) || 'Usuario';
    
    const result = await Swal.fire({
      title: '¿Aprobar Comisión?',
      html: `Aprobar como <b>${nombreUsuario}</b>.<br/><br/>¿Continuar?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/comision`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: comisionId, aprobado: true }),
        });
        if (res.ok) {
          Swal.fire('¡Aprobada!', 'La comisión ha sido aprobada.', 'success');
          refetch();
          setComisionAVer(null);
        } else {
          Swal.fire('Error', 'No se pudo aprobar.', 'error');
        }
      } catch (e) { Swal.fire('Error', 'Problema de conexión.', 'error'); }
    }
  };

  const handleEliminarComision = async (comisionId: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar?', text: "Se perderá la información.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/comision`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: comisionId }),
        });
        if (res.ok) {
          Swal.fire('¡Eliminada!', 'Comisión eliminada.', 'success');
          refetch();
          setComisionAVer(null);
        } else { Swal.fire('Error', 'Error al eliminar.', 'error'); }
      } catch (e) { Swal.fire('Error', 'Problema de conexión.', 'error'); }
    }
  };

  const handleEliminarComisionesSeleccionadas = async () => {
    const num = comisionesSeleccionadas.length;
    const result = await Swal.fire({
      title: `¿Eliminar ${num}?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      const promesas = comisionesSeleccionadas.map(c => 
        fetch(`/api/users/comision`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: c.id }),
        })
      );
      await Promise.allSettled(promesas);
      refetch();
      setComisionesSeleccionadas([]);
      Swal.fire('Proceso terminado', 'Se han procesado las eliminaciones.', 'info');
    }
  };

  const handleAbrirMapa = (registrosDeUsuario: { entrada: any, salida: any }, nombreDeUsuario: string) => {
    setRegistrosParaMapa(registrosDeUsuario);
    setNombreParaMapa(nombreDeUsuario);
    setModalMapaAbierto(true);
  };

  const handleVerComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionAVer(comision);
    setComisionesAVerMultiples(null);
  };

  const handleSeleccionarComision = (comision: ComisionConFechaYHoraSeparada) => {
    setComisionesSeleccionadas(prev =>
      prev.some(c => c.id === comision.id) ? prev.filter(c => c.id !== comision.id) : [...prev, comision]
    );
  };

  const handleSeleccionarTodas = () => {
    setComisionesSeleccionadas(
      comisionesSeleccionadas.length === comisionesFiltradas.length ? [] : comisionesFiltradas
    );
  };

  const handleVerMultiplesComisiones = () => {
    setComisionAVer(null);
    setComisionesAVerMultiples([...comisionesSeleccionadas].sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()));
  };

  if (loading || cargandoSesion || cargandoUsuarios || !haCargadoVistaInicial) return <Cargando texto='Cargando comisiones...' />;
  if (error) return <p className="text-center text-red-500 py-8">Error: {error}</p>;

  const listaContenido = (
    <motion.div key="lista-principal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <ListaComisiones
        modo={modo}
        vista={vista} setVista={setVista}
        terminoBusqueda={terminoBusqueda} setTerminoBusqueda={setTerminoBusqueda}
        mesSeleccionado={mesSeleccionado} setMesSeleccionado={setMesSeleccionado}
        anioSeleccionado={anioSeleccionado} setAnioSeleccionado={setAnioSeleccionado}
        comisionesFiltradas={comisionesFiltradas}
        comisionesAgrupadasPorFecha={comisionesAgrupadasPorFecha}
        onVerComision={handleVerComision}
        onCrearComision={handleCrearComision}
        comisionesSeleccionadas={comisionesSeleccionadas}
        onSeleccionarComision={handleSeleccionarComision}
        onSeleccionarTodas={handleSeleccionarTodas}
        onVerMultiplesComisiones={handleVerMultiplesComisiones}
        countPendientes={counts.pendientes} countHoy={counts.hoy}
        countProximas={counts.proximas} countTerminadas={counts.terminadas}
        onAprobarComision={handleAprobarComision}
        onEliminarComisiones={handleEliminarComisionesSeleccionadas}
      />
    </motion.div>
  );

  return (
    <>
      <div className="bg-white dark:bg-neutral-950 transition-colors duration-200 rounded-lg w-full max-w-7xl mx-auto pb-4 px-2 lg:px-8">
        <AnimatePresence mode="wait">
          {comisionAVer ? (
            <motion.div key="verComision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VerComision
                comision={comisionAVer} usuarios={usuariosFiltrados}
                onClose={() => setComisionAVer(null)} onAbrirMapa={handleAbrirMapa}
                onEdit={handleEditarComision} onDelete={handleEliminarComision}
                onAprobar={handleAprobarComision}
              />
            </motion.div>
          ) : comisionesAVerMultiples ? (
            <motion.div key="multiples" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VerComisiones
                comisiones={comisionesAVerMultiples} usuarios={usuariosFiltrados}
                onClose={() => { setComisionesAVerMultiples(null); setComisionesSeleccionadas([]); }}
              />
            </motion.div>
          ) : (
            <>
              {!isMobile && (
                <div className="flex justify-center">
                  <Button onClick={handleRefresh} variant="ghost" className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800">
                    <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
                  </Button>
                </div>
              )}
              {isMobile ? (
                <PullToRefresh
                  onRefresh={handleRefresh}
                  pullingContent={<div className="flex flex-col items-center h-16"><p className="text-xs mb-1 animate-bounce">Suelta</p><ArrowDown className="h-4 w-4" /></div>}
                  refreshingContent={<div className="flex flex-col items-center h-16"><p className="text-xs mb-1">Cargando</p><RefreshCw className="h-4 w-4 animate-spin" /></div>}
                >
                  {listaContenido}
                </PullToRefresh>
              ) : listaContenido}
            </>
          )}
        </AnimatePresence>
      </div>

      <ComisionForm
        isOpen={modalAbierto}
        onClose={() => { setModalAbierto(false); setComisionAEditar(null); }}
        onSave={() => refetch()}
        usuarios={usuariosFiltrados}
        comisionAEditar={comisionAEditar}
      />

      <AnimatePresence>
        {modalMapaAbierto && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Mapa isOpen={modalMapaAbierto} onClose={() => setModalMapaAbierto(false)} registros={registrosParaMapa} nombreUsuario={nombreParaMapa} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}