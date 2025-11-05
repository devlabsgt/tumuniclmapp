'use client';

import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/database.types';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// 1. Definimos y exportamos el tipo para que los otros archivos lo usen
export type Horario = Database['public']['Tables']['horarios']['Row'];

// Tipo para la nueva vista de asignación
export interface UsuarioConHorario {
  user_id: string;
  nombre: string | null;
  horario_id: string | null;
  horario_nombre: string | null; // El nombre del horario que ya tiene
}

// 2. Función para cargar los horarios
export const fetchHorarios = async (): Promise<Horario[]> => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    toast.error(err.message || "Error al cargar horarios.");
    return [];
  }
};

// 3. Función para guardar (crear o editar)
export const guardarHorario = async (
  horarioAEditar: Horario | null, 
  horarioData: { nombre: string; dias: number[]; entrada: string; salida: string; }
): Promise<boolean> => {
  const supabase = createClient();
  try {
    let error = null;
    if (horarioAEditar) {
      // Editar
      const { error: updateError } = await supabase
        .from('horarios')
        .update(horarioData)
        .eq('id', horarioAEditar.id);
      error = updateError;
    } else {
      // Crear
      const { error: insertError } = await supabase
        .from('horarios')
        .insert(horarioData);
      error = insertError;
    }

    if (error) throw error;
    
    toast.success('¡Horario guardado correctamente!');
    return true;
  } catch (err: any) {
    toast.error(err.message || 'Error al guardar el horario.');
    return false;
  }
};

// 4. Función para eliminar (CON EL ERROR CORREGIDO)
export const eliminarHorario = async (id: string): Promise<boolean> => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Estás seguro?',
    text: "No podrás revertir esta acción.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (isConfirmed) {
    const supabase = createClient();
    try {
      // --- AQUÍ ESTÁ LA CORRECCIÓN ---
      const { error } = await supabase
        .from('horarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      // ---------------------------------

      toast.success('Horario eliminado.');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar.');
      return false;
    }
  }
  return false;
};

// 5. Nueva función para cargar usuarios CON el nombre de su horario
export const fetchUsuariosConHorario = async (): Promise<UsuarioConHorario[]> => {
  const supabase = createClient();
  try {
    // Usamos un JOIN para traer el nombre del horario
    const { data, error } = await supabase
      .from('info_usuario')
      .select(`
        user_id, 
        nombre, 
        horario_id, 
        horarios ( nombre )
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
      
    if (error) throw error;

    // Aplanamos la data que devuelve Supabase
    return data.map(u => ({
      user_id: u.user_id,
      nombre: u.nombre,
      horario_id: u.horario_id,
      // @ts-ignore
      horario_nombre: u.horarios?.nombre || null 
    })) || [];

  } catch (err: any) {
    toast.error(err.message || "Error al cargar usuarios.");
    return [];
  }
};

// 6. Nueva función para asignar un horario a un usuario
export const asignarHorarioUsuario = async (userId: string, horarioId: string | null): Promise<boolean> => {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('info_usuario')
      .update({ horario_id: horarioId })
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  } catch (err: any) {
    toast.error(err.message || 'Error al asignar horario.');
    return false;
  }
};