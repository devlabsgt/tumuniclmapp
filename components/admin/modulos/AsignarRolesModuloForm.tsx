'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

type Props = {
  moduloId: string;
  onClose: () => void;
};

type Rol = {
  id: string;
  nombre: string;
};

export default function AsignarRolesModuloForm({ moduloId, onClose }: Props) {
  const [rolesDisponibles, setRolesDisponibles] = useState<string[]>([]);
  const [rolesAsignados, setRolesAsignados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const cargarRoles = async () => {
      const { data: rolesRaw } = await supabase
        .from('roles')
        .select('nombre');

      const { data: asignadosRaw } = await supabase
        .from('modulos_roles')
        .select('roles(nombre)')
        .eq('modulo_id', moduloId);

      const roles: { nombre: string }[] = rolesRaw || [];

      const asignados: string[] =
        (asignadosRaw || []).flatMap((a) => {
          const internos = a.roles as { nombre: string } | { nombre: string }[] | null;

          if (Array.isArray(internos)) return internos.map((r) => r.nombre);
          if (internos && 'nombre' in internos) return [internos.nombre];
          return [];
        });

      setRolesDisponibles(roles.map((r) => r.nombre));
      setRolesAsignados(asignados);
    };

    cargarRoles();
  }, [moduloId]);

  const toggleRol = (rol: string) => {
    setRolesAsignados((prev) =>
      prev.includes(rol)
        ? prev.filter((r) => r !== rol)
        : [...prev, rol]
    );
  };

  const guardarCambios = async () => {
    setCargando(true);

    const { data: rolesRaw } = await supabase
      .from('roles')
      .select('id, nombre');

    const rolesTodos: Rol[] = rolesRaw || [];

    const rolesId = rolesTodos
      .filter((r) => rolesAsignados.includes(r.nombre))
      .map((r) => r.id);

    await supabase.from('modulos_roles').delete().eq('modulo_id', moduloId);

    const nuevos = rolesId.map((rol_id) => ({
      modulo_id: moduloId,
      rol_id,
    }));

    if (nuevos.length > 0) {
      await supabase.from('modulos_roles').insert(nuevos);
    }

    setCargando(false);
    onClose();
  };

  return (
    <div className="bg-white max-w-md mx-auto space-y-4">
      {rolesDisponibles.length === 0 ? (
        <p className="text-sm text-gray-500">No hay roles disponibles.</p>
      ) : (
        <div className="space-y-2">
          {rolesDisponibles.map((rol) => (
            <label key={rol} className="block text-sm">
              <input
                type="checkbox"
                className="mr-2"
                checked={rolesAsignados.includes(rol)}
                onChange={() => toggleRol(rol)}
              />
              {rol}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardarCambios} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
