'use client';

import { useState, useEffect } from 'react';

export default function useFechaHora() {
  const [fechaHoraGt, setFechaHoraGt] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setFechaHoraGt(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return fechaHoraGt;
}