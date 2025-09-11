'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Modulo = {
  id: string;
  nombre: string;
};

type Props = {
  modulo: Modulo;
  onClose: () => void;
  onModuloActualizado: (moduloActualizado: Modulo) => void;
};

export default function EditarModuloForm({ modulo, onClose, onModuloActualizado }: Props) {
  if (!modulo) return null;

  const [nombre, setNombre] = useState(modulo.nombre);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const actualizarModulo = async () => {
    setCargando(true);
    setError('');

    if (!nombre.trim()) {
      setError('El nombre del módulo es obligatorio');
      setCargando(false);
      return;
    }

    try {
      const res = await fetch('/api/modulos/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modulo.id, nombre }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Error al actualizar el módulo');
      }

      onModuloActualizado({ id: modulo.id, nombre });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white space-y-4 max-w-sm mx-auto">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Nombre del Módulo</label>
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
        <Button onClick={actualizarModulo} disabled={cargando || !nombre.trim()}>
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>
    </div>
  );
}
