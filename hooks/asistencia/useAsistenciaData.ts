'use client';

import { useState, useEffect } from 'react';
import { obtenerTodosLosRegistros, Registro, eliminarRegistroAsistencia, obtenerRegistrosHoy } from '@/lib/asistencia/acciones';

export default function useAsistenciaData(userId: string | undefined) {
  const [registrosHoy, setRegistrosHoy] = useState<Registro[]>([]);
  const [todosLosRegistros, setTodosLosRegistros] = useState<Registro[]>([]);
  const [cargandoHoy, setCargandoHoy] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(true);

  const handleEliminarRegistro = async (registro: Registro) => {
    if (!registro.id) return;
    const exito = await eliminarRegistroAsistencia(registro.id);

    if (exito) {
      setRegistrosHoy((prev) => prev.filter((r) => r.id !== registro.id));
      setTodosLosRegistros((prev) => prev.filter((r) => r.id !== registro.id));
    }
  };

  useEffect(() => {
    if (!userId) {
      setCargandoHoy(false);
      setRegistrosHoy([]);
      return;
    }

    const verificarAsistenciaHoy = async () => {
      setCargandoHoy(true);
      const data = await obtenerRegistrosHoy(userId);
      setRegistrosHoy(data);
      setCargandoHoy(false);
    };

    verificarAsistenciaHoy();

    const intervalId = setInterval(verificarAsistenciaHoy, 60000);

    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCargandoRegistros(false);
      setTodosLosRegistros([]);
      return;
    }
    
    const consultarTodosLosRegistros = async () => {
      setCargandoRegistros(true);
      const data = await obtenerTodosLosRegistros(userId);
      setTodosLosRegistros(data);
      setCargandoRegistros(false);
    };
    consultarTodosLosRegistros();
  }, [userId]);

  return {
    registrosHoy,
    todosLosRegistros,
    cargandoHoy,
    cargandoRegistros,
    setRegistrosHoy,
    setTodosLosRegistros,
    handleEliminarRegistro
  };
}