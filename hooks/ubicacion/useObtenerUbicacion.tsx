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
      let watchId: number;
      let timeoutId: NodeJS.Timeout;
      let timeoutExtraId: NodeJS.Timeout;
      let bestCoords: Coordenadas | null = null;
      let lecturas = 0;

      const finishAndResolve = (coordsToReturn: Coordenadas | null, errorMsg?: string) => {
        if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
        if (timeoutId) clearTimeout(timeoutId);
        if (timeoutExtraId) clearTimeout(timeoutExtraId);

        if (coordsToReturn) {
          setUbicacion(coordsToReturn);
          setError(null);
        } else if (errorMsg) {
          setError(errorMsg);
        }
        setCargando(false);
        resolve(coordsToReturn);
      };

      // Si después de 12 segundos no tenemos nada perfecto, nos quedamos con lo mejor o fallamos
      timeoutId = setTimeout(() => {
        if (bestCoords) {
          finishAndResolve(bestCoords);
        } else {
          finishAndResolve(null, 'Se agotó el tiempo para obtener la ubicación.');
        }
      }, 12000);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          lecturas++;
          const currentCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          if (!bestCoords || currentCoords.accuracy < bestCoords.accuracy) {
            bestCoords = currentCoords;
          }

          // Si la precisión es de menos de 20 metros, resolvemos inmediatamente (muy preciso)
          if (currentCoords.accuracy <= 20) {
            finishAndResolve(bestCoords);
            return;
          }

          // Si tiene menos de 50 metros y todavía no disparamos el timeout extra
          if (currentCoords.accuracy <= 50 && !timeoutExtraId) {
             timeoutExtraId = setTimeout(() => {
               finishAndResolve(bestCoords);
             }, 3000);
          }

          // A las 4 lecturas aceptables rompemos para que el usuario no espere eternamente
          if (lecturas >= 4 && bestCoords.accuracy <= 100) {
            finishAndResolve(bestCoords);
          }
        },
        (err) => {
          if (bestCoords) {
            finishAndResolve(bestCoords);
            return;
          }
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
          finishAndResolve(null, msg);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000 
        }
      );
    });
  }, []);

  return { ubicacion, error, cargando, obtenerUbicacion };
};