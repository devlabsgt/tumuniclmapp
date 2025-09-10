'use server';

import { createClient } from '@/utils/supabase/client';

import { revalidatePath } from 'next/cache';
const supabase = createClient();

export async function eliminarTarea(id: number) {
  if (!id) {
    throw new Error('ID de tarea no proporcionado.');
  }
  try {
    const { error } = await supabase
      .from('tareas_concejo')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    revalidatePath(`/protected/concejo/agenda/ver/${id}`);
    return true;
  } catch (error) {
    console.error('Error al eliminar la tarea:', error);
    return false;
  }
}