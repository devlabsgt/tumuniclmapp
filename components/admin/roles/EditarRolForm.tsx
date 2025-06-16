'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

type Rol = {
  id: string;
  nombre: string;
};

type Props = {
  rol: Rol;
  onClose: () => void;
  onRolActualizado: (rolActualizado: Rol) => void;
};

export default function EditarRolForm({ rol, onClose, onRolActualizado }: Props) {
    if (!rol) return null; // 🔐 Protección extra (opcional, ya no necesaria si el modal lo evita)

  const [nombre, setNombre] = useState(rol.nombre);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

const actualizarRol = async () => {
  setCargando(true);
  setError('');

  if (!nombre.trim()) {
    setError('El nombre del rol es obligatorio');
    setCargando(false);
    return;
  }

  try {
    const res = await fetch('/api/roles/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rol.id, nombre }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.mensaje || 'Error al actualizar el rol');
    }

    onRolActualizado(data);
    onClose();
  } catch (err: any) {
    setError(err.message || 'Error inesperado');
  } finally {
    setCargando(false);
  }
};

  return (
    <div className=" bg-white space-y-4 max-w-sm mx-auto">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Nombre del Rol</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={cargando}>
          Cancelar
        </Button>
        <Button onClick={actualizarRol} disabled={cargando || !nombre.trim()}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>
    </div>
  );
}
