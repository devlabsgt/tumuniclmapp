'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export interface Ubicacion {
  lat: number;
  lng: number;
}

export interface GeolocalizacionResult {
  ubicacion: Ubicacion | null;
  cargando: boolean;
  obtenerUbicacion: () => void;
}

export default function useGeolocalizacion(): GeolocalizacionResult {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [cargando, setCargando] = useState(false);

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'Su navegador no soporta la geolocalización.', 'error');
      return;
    }

    setCargando(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setCargando(false);
      },
      (error) => {
        Swal.fire('Error', 'No se pudo obtener la ubicación. Por favor, asegúrese de que la geolocalización esté habilitada.', 'error');
        setCargando(false);
        console.error('Error de geolocalización:', error);
      }
    );
  };

  return { ubicacion, cargando, obtenerUbicacion };
}