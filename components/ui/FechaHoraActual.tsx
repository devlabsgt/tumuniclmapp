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
      
      const formateador = new Intl.DateTimeFormat('es-GT', opcionesFecha);
      const partes = formateador.formatToParts(ahora);

      const diaSemana = partes.find(p => p.type === 'weekday')?.value ?? '';
      const dia = partes.find(p => p.type === 'day')?.value ?? '';
      let mes = partes.find(p => p.type === 'month')?.value ?? '';
      const anio = partes.find(p => p.type === 'year')?.value ?? '';

      mes = mes.substring(0, 3);

      const fechaFormateada = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${dia}, ${mes}, ${anio}`;
      
      const horaConPeriodo = ahora.toLocaleTimeString('es-GT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/Guatemala',
      });

      // Se elimina el espacio antes de AM/PM
      const horaFormateada = horaConPeriodo
        .replace(/\./g, '')          // Quita puntos (ej. p.m.)
        .toUpperCase()              // Convierte a mayúsculas
        .replace(/\s+/, '');        // Quita el espacio

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