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

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nuevaUbicacion = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          setUbicacion(nuevaUbicacion);
          setCargando(false);
          resolve(nuevaUbicacion);
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          let mensaje = 'No se pudo obtener la ubicación.';
          
          if (error.code === error.TIMEOUT) mensaje = 'Se agotó el tiempo esperando al GPS.';
          if (error.code === error.PERMISSION_DENIED) mensaje = 'Permiso denegado. Active la ubicación.';

          Swal.fire('Error', mensaje, 'error');
          setCargando(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true, 
          maximumAge: 0,            
          timeout: 15000            
        }
      );
    });
  }, []);

  return { ubicacion, cargando, obtenerUbicacion };
}