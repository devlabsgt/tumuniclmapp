'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, parseISO, differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { motion, AnimatePresence } from 'framer-motion';

import PullToRefresh from 'react-simple-pull-to-refresh';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useObtenerComisiones } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/ui/modals/Mapa';
import ListaMisComisiones from './ListaMisComisiones';

const TIMEZONE_GUATE = 'America/Guatemala';

export default function MisComisiones() {
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [openComisionId, setOpenComisionId] = useState<string | null>(null);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<any>(null);
  const [nombreUsuarioParaMapa, setNombreUsuarioParaMapa] = useState('');
  const [vista, setVista] = useState<'hoy' | 'proximas' | 'terminadas'>('hoy');
  const [isMobile, setIsMobile] = useState(false);

  const { userId, nombre, cargando: cargandoUsuario } = useUserData();

  const hookUserId = cargandoUsuario ? null : (userId || null);
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado, hookUserId);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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

  useEffect(() => {
    setOpenComisionId(null);
  }, [vista]);

  const comisionesData = useMemo(() => {
    if (cargandoUsuario || !comisiones) {
      return { lista: [], countProximas: 0, countTerminadas: 0, countHoy: 0 };
    }

    const nowInGuate = toZonedTime(new Date(), TIMEZONE_GUATE);
    
    let countProximas = 0;
    let countTerminadas = 0;
    let countHoy = 0;

    const aprobadasYSorteadas = comisiones
      .filter(c => c.aprobado === true)
      .sort((a, b) =>
        parseISO(a.fecha_hora.replace(' ', 'T')).getTime() -
        parseISO(b.fecha_hora.replace(' ', 'T')).getTime()
      );

    aprobadasYSorteadas.forEach(c => {
      const fechaComisionObj = parseISO(c.fecha_hora.replace(' ', 'T'));
      // Usamos differenceInCalendarDays para consistencia total con la UI
      // Si la diferencia es 0, es HOY, sin importar la hora exacta.
      const diffDias = differenceInCalendarDays(toZonedTime(fechaComisionObj, TIMEZONE_GUATE), nowInGuate);

      if (diffDias === 0) {
        countHoy++;
      } else if (diffDias > 0) {
        countProximas++;
      } else {
        countTerminadas++;
      }
    });

    return { lista: aprobadasYSorteadas, countProximas, countTerminadas, countHoy };
  }, [comisiones, cargandoUsuario]);
  
  // Efecto para cambiar de vista automáticamente si la actual está vacía
  useEffect(() => {
    const vistaActualVacia = 
      (vista === 'hoy' && comisionesData.countHoy === 0) ||
      (vista === 'proximas' && comisionesData.countProximas === 0) ||
      (vista === 'terminadas' && comisionesData.countTerminadas === 0);

    if (vistaActualVacia) {
      if (comisionesData.countHoy > 0) {
        setVista('hoy');
      } else if (comisionesData.countProximas > 0) {
        setVista('proximas');
      } else if (comisionesData.countTerminadas > 0) {
        setVista('terminadas');
      } else {
        setVista('hoy');
      }
    }
  }, [comisionesData, vista]);

  const comisionesParaMostrar = useMemo(() => {
    const nowInGuate = toZonedTime(new Date(), TIMEZONE_GUATE);

    let comisionesFiltradas = [];

    // Filtramos usando la misma logica exacta de differenceInCalendarDays
    if (vista === 'hoy') {
      comisionesFiltradas = comisionesData.lista.filter(c => {
        const fecha = parseISO(c.fecha_hora.replace(' ', 'T'));
        return differenceInCalendarDays(toZonedTime(fecha, TIMEZONE_GUATE), nowInGuate) === 0;
      });
    } else if (vista === 'proximas') {
      comisionesFiltradas = comisionesData.lista.filter(c => {
        const fecha = parseISO(c.fecha_hora.replace(' ', 'T'));
        return differenceInCalendarDays(toZonedTime(fecha, TIMEZONE_GUATE), nowInGuate) > 0;
      });
    } else {
      comisionesFiltradas = comisionesData.lista.filter(c => {
        const fecha = parseISO(c.fecha_hora.replace(' ', 'T'));
        return differenceInCalendarDays(toZonedTime(fecha, TIMEZONE_GUATE), nowInGuate) < 0;
      });
    }

    if (openComisionId) {
      return comisionesFiltradas.filter(c => c.id === openComisionId);
    }

    return comisionesFiltradas;
  }, [comisionesData, openComisionId, vista]);

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

  const handleRefresh = async () => {
    await refetch();
  };

  if (loading || cargandoUsuario) {
    return <Cargando texto='Cargando sus comisiones...' />;
  }

  if (!userId) {
    return <p className="text-center text-red-500 dark:text-red-400 py-8">Error: No se pudo cargar su información de usuario.</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 dark:text-red-400 py-8">Error: {error}</p>;
  }

  const listaComisionesContenido = (
    <div className="bg-white dark:bg-neutral-950 rounded-lg w-full mx-auto transition-colors duration-200">
      <ListaMisComisiones
        vista={vista}
        setVista={setVista}
        mesSeleccionado={mesSeleccionado}
        setMesSeleccionado={setMesSeleccionado}
        anioSeleccionado={anioSeleccionado}
        setAnioSeleccionado={setAnioSeleccionado}
        comisionesParaMostrar={comisionesParaMostrar}
        openComisionId={openComisionId}
        onToggleComision={handleToggleComision}
        onAbrirMapa={handleAbrirMapa}
        onAsistenciaMarcada={handleAsistenciaMarcada}
        userId={userId!}
        nombreUsuario={nombre!}
        countHoy={comisionesData.countHoy}
        countProximas={comisionesData.countProximas}
        countTerminadas={comisionesData.countTerminadas}
      />
    </div>
  );

  return (
    <>
      {!isMobile && (
        <div className="flex justify-center">
          <Button 
            onClick={handleRefresh} 
            variant="ghost"
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
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

      <AnimatePresence>
        {modalMapaAbierto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Mapa
              titulo="Comision"
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