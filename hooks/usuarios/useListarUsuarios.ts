import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Usuario } from '@/components/admin/users/types';

export function useListaUsuarios() {
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users/listar');
        const json = await res.json();

        if (!res.ok) {
          console.error('Error al obtener usuarios:', json.error);
          toast.error('Error al cargar la lista de usuarios.');
          setTodosLosUsuarios([]);
          return;
        }
        setTodosLosUsuarios(json.data ?? []);
      } catch (error) {
        console.error('Error inesperado al obtener usuarios:', error);
        toast.error('Error inesperado al cargar los usuarios.');
        setTodosLosUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    obtenerUsuarios();
  }, []);

  return { todosLosUsuarios, loading };
}