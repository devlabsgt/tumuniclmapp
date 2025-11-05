'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  userId: string | null;
  nombre: string;
  email: string;
  rol: string;
  permisos: string[];
  modulos: string[];
  programas: string[];
  cargando: boolean;
  horario_nombre: string | null;
  horario_dias: number[] | null;
  horario_entrada: string | null;
  horario_salida: string | null;
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
  const [horario_nombre, setHorarioNombre] = useState<string | null>(null);
  const [horario_dias, setHorarioDias] = useState<number[] | null>(null);
  const [horario_entrada, setHorarioEntrada] = useState<string | null>(null);
  const [horario_salida, setHorarioSalida] = useState<string | null>(null);
  
  const pathname = usePathname(); 

  useEffect(() => {
    const obtenerUsuario = async () => {
      const supabase = createClient();
      setCargando(true);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: userData, error: dataError } = await supabase.rpc('usuario_sesion');

        if (dataError || !userData || !userData[0]) {
          setUserId(user.id);
          setEmail(user.email || '');
          setNombre('');
          setRol('');
          setPermisos([]);
          setModulos([]);
          setProgramas([]);
          setHorarioNombre(null);
          setHorarioDias(null);
          setHorarioEntrada(null);
          setHorarioSalida(null);
        } else {
          const resultado = userData[0];
          setUserId(resultado.id || null);
          setNombre(resultado.nombre || '');
          setEmail(resultado.email || ''); 
          setRol(resultado.rol || '');
          setPermisos(resultado.permisos || []);
          setModulos(resultado.modulos || []);
          setProgramas(resultado.programas || []);
          setHorarioNombre(resultado.horario_nombre || null);
          setHorarioDias(resultado.horario_dias || null);
          setHorarioEntrada(resultado.horario_entrada || null);
          setHorarioSalida(resultado.horario_salida || null);
        }
      } else {
        setUserId(null);
        setNombre('');
        setEmail('');
        setRol('');
        setPermisos([]);
        setModulos([]);
        setProgramas([]);
        setHorarioNombre(null);
        setHorarioDias(null);
        setHorarioEntrada(null);
        setHorarioSalida(null);
      }
      setCargando(false);
    };

    obtenerUsuario();
  }, [pathname]); 

  return { 
    userId, 
    nombre, 
    email, 
    rol, 
    permisos, 
    modulos, 
    programas, 
    cargando, 
    horario_nombre, 
    horario_dias, 
    horario_entrada, 
    horario_salida 
  };
}