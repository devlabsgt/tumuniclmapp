'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, parseISO, isToday, isPast } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { motion, AnimatePresence } from 'framer-motion';

import PullToRefresh from 'react-simple-pull-to-refresh';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/ui/modals/Mapa';
import ListaMisComisiones from './ListaMisComisiones';

export default function MisComisiones() {
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  const [openComisionId, setOpenComisionId] = useState<string | null>(null);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registrosParaMapa, setRegistrosParaMapa] = useState<any>(null);
  const [nombreUsuarioParaMapa, setNombreUsuarioParaMapa] = useState('');
  const [vista, setVista] = useState<'proximas' | 'terminadas'>('proximas');
  const [isMobile, setIsMobile] = useState(false);

  const { userId, nombre, cargando: cargandoUsuario } = useUserData();

  const hookUserId = cargandoUsuario ? null : (userId || null);
  const { comisiones, loading, error, refetch } = useObtenerComisiones(mesSeleccionado, anioSeleccionado, hookUserId);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
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
      return { lista: [], countProximas: 0, countTerminadas: 0 };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let countProximas = 0;
    let countTerminadas = 0;

    const aprobadasYSorteadas = comisiones
      .filter(c => c.aprobado === true)
      .sort((a, b) =>
        parseISO(b.fecha_hora.replace(' ', 'T')).getTime() -
        parseISO(a.fecha_hora.replace(' ', 'T')).getTime()
      );

    aprobadasYSorteadas.forEach(c => {
      const fechaComision = parseISO(c.fecha_hora.split(' ')[0]);
      if (fechaComision >= hoy) {
        countProximas++;
      } else {
        countTerminadas++;
      }
    });

    return { lista: aprobadasYSorteadas, countProximas, countTerminadas };
  }, [comisiones, cargandoUsuario]);

  const comisionesParaMostrar = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let comisionesFiltradas = [];

    if (vista === 'proximas') {
      comisionesFiltradas = comisionesData.lista.filter(c =>
        parseISO(c.fecha_hora.split(' ')[0]) >= hoy
      );
    } else {
      comisionesFiltradas = comisionesData.lista.filter(c =>
        parseISO(c.fecha_hora.split(' ')[0]) < hoy
      );
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
    return <p className="text-center text-red-500 py-8">Error: No se pudo cargar su información de usuario.</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">Error: {error}</p>;
  }

  const listaComisionesContenido = (
    <div className="bg-white rounded-lg w-full mx-auto">
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
        countProximas={comisionesData.countProximas}
        countTerminadas={comisionesData.countTerminadas}
      />
    </div>
  );

  return (
    <>
      {!isMobile && (
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="ghost">
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
              <p className="text-xs text-gray-500 mb-1 animate-bounce">
                Suelta para actualizar
              </p>
              <ArrowDown className="h-4 w-4 text-gray-500" />
            </div>
          }
          refreshingContent={
            <div className="flex flex-col justify-center items-center h-16">
              <p className="text-xs text-gray-500 mb-1 animate-bounce">
                Suelta para actualizar
              </p>
              <ArrowDown className="h-4 w-4 text-gray-500" />
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