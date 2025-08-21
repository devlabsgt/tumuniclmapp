import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-toastify';
import { TareaFormData } from './esquemas';
import { registrarLog } from '@/utils/registrarLog';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define las interfaces necesarias para los datos
export interface CategoriaItem {
  id: string;
  nombre: string;
}

export interface Tarea {
  id: string;
  agenda_concejo_id: string;
  titulo_item: string;
  categoria: CategoriaItem;
  estado: string;
  created_at: string;
  notas: string | null;
  fecha_vencimiento: string | null;
}

// Función para obtener las categorías de la base de datos.
export const fetchCategorias = async (): Promise<CategoriaItem[]> => {
  const { data, error } = await supabase
    .from('categorias_agenda_concejo')
    .select('id, nombre');

  if (error) {
    console.error('Error al cargar categorías:', error.message);
    return [];
  }
  return data as CategoriaItem[];
};


// Función para obtener los detalles de las tareas de una agenda.
export const fetchTareasDeAgenda = async (agendaId: string): Promise<Tarea[]> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .select(`
      id,
      agenda_concejo_id,
      titulo_item,
      categoria:categorias_agenda_concejo(id, nombre),
      estado,
      created_at,
      notas,
      fecha_vencimiento
    `)
    .eq('agenda_concejo_id', agendaId);

  if (error) {
    console.error('Error al cargar tareas:', error.message);
    toast.error(`Error al cargar las tareas: ${error.message}`);
    return [];
  }
  
  // Corregimos el tipo del join para cada objeto en el array
  const formattedData = data.map((item: any) => ({
    ...item,
    categoria: item.categoria[0]
  })) as Tarea[];

  return formattedData;
};

// Función para crear una nueva tarea en la base de datos.
export const crearTarea = async (formData: TareaFormData, agendaId: string): Promise<Tarea | null> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .insert({
      titulo_item: formData.titulo_item,
      categoria_id: formData.categoria_id,
      estado: formData.estado,
      notas: formData.notas,
      fecha_vencimiento: formData.fecha_vencimiento,
      agenda_concejo_id: agendaId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear la tarea:', error.message);
    toast.error(`Error al crear la tarea: ${error.message}`);
    await registrarLog({
      accion: 'ERROR_CREAR_TAREA',
      nombreModulo: 'CONCEJO',
      descripcion: `Error al crear tarea: ${error.message}`,
    });
    return null;
  }

  toast.success('Tarea creada con éxito.');
  await registrarLog({
    accion: 'CREAR_TAREA',
    nombreModulo: 'CONCEJO',
    descripcion: `Tarea creada: ${data.titulo_item}`,
  });
  
  return data as Tarea;
};

// Función para editar una tarea existente.
export const editarTarea = async (id: string, formData: TareaFormData): Promise<Tarea | null> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .update({
      titulo_item: formData.titulo_item,
      categoria_id: formData.categoria_id,
      estado: formData.estado,
      notas: formData.notas,
      fecha_vencimiento: formData.fecha_vencimiento,
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error al actualizar la tarea:', error.message);
    toast.error(`Error al actualizar la tarea: ${error.message}`);
    await registrarLog({
      accion: 'ERROR_EDITAR_TAREA',
      nombreModulo: 'CONCEJO',
      descripcion: `Error al editar tarea ${id}: ${error.message}`,
    });
    return null;
  }

  toast.success('Tarea actualizada con éxito.');
  await registrarLog({
    accion: 'EDITAR_TAREA',
    nombreModulo: 'CONCEJO',
    descripcion: `Tarea editada: ${data.titulo_item}`,
  });
  return data as Tarea;
};

// Función para eliminar una tarea.
export const eliminarTarea = async (id: string) => {
  const { error } = await supabase
    .from('tareas_concejo')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar la tarea:', error.message);
    toast.error(`Error al eliminar la tarea: ${error.message}`);
    await registrarLog({
      accion: 'ERROR_ELIMINAR_TAREA',
      nombreModulo: 'CONCEJO',
      descripcion: `Error al eliminar tarea ${id}: ${error.message}`,
    });
    return false;
  }

  toast.success('Tarea eliminada con éxito.');
  await registrarLog({
    accion: 'ELIMINAR_TAREA',
    nombreModulo: 'CONCEJO',
    descripcion: `Tarea eliminada con id: ${id}`,
  });
  return true;
};