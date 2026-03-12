'use client';

import { useState, useEffect } from 'react';
import { obtenerPermisosDelUsuario } from '@/components/permisos/acciones';
import { PermisoEmpleado } from '@/components/permisos/types';

export function usePermisosUsuario(userId: string | null) {
  const [permisos, setPermisos] = useState<PermisoEmpleado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    obtenerPermisosDelUsuario(userId)
      .then(setPermisos)
      .catch(() => setPermisos([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return { permisos, loading };
}
