'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';
import { Usuario } from '@/lib/usuarios/esquemas';

export type UsuarioConJerarquia = Usuario & {
  puesto_nombre: string | null;
  oficina_nombre: string | null;
  oficina_path_orden: string | null;
};

export function useListaUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioConJerarquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('obtener_usuarios');

      if (rpcError) {
        console.error('Error en useListaUsuarios:', rpcError);
        toast.error('Error al cargar la lista de usuarios.');
        setError(rpcError.message);
        setUsuarios([]);
      } else {
        setUsuarios(data as UsuarioConJerarquia[] ?? []);
      }
    } catch (err: any) {
      console.error('Error inesperado en useListaUsuarios:', err);
      toast.error('Error inesperado al cargar usuarios.');
      setError(err.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  return { usuarios, loading, error, fetchUsuarios };
}