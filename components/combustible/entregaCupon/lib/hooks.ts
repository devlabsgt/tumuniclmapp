'use client'

import { useState, useCallback } from 'react'; 
import { getSolicitudesParaEntrega } from './actions'; 
import { SolicitudEntrega } from './schemas'; 

export const useSolicitudes = (initialData: SolicitudEntrega[] = []) => {
  
  // Inicializamos el estado con esa data que viene del servidor
  const [solicitudes, setSolicitudes] = useState<SolicitudEntrega[]>(initialData);
  
  // Si ya tenemos data inicial, no estamos "cargando".
  const [loading, setLoading] = useState(false); 

  const fetchSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSolicitudesParaEntrega();
      setSolicitudes(data);
    } catch (error) {
      console.error("Error en hook:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- NUEVA FUNCIÓN: Actualización Local Inmediata (Optimistic UI) ---
  // Permite modificar una solicitud específica en la lista localmente
  const updateLocalSolicitud = (id: number, fields: Partial<SolicitudEntrega>) => {
    setSolicitudes(prev => prev.map(sol => 
        sol.id === id ? { ...sol, ...fields } : sol
    ));
  };

  return {
    solicitudes,
    loading,
    refresh: fetchSolicitudes,
    updateLocalSolicitud // <--- Exportamos la nueva función
  };
};