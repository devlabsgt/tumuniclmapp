'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

type Bien = Database['public']['Tables']['bienes']['Row'] & {
  categorias: { nombre: string };
};

export default function Inventario() {
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchBienes = async () => {
      const { data, error } = await supabase
        .from('bienes')
        .select(`
          *,
          categorias ( nombre )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener los bienes:', error);
      } else {
        setBienes(data as Bien[]);
      }
      setLoading(false);
    };

    fetchBienes();
  }, []);

  if (loading) {
    return <div>Cargando inventario...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlativo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bienes.map((bien) => (
            <tr key={bien.id}>
              <td className="px-6 py-4 whitespace-nowrap">{bien.correlativo}</td>
              <td className="px-6 py-4 whitespace-nowrap">{bien.categorias?.nombre || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{bien.descripcion}</td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(bien.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}