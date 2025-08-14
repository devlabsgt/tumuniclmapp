'use client';

import { useEffect, useState } from 'react';

interface UserData {
  userId: string | null;
  nombre: string;
  email: string; 
  rol: string;
  permisos: string[];
  modulos: string[];
  programas: string[];
  cargando: boolean;
}

export default function useUserData(): UserData {
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState(''); 
  const [rol, setRol] = useState('');
  const [permisos, setPermisos] = useState<string[]>([]);
  const [modulos, setModulos] = useState<string[]>([]);
  const [programas, setProgramas] = useState<string[]>([]); 
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        
        setUserId(data.id || null);
        setNombre(data.nombre || '');
        setEmail(data.email || ''); 
        setRol(data.rol || '');
        setPermisos(data.permisos || []);
        setModulos(data.modulos || []);
        setProgramas(data.programas || []);
      } catch (error) {
        console.error('Error al obtener sesión:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuario();
  }, []);

  // Se retorna el email junto con los demás datos
  return { userId, nombre, email, rol, permisos, modulos, programas, cargando };
}