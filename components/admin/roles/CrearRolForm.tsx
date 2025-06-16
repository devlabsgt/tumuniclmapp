'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

type Props = {
  onClose: () => void;
  onRolCreado: (rol: { id: string; nombre: string }) => void;
};

export default function CrearRolForm({ onClose, onRolCreado }: Props) {
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const crearRol = async () => {
    setCargando(true);
    setError('');

    if (!nombre.trim()) {
      setError('El nombre del rol es obligatorio');
      setCargando(false);
      return;
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([{ nombre }])
      .select()
      .single();

    if (error) {
      setError('No se pudo crear el rol. Intente de nuevo.');
      setCargando(false);
      return;
    }

    onRolCreado(data);
    onClose();
  };

  return (
    <div className=" bg-white space-y-4 max-w-md mx-auto">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Nombre del Rol</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          placeholder="Ej. Inventario, Coordinador, Finanzas..."
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={cargando}>
          Cancelar
        </Button>
        <Button onClick={crearRol} disabled={cargando || !nombre.trim()}>
          {cargando ? 'Creando...' : 'Crear Rol'}
        </Button>
      </div>
    </div>
  );
}
