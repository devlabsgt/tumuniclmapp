'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import useUserData from '@/hooks/sesion/useUserData';

interface Rol {
  id: string;
  nombre: string;
}

interface DRolSelectorProps {
  rol: string | null;
  onChange: (rolId: string) => void;
}

export default function DRolSelector({ rol, onChange }: DRolSelectorProps) {
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const { rol: rolUsuario, cargando } = useUserData();

  useEffect(() => {
    if (cargando) return;

    const fetchRoles = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('roles').select('id, nombre');
      if (error) {
        console.error('Error al obtener roles:', error);
        return;
      }

      const filtrados = data.filter((r) => {
        if (rolUsuario !== 'SUPER') {
          return r.nombre !== 'SUPER';
        }
        return true;
      });

      setRolesDisponibles(filtrados);
    };

    fetchRoles();
  }, [cargando, rolUsuario]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <select
        id="rol"
        name="rol"
        value={rol ?? ''}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required
        className="border rounded px-3 py-2 h-10 text-sm"
      >
        <option value="">Seleccione un rol</option>
        {rolesDisponibles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}