"use client";

import { useState, useEffect, useCallback } from "react";
import { obtenerAsuetosRango, Asueto } from "@/lib/asuetos/acciones";

export type { Asueto };

/**
 * Hook para obtener asuetos globales en un rango de fechas.
 */
export function useAsuetos(fechaInicio: string, fechaFin: string) {
  const [asuetos, setAsuetos] = useState<Asueto[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    try {
      const data = await obtenerAsuetosRango(fechaInicio, fechaFin);
      setAsuetos(data);
    } catch {
      setAsuetos([]);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { asuetos, loading, recargar: cargar };
}

/**
 * Dado un string de fecha 'yyyy-MM-dd', retorna el asueto si el día cae dentro del rango fecha_inicio..fecha_fin.
 */
export function getAsuetoPorFecha(asuetos: Asueto[], diaString: string): Asueto | null {
  return asuetos.find((a) => diaString >= a.fecha_inicio && diaString <= a.fecha_fin) || null;
}
