'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface InfoUsuarioData {
  id: string | null;
  email: string | null;
  nombre: string | null;
  activo: boolean | null;
  rol: string | null;
  permisos: string[];
  modulos: string[];
  programas: string[];
  direccion: string | null;
  telefono: string | null;
  dpi: string | null;
  nit: string | null;
  igss: string | null;
  cuenta_no: string | null;
  puesto_nombre: string | null;
  puesto_path_jerarquico: string | null;
  puesto_path_ordenado: string | null;
  salario: number | null;
  bonificacion: number | null;
  renglon: string | null;
  prima: boolean | null;
  contrato_no: string | null;
  fecha_ini: string | null;
  fecha_fin: string | null;
  horario_nombre: string | null;
  horario_dias: number[] | null;
  horario_entrada: string | null;
  horario_salida: string | null;
}

export interface InfoUsuario {
    user_id: string;
    dependencia_id: string | null;
}

interface UseInfoUsuariosReturn {
    infoUsuarios: InfoUsuario[];
    loading: boolean;
    mutate: () => void;
}

export function useInfoUsuarios(): UseInfoUsuariosReturn {
    const [infoUsuarios, setInfoUsuarios] = useState<InfoUsuario[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInfoUsuarios = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        
        try {
            const { data, error: rpcError } = await supabase.rpc('info_usuarios');

            if (rpcError) {
                console.error('Error RPC:', rpcError);
                throw rpcError;
            }
            
            setInfoUsuarios(data as InfoUsuario[] ?? []);

        } catch (err: any) {
            console.error('Error al obtener info de usuarios para el árbol:', err);
            setInfoUsuarios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInfoUsuarios();
    }, [fetchInfoUsuarios]);

    return { infoUsuarios, loading, mutate: fetchInfoUsuarios };
}


export function useInfoUsuario(userId: string | null) {
  const [usuario, setUsuario] = useState<InfoUsuarioData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuario = useCallback(async () => {
    if (!userId) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    const supabase = createClient();

    try {
      const { data, error: rpcError } = await supabase.rpc('info_usuario2', {
        p_user_id: userId
      });

      if (rpcError) {
        throw rpcError;
      }

      setUsuario(data && data.length > 0 ? data[0] : null);

// ...
} catch (err: any) {
  console.error('--- ERROR REAL DE SUPABASE ---'); 
  console.error(err); 
  setError(err.message);
  setUsuario(null);
} finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  return { usuario, cargando, error, fetchUsuario };
}