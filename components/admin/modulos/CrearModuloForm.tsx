'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Modulo {
  id: string;
  nombre: string;
}

interface Props {
  onClose: () => void;
  onModuloCreado: (modulo: Modulo) => void;
}

export default function CrearModuloForm({ onClose, onModuloCreado }: Props) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCrearModulo = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('modulos')
      .insert({ nombre })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError('Error al crear el módulo');
      console.error(error);
      return;
    }

    if (data) {
      onModuloCreado(data);
      setNombre('');
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Nombre del módulo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleCrearModulo} disabled={loading || !nombre.trim()}>
          {loading ? 'Creando...' : 'Crear'}
        </Button>
      </div>
    </div>
  );
}
