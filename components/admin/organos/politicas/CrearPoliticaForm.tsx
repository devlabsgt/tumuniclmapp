'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'; // Importar Label para mejor semántica y estilos

type Politica = {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string | null;
  "No": number | null;
};

interface Props {
  onClose: () => void;
  onPoliticaCreada: (politica: Politica) => void;
}

export default function CrearPoliticaForm({ onClose, onPoliticaCreada }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [numero, setNumero] = useState<number | ''>(''); // Para el campo "No"
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCrearPolitica = async () => {
    setError(null);

    if (!nombre.trim() || !codigo.trim() || numero === '') {
      setError('Nombre, Código y No. de Política son obligatorios.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('politicas')
      .insert({ 
        nombre: nombre.trim(), 
        descripcion: descripcion.trim() || null, // Guardar null si está vacío
        codigo: codigo.trim(),
        "No": Number(numero) // Convertir a número
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message.includes('unique constraint') 
        ? 'Ya existe una política con ese nombre, código o número.'
        : 'Error al crear la política. Intente de nuevo.');
      console.error(error);
      return;
    }

    if (data) {
      onPoliticaCreada(data);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre de la Política</Label>
        <Input
          id="nombre"
          placeholder="Ej. Política de Transparencia"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Input
          id="descripcion"
          placeholder="Descripción detallada de la política"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="codigo">Código de la Política</Label>
        <Input
          id="codigo"
          placeholder="Ej. P-001"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="numero">No. de Política</Label>
        <Input
          id="numero"
          type="number"
          placeholder="Ej. 1"
          value={numero}
          onChange={(e) => setNumero(Number(e.target.value))}
        />
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleCrearPolitica} disabled={loading || !nombre.trim() || !codigo.trim() || numero === ''}>
          {loading ? 'Creando...' : 'Crear Política'}
        </Button>
      </div>
    </div>
  );
}