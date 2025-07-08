'use client';

import { useEffect, useState } from 'react';

export default function FechaHoraActual() {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  useEffect(() => {
    const actualizar = () => {
      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleDateString('es-GT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Guatemala',
      });
      const horaFormateada = ahora.toLocaleTimeString('es-GT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Guatemala',
      });

      setFecha(fechaFormateada);
      setHora(horaFormateada);
    };

    actualizar(); // inicial
    const interval = setInterval(actualizar, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-left leading-tight mb-2">
      <p className="text-xs md:text-sm"><strong>Fecha: </strong>{fecha}</p>
    <p className="text-xs md:text-sm"><strong>Hora: </strong>{hora}</p>
    </div>
  );
}
