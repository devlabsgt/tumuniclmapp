'use client';

import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';

export interface Ubicacion {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface GeolocalizacionResult {
  ubicacion: Ubicacion | null;
  cargando: boolean;
  obtenerUbicacion: () => Promise<Ubicacion | null>;
}

export default function useGeolocalizacion(): GeolocalizacionResult {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [cargando, setCargando] = useState(false);

  const obtenerUbicacion = useCallback((): Promise<Ubicacion | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        Swal.fire('Error', 'Su navegador no soporta la geolocalización.', 'error');
        resolve(null);
        return;
      }

      setCargando(true);

      let watchId: number;
      let timeoutId: NodeJS.Timeout;
      let timeoutExtraId: NodeJS.Timeout;
      let bestCoords: Ubicacion | null = null;
      let lecturas = 0;

      const finishAndResolve = (coordsToReturn: Ubicacion | null, errorMsg?: string) => {
        if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
        if (timeoutId) clearTimeout(timeoutId);
        if (timeoutExtraId) clearTimeout(timeoutExtraId);

        if (coordsToReturn) {
          setUbicacion(coordsToReturn);
        } else if (errorMsg) {
          Swal.fire('Error', errorMsg, 'error');
        }
        setCargando(false);
        resolve(coordsToReturn);
      };

      // Máximo tiempo de espera general
      timeoutId = setTimeout(() => {
        if (bestCoords) {
          finishAndResolve(bestCoords);
        } else {
          finishAndResolve(null, 'Se agotó el tiempo esperando al GPS.');
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

          if (!bestCoords || currentCoords.accuracy! < bestCoords.accuracy!) {
            bestCoords = currentCoords;
          }

          if (currentCoords.accuracy! <= 20) {
            finishAndResolve(bestCoords);
            return;
          }

          if (currentCoords.accuracy! <= 50 && !timeoutExtraId) {
            timeoutExtraId = setTimeout(() => {
              finishAndResolve(bestCoords);
            }, 3000);
          }

          if (lecturas >= 4 && bestCoords.accuracy! <= 100) {
            finishAndResolve(bestCoords);
          }
        },
        (error) => {
          if (bestCoords) {
            finishAndResolve(bestCoords);
            return;
          }
          console.error('Error de geolocalización:', error);
          let mensaje = 'No se pudo obtener la ubicación.';
          
          if (error.code === error.TIMEOUT) mensaje = 'Se agotó el tiempo esperando al GPS.';
          if (error.code === error.PERMISSION_DENIED) mensaje = 'Permiso denegado. Active la ubicación.';

          finishAndResolve(null, mensaje);
        },
        {
          enableHighAccuracy: true, 
          maximumAge: 0,            
          timeout: 10000            
        }
      );
    });
  }, []);

  return { ubicacion, cargando, obtenerUbicacion };
}