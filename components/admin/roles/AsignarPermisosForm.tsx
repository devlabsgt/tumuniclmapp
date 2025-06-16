'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

type Props = {
  rolId: string;
  onClose: () => void;
};

type Permiso = {
  id: string;
  nombre: string;
};

type PermisoAsignado = {
  permisos: { nombre: string };
};

export default function AsignarPermisosForm({ rolId, onClose }: Props) {
  const [permisosDisponibles, setPermisosDisponibles] = useState<string[]>([]);
  const [permisosAsignados, setPermisosAsignados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const supabase = createClient();
 
useEffect(() => {
  const cargarPermisos = async () => {
    const { data: permisosRaw } = await supabase
      .from('permisos')
      .select('nombre');

    const { data: asignadosRaw } = await supabase
      .from('roles_permisos')
      .select('permisos(nombre)')
      .eq('rol_id', rolId);

    const permisos: { nombre: string }[] = permisosRaw || [];

    const asignados: string[] =
      (asignadosRaw || []).flatMap((a) => {
        const permisosInternos = a.permisos as { nombre: string } | { nombre: string }[] | null;

        if (Array.isArray(permisosInternos)) {
          return permisosInternos.map((p) => p.nombre);
        }

        if (permisosInternos && 'nombre' in permisosInternos) {
          return [permisosInternos.nombre];
        }

        return [];
      });

    setPermisosDisponibles(permisos.map((p) => p.nombre));
    setPermisosAsignados(asignados);
  };

  cargarPermisos();
}, [rolId, supabase]);


  const togglePermiso = (permiso: string) => {
    setPermisosAsignados((prev) =>
      prev.includes(permiso)
        ? prev.filter((p) => p !== permiso)
        : [...prev, permiso]
    );
  };

  const guardarCambios = async () => {
    setCargando(true);

    const { data: permisosRaw } = await supabase
      .from('permisos')
      .select('id, nombre');

    const permisosTodos: Permiso[] = permisosRaw || [];

    const permisosId = permisosTodos
      .filter((p) => permisosAsignados.includes(p.nombre))
      .map((p) => p.id);

    await supabase.from('roles_permisos').delete().eq('rol_id', rolId);

    const nuevos = permisosId.map((permiso_id) => ({
      rol_id: rolId,
      permiso_id,
    }));

    if (nuevos.length > 0) {
      await supabase.from('roles_permisos').insert(nuevos);
    }

    setCargando(false);
    onClose();
  };

  return (
    <div className=" bg-white max-w-md mx-auto space-y-4">
      {permisosDisponibles.length === 0 ? (
        <p className="text-sm text-gray-500">No hay permisos disponibles.</p>
      ) : (
        <div className="space-y-2">
          {permisosDisponibles.map((permiso) => (
            <label key={permiso} className="block text-sm">
              <input
                type="checkbox"
                className="mr-2"
                checked={permisosAsignados.includes(permiso)}
                onChange={() => togglePermiso(permiso)}
              />
              {permiso}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={guardarCambios} disabled={cargando}>
          {cargando ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
