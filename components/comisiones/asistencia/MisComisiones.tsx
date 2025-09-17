'use client';

import React, { useState, useMemo } from 'react';
import { format, getMonth, getYear, setMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useObtenerComisiones, ComisionConFechaYHoraSeparada } from '@/hooks/comisiones/useObtenerComisiones';
import useUserData from '@/hooks/sesion/useUserData';
import Cargando from '@/components/ui/animations/Cargando';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import AsistenciaComision from './AsistenciaComision';

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

export default function MisComisiones() {
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));
  
  const [openComisionId, setOpenComisionId] = useState<string | null>(null);

  const { userId, nombre, cargando: cargandoUsuario } = useUserData(); // Obtenemos el nombre aquí
  const { comisiones, loading, error } = useObtenerComisiones(mesSeleccionado, anioSeleccionado, userId);

  const comisionesAgrupadasPorFecha = useMemo(() => {
    const grupos: { [key: string]: ComisionConFechaYHoraSeparada[] } = {};
    if (!comisiones) return grupos;

    comisiones.forEach(comision => {
      const fecha = parseISO(comision.fecha_hora);
      const fechaLocal = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000 - 360 * 60 * 1000);
      const fechaClave = format(fechaLocal, 'EEEE, d MMMM yyyy', { locale: es });
      if (!grupos[fechaClave]) {
        grupos[fechaClave] = [];
      }
      grupos[fechaClave].push(comision);
    });
    return grupos;
  }, [comisiones]);

  const handleToggleComision = (comisionId: string) => {
    setOpenComisionId(prevId => (prevId === comisionId ? null : comisionId));
  };

  if (loading || cargandoUsuario) {
    return <Cargando texto='Cargando sus comisiones...' />;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">Error: {error}</p>;
  }

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 space-y-6 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Mis Comisiones</h2>
        <div className='flex gap-2 items-center'>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 capitalize"
          >
            {meses.map((mes, index) => (
              <option key={index} value={index}>{mes}</option>
            ))}
          </select>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {anios.map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(comisionesAgrupadasPorFecha).length === 0 ? (
          <p className="text-center text-gray-500 py-10">No tiene comisiones asignadas para este mes.</p>
        ) : (
          Object.entries(comisionesAgrupadasPorFecha).map(([fecha, comisionesDelDia]) => (
            <div key={fecha}>
              <h3 className="text-lg font-bold text-gray-700 mb-3 capitalize">{fecha}</h3>
              <div className="space-y-4">
                {comisionesDelDia.map(comision => {
                  const encargado = comision.asistentes?.find(a => a.encargado);
                  const esEncargado = encargado?.id === userId;
                  const fechaUTC = parseISO(comision.fecha_hora);
                  const fechaLocal = new Date(fechaUTC.getTime() + fechaUTC.getTimezoneOffset() * 60000 - 360 * 60 * 1000);

                  return (
                    <div key={comision.id} className="bg-slate-50 rounded-xl shadow-md p-4 border border-gray-200 transition-all duration-300">
                      <div className="cursor-pointer" onClick={() => handleToggleComision(comision.id)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                              {comision.titulo}
                              {esEncargado && <Badge variant="default">Encargado</Badge>}
                            </h4>
                            {!esEncargado && encargado && (
                              <p className="text-xs text-gray-500 mt-1">Encargado: {encargado.nombre}</p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {format(fechaLocal, 'h:mm a', { locale: es })}
                          </p>
                        </div>
                        {comision.comentarios && comision.comentarios.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-semibold mb-1">Notas:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {comision.comentarios.map((nota, idx) => (
                                <li key={idx} className="text-sm text-gray-600">{nota}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {openComisionId === comision.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <AsistenciaComision comision={comision} userId={userId!} nombreUsuario={nombre!} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}