import { createClient } from '@/utils/supabase/client';
import Swal from 'sweetalert2';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

const supabase = createClient();

export interface Registro {
  id?: number;
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
  user_id?: string;
}
// Función para obtener los registros de asistencia de un usuario en un día específico
export const obtenerRegistrosHoy = async (userId: string): Promise<Registro[]> => {
  const hoyEnGt = new Date();
  const inicioDelDiaUtc = new Date(hoyEnGt.getFullYear(), hoyEnGt.getMonth(), hoyEnGt.getDate()).toISOString();
  const finDelDiaUtc = new Date(hoyEnGt.getFullYear(), hoyEnGt.getMonth(), hoyEnGt.getDate() + 1).toISOString();

  const { data, error } = await supabase
    .from('registros_asistencia')
    .select('id, created_at, tipo_registro, ubicacion, notas, user_id')
    .eq('user_id', userId)
    .gte('created_at', inicioDelDiaUtc)
    .lt('created_at', finDelDiaUtc);

  if (error) {
    console.error('Error al verificar registros de hoy:', error);
    return [];
  }
  return data;
};
// Función para obtener todos los registros de asistencia de un usuario
export const obtenerTodosLosRegistros = async (userId: string): Promise<Registro[]> => {
  const { data, error } = await supabase
    .from('registros_asistencia')
    .select('id, created_at, tipo_registro, ubicacion, notas, user_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al consultar todos los registros:', error);
    return [];
  }
  return data;
};
// Función para marcar una nueva asistencia
export const marcarNuevaAsistencia = async (
  userId: string,
  tipo: string,
  ubicacion: { lat: number; lng: number },
  notas: string,
): Promise<Registro | null> => {
  const { data: nuevoRegistro, error } = await supabase
    .from('registros_asistencia')
    .insert({
      tipo_registro: tipo,
      ubicacion: ubicacion,
      user_id: userId,
      notas: notas,
    })
    .select('id, created_at, tipo_registro, ubicacion, notas, user_id')
    .single();

  if (error) {
    Swal.fire('Error', `Error al guardar: ${error.message}`, 'error');
    return null;
  }
  return nuevoRegistro;
};

// Función para eliminar un registro
export const eliminarRegistroAsistencia = async (id: number): Promise<boolean> => {
  const result = await Swal.fire({
    title: '¿Está seguro?',
    text: "No podrá revertir esta acción.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    const { error } = await supabase
      .from('registros_asistencia')
      .delete()
      .eq('id', id);

    if (error) {
      Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
      console.error('Error al eliminar registro:', error);
      return false;
    }
    Swal.fire('¡Eliminado!', 'El registro ha sido eliminado.', 'success');
    return true;
  }
  return false;
};

// 💡 Nueva función para obtener todos los registros del mes
export const obtenerRegistrosDelMes = async (fecha: Date): Promise<Registro[]> => {
  const inicioDelMes = startOfMonth(fecha).toISOString();
  const finDelMes = endOfMonth(fecha).toISOString();

  const { data, error } = await supabase
    .from('registros_asistencia')
    .select('id, created_at, tipo_registro, ubicacion, notas, user_id')
    .gte('created_at', inicioDelMes)
    .lt('created_at', finDelMes)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al consultar registros del mes:', error);
    return [];
  }
  return data;
};