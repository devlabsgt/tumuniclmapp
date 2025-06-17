'use client';

import { useEffect, useState } from 'react';

export default function useUserData() {
  const [rol, setRol] = useState('');
  const [permisos, setPermisos] = useState<string[]>([]);
  const [modulos, setModulos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        setRol(data.rol || '');
        setPermisos(data.permisos || []);
        setModulos(data.modulos || []);
      } catch (error) {
        console.error('Error al obtener sesión:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuario();
  }, []);

  return { rol, permisos, modulos, cargando };
}
