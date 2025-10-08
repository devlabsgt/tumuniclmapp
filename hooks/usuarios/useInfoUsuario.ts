'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface InfoUsuario {
  id: string;
  user_id: string;
  dependencia_id: string;
}

export function useInfoUsuarios() {
  const [infoUsuarios, setInfoUsuarios] = useState<InfoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchInfoUsuarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('info_usuario').select('*');
    if (error) {
      console.error("Error fetching info_usuario:", error);
      setInfoUsuarios([]);
    } else {
      setInfoUsuarios(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchInfoUsuarios();
  }, [fetchInfoUsuarios]);

  return { infoUsuarios, loading, mutate: fetchInfoUsuarios };
}