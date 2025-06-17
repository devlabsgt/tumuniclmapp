'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Rol {
  id: string;
  nombre: string;
}

interface DRolSelectorProps {
  rol: string | null;
  onChange: (rol: string) => void;
  devolver?: 'id' | 'nombre'; // Nuevo: especifica qué valor devolver
}

export default function DRolSelector({ rol, onChange, devolver = 'id' }: DRolSelectorProps) {
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
  const [rolActual, setRolActual] = useState<string>('');

  useEffect(() => {
    const fetchDatos = async () => {
      const supabase = createClient();

      const res = await fetch('/api/getuser');
      const user = await res.json();
      const rolUsuario = user?.rol || '';
      setRolActual(rolUsuario);

      const { data, error } = await supabase.from('roles').select('id, nombre');
      if (error) {
        console.error('Error al obtener roles:', error);
        return;
      }

      const filtrados = data.filter((r) => {
        if (rolUsuario !== 'SUPER') return r.nombre !== 'SUPER';
        return true;
      });

      setRolesDisponibles(filtrados);
    };

    fetchDatos();
  }, []);

  return (
    <div className="flex flex-col gap-1 w-full">
      <select
        id="rol"
        name="rol"
        value={rol ?? ''}
        onChange={(e) => {
          const seleccionado = e.target.value;
          const rolEncontrado = rolesDisponibles.find(r => r.id === seleccionado);
          if (!rolEncontrado) return;

          onChange(devolver === 'nombre' ? rolEncontrado.nombre : rolEncontrado.id);
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
