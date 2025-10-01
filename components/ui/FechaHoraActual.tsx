'use client';

import { useEffect, useState } from 'react';

export default function FechaHoraActual() {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();

      const opcionesFecha: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'America/Guatemala',
      };
      
      const formateadorFecha = new Intl.DateTimeFormat('es-GT', opcionesFecha);
      const fechaFormateada = formateadorFecha.format(ahora);
      
      const horaConPeriodo = ahora.toLocaleTimeString('es-GT', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Guatemala',
      });

      const horaLimpia = horaConPeriodo.replace(/[\s.]/g, '').toUpperCase();
      const horaFinal = horaLimpia.slice(0, -2) + ' ' + horaLimpia.slice(-2);

      setFecha(fechaFormateada);
      setHora(horaFinal);
    };

    actualizar();
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p className="text-xs md:text-base font-semibold capitalize">
        {fecha}
      </p>
      <p className="text-sm md:text-xl font-bold text-blue-600">
        {hora}
      </p>
    </div>
  );
}