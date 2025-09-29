// src/app/mis-comisiones/MisComisiones.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getMonth, getYear, parseISO, isToday, isPast, differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { motion, AnimatePresence } from 'framer-motion';

import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Cargando from '@/components/ui/animations/Cargando';
import Mapa from '@/components/ui/modals/Mapa';
import ListaMisComisiones from './ListaMisComisiones'; // Nuevo componente importado

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

  useEffect(() => {
    setOpenComisionId(null);
  }, [vista]);

  const comisionesParaMostrar = useMemo(() => {
    let comisionesFiltradas = comisiones || [];
    const ahora = new Date();
    
    comisionesFiltradas = comisionesFiltradas.filter(c => {
        const fechaComision = parseISO(c.fecha_hora.replace(' ', 'T'));
        const esPasada = isPast(fechaComision) && !isToday(fechaComision);
        return vista === 'proximas' ? !esPasada : esPasada;
    });

    if (openComisionId) {
        return comisionesFiltradas.filter(c => c.id === openComisionId);
    }
    
    return comisionesFiltradas;
  }, [comisiones, openComisionId, vista]);

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
        />
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