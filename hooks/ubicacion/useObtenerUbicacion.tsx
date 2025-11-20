import { useState, useCallback } from 'react';

export interface Coordenadas {
  lat: number;
  lng: number;
  accuracy: number;
}

export const useObtenerUbicacion = () => {
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const obtenerUbicacion = useCallback(async (): Promise<Coordenadas | null> => {
    setCargando(true);
    setError(null);

    if (!('geolocation' in navigator)) {
      setError('La geolocalización no está soportada en este navegador.');
      setCargando(false);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUbicacion(coords);
          setCargando(false);
          resolve(coords);
        },
        (err) => {
          let msg = 'Error al obtener ubicación.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              msg = 'Permiso de ubicación denegado.';
              break;
            case err.POSITION_UNAVAILABLE:
              msg = 'La ubicación no está disponible.';
              break;
            case err.TIMEOUT:
              msg = 'Se agotó el tiempo para obtener la ubicación.';
              break;
          }
          setError(msg);
          setCargando(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }, []);

  return { ubicacion, error, cargando, obtenerUbicacion };
};