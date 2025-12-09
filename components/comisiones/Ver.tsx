'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, setMonth, parseISO, format } from 'date-fns';
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

export const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

export default function Ver() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [comisionAEditar, setComisionAEditar] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionAVer, setComisionAVer] = useState<ComisionConFechaYHoraSeparada | null>(null);
  const [comisionesSeleccionadas, setComisionesSeleccionadas] = useState<ComisionConFechaYHoraSeparada[]>([]);
  const [comisionesAVerMultiples, setComisionesAVerMultiples] = useState<ComisionConFechaYHoraSeparada[] | null>(null);
  const [haCargadoVistaInicial, setHaCargadoVistaInicial] = useState(false);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<{ entrada: any | null, salida: any | null }>({ entrada: null, salida: null });
  const [nombreParaMapa, setNombreParaMapa] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [vista, setVista] = useState<'hoy' | 'proximas' | 'terminadas' | 'pendientes'>('hoy');

  const { rol, cargando, userId, esjefe } = useUserData();
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado);
  const { usuarios, loading: cargandoUsuarios } = useListaUsuarios();

  const timeZone = 'America/Guatemala';

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const usuariosFiltrados = useMemo(() => {
    if (!usuarios) return [];
    if (rol === 'SUPER') {
      return usuarios;
    }
    return usuarios.filter(u => u.rol !== 'SUPER');
  }, [usuarios, rol]);

  const comisionesVisibles = useMemo(() => {
    if (!comisiones) return [];

    const esAdmin = rol === 'SUPER' || rol === 'RRHH' || rol === 'SECRETARIO';

    if (esAdmin) {
      return comisiones;
    }

    if (esjefe && userId) {
      return comisiones.filter(c => 
        c.creado_por === userId
      );
    }
    
    return comisiones;
  }, [comisiones, rol, userId, esjefe]);

  useEffect(() => {
    if (comisionAVer && comisionesVisibles) {
      const comisionActualizada = comisionesVisibles.find(c => c.id === comisionAVer.id);
      setComisionAVer(comisionActualizada || null);
    }
  }, [comisionesVisibles, comisionAVer]);

  useEffect(() => {
    setComisionAVer(null);
    setComisionesAVerMultiples(null);
    setComisionesSeleccionadas([]);
  }, [mesSeleccionado, anioSeleccionado, vista]);

  const counts = useMemo(() => {
    if (!comisionesVisibles) return { pendientes: 0, proximas: 0, terminadas: 0, hoy: 0 };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let pendientes = 0;
    let proximas = 0;
    let terminadas = 0;
    let hoyCount = 0;
    
    comisionesVisibles.forEach(c => {
      const fechaComision = parseISO(c.fecha_hora.split(' ')[0]);

      if (c.aprobado === false) {
        pendientes++;
      } else if (c.aprobado === true) {
        if (fechaComision.getTime() === hoy.getTime()) {
          hoyCount++;
        } else if (fechaComision > hoy) {
          proximas++;
        } else if (fechaComision < hoy) {
          terminadas++;
        }
      }
    });

    return { pendientes, proximas, terminadas, hoy: hoyCount };
  }, [comisionesVisibles]);

  useEffect(() => {
    if (loading || cargandoUsuarios || !comisiones) {
      return;
    }

    const vistaActualEstaVacia = 
      (vista === 'hoy' && counts.hoy === 0) ||
      (vista === 'pendientes' && counts.pendientes === 0) ||
      (vista === 'proximas' && counts.proximas === 0) ||
      (vista === 'terminadas' && counts.terminadas === 0);
      
    if (!haCargadoVistaInicial || vistaActualEstaVacia) {
      
      if (counts.hoy > 0) {
        setVista('hoy');
      } else if (esjefe && !(rol === 'SUPER' || rol === 'RRHH' || rol === 'SECRETARIO')) {
        if (counts.proximas > 0) {
          setVista('proximas');
        } else if (counts.terminadas > 0) {
          setVista('terminadas');
        } else if (counts.pendientes > 0) {
          setVista('pendientes');
        } else {
          setVista('hoy'); 
        }
      } 
      else {
        if (counts.pendientes > 0) {
          setVista('pendientes');
        } else if (counts.proximas > 0) {
          setVista('proximas');
        } else if (counts.terminadas > 0) {
          setVista('terminadas');
        } else {
          setVista('hoy'); 
        }
      }
      
      if (!haCargadoVistaInicial) {
        setHaCargadoVistaInicial(true);
      }
    }
    
  }, [counts, vista, haCargadoVistaInicial, loading, cargandoUsuarios, esjefe, comisiones, rol]);


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

    const nombreUsuario = getUsuarioNombre(userId, usuariosFiltrados) || 'Usuario del Sistema';

    const result = await Swal.fire({
      title: '¿Aprobar Comisión?',
      html: `Está a punto de aprobar esta comisión como <b>${nombreUsuario}</b>.<br/><br/>¿Desea continuar?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users/comision`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: comisionId, 
            aprobado: true
          }),
        });

        if (res.ok) {
          Swal.fire('¡Aprobada!', 'La comisión ha sido aprobada.', 'success');
          refetch();
          setComisionAVer(null);
        } else {
          const { error } = await res.json();
          Swal.fire('Error', error || 'No se pudo aprobar la comisión.', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Hubo un problema de conexión.', 'error');
      }
    }
  };

  const handleEliminarComision = async (comisionId: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?', text: "Esta acción no se puede deshacer y se perderá toda la información.", icon: 'warning',
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

  const handleEliminarComisionesSeleccionadas = async () => {
    const num = comisionesSeleccionadas.length;
    const result = await Swal.fire({
      title: `¿Eliminar ${num} comisi${num > 1 ? 'ones' : 'ón'}?`,
      text: "Esta acción no se puede deshacer y se perderá toda la información.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const ids = comisionesSeleccionadas.map(c => c.id);
      
      const promesas = ids.map(id =>
        fetch(`/api/users/comision`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      );

      try {
        const resultados = await Promise.allSettled(promesas);
        
        const fallidas = resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
        const exitosas = resultados.length - fallidas.length;

        if (exitosas > 0) {
          Swal.fire('¡Completado!', `Se elimi${num > 1 ? 'naron' : 'ó'} ${exitosas} comisi${num > 1 ? 'ones' : 'ón'}.`, 'success');
        }
        
        if (fallidas.length > 0) {
          Swal.fire('Error', `No se pudieron eliminar ${fallidas.length} comisi${num > 1 ? 'ones' : 'ón'}.`, 'error');
        }

        refetch();
        setComisionesSeleccionadas([]);

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

  const handleRefresh = async () => {
    await refetch();
  };

  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisionesVisibles) return [];

    let comisionesDeVista: ComisionConFechaYHoraSeparada[] = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (vista === 'hoy') {
      comisionesDeVista = comisionesVisibles.filter(c => {
        const fechaComision = parseISO(c.fecha_hora.split(' ')[0]);
        return c.aprobado === true && fechaComision.getTime() === hoy.getTime();
      });
    } else if (vista === 'pendientes') {
      comisionesDeVista = comisionesVisibles.filter(c => c.aprobado === false);
    
    } else if (vista === 'proximas') {
      comisionesDeVista = comisionesVisibles.filter(c => {
        const fechaComision = parseISO(c.fecha_hora.split(' ')[0]);
        return c.aprobado === true && fechaComision > hoy;
      });
    
    } else { 
      comisionesDeVista = comisionesVisibles.filter(c => {
        const fechaComision = parseISO(c.fecha_hora.split(' ')[0]);
        return c.aprobado === true && fechaComision < hoy;
      });
    }

    const termino = terminoBusqueda.toLowerCase();
    if (termino) {
      return comisionesDeVista.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        (c.asistentes && c.asistentes.some(a => (getUsuarioNombre(a.id, usuariosFiltrados) || '').toLowerCase().includes(termino)))
      );
    }

    return comisionesDeVista;

  }, [comisionesVisibles, terminoBusqueda, loading, error, usuariosFiltrados, vista]);

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
      grupos[fecha].sort((a, b) => {
        const fechaA = parseISO(a.fecha_hora.replace(' ', 'T'));
        const fechaB = parseISO(b.fecha_hora.replace(' ', 'T'));
        return fechaA.getTime() - fechaB.getTime();
      });
      gruposOrdenados[fecha] = grupos[fecha];
    });
    return gruposOrdenados;
  }, [comisionesFiltradas, timeZone]);

  if (loading || cargando || cargandoUsuarios || !haCargadoVistaInicial) return <Cargando texto='Cargando comisiones...' />;
  if (error) return <p className="text-center text-red-500 dark:text-red-400 py-8">Error al cargar datos: {error}</p>;

  const listaComisionesContenido = (
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
        countPendientes={counts.pendientes}
        countHoy={counts.hoy}
        countProximas={counts.proximas}
        countTerminadas={counts.terminadas}
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
                  <Button 
                    onClick={handleRefresh} 
                    variant="ghost"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              )}
              {isMobile ? (
                <PullToRefresh
                  onRefresh={handleRefresh}
                  pullingContent={
                    <div className="flex flex-col justify-center items-center h-16">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 animate-bounce">
                        Suelta para actualizar
                      </p>
                      <ArrowDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  }
                  refreshingContent={
                    <div className="flex flex-col justify-center items-center h-16">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 animate-bounce">
                        Actualizando...
                      </p>
                      <RefreshCw className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-spin" />
                    </div>
                  }
                >
                  {listaComisionesContenido}
                </PullToRefresh>
              ) : (
                listaComisionesContenido
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      <ComisionForm
        isOpen={modalAbierto}
        onClose={() => { setModalAbierto(false); setComisionAEditar(null); }}
        onSave={handleGuardado}
        usuarios={usuariosFiltrados}
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