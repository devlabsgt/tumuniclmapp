'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation'; // 👈 1. Importar usePathname

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
  
  const pathname = usePathname(); // 👈 2. Obtener la ruta actual

  useEffect(() => {
    const obtenerUsuario = async () => {
      // Forzamos a no usar la caché para obtener siempre los datos más recientes
      const res = await fetch('/api/getuser', { cache: 'no-store' });
      const data = await res.json();
      
      setUserId(data.id || null);
      setNombre(data.nombre || '');
      setEmail(data.email || ''); 
      setRol(data.rol || '');
      setPermisos(data.permisos || []);
      setModulos(data.modulos || []);
      setProgramas(data.programas || []);
      setCargando(false);
    };

    obtenerUsuario();
  }, [pathname]); // 👈 3. LA SOLUCIÓN: El hook se re-ejecuta cada vez que cambia la ruta

  return { userId, nombre, email, rol, permisos, modulos, programas, cargando };
}