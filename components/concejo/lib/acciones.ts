// lib/acciones.ts
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-toastify';

// Inicialización del cliente Supabase.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define una interfaz para los datos de la agenda.
export interface AgendaConsejo {
  id: string;
  created_at: string;
  fecha_reunion: string;
  titulo: string;
  estado: string;
}

// Interfaz para los datos del formulario de creación.
export interface AgendaFormData {
  titulo: string;
  fecha_reunion: string;
}

// Función para cargar todas las agendas del consejo desde la base de datos.
export const cargarAgendas = async (): Promise<AgendaConsejo[]> => {
  const { data, error } = await supabase
    .from('agenda_consejo')
    .select('*')
    .order('fecha_reunion', { ascending: false });

  if (error) {
    console.error('Error al cargar agendas:', error.message);
    return [];
  }

  return data as AgendaConsejo[];
};

// Función para crear una nueva agenda en la base de datos.
export const crearAgenda = async (formData: AgendaFormData): Promise<AgendaConsejo | null> => {
  const { data, error } = await supabase
    .from('agenda_consejo')
    .insert({
      titulo: formData.titulo,
      fecha_reunion: formData.fecha_reunion,
      estado: 'En Progreso', // Estado inicial por defecto
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear la agenda:', error.message);
    toast.error('Error al crear la agenda.');
    return null;
  }

  toast.success('Agenda creada con éxito.');
  return data as AgendaConsejo;
};

// Función para editar una agenda existente.
export const editarAgenda = async (id: string, formData: AgendaFormData): Promise<AgendaConsejo | null> => {
    const { data, error } = await supabase
        .from('agenda_consejo')
        .update({
            titulo: formData.titulo,
            fecha_reunion: formData.fecha_reunion,
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error al actualizar la agenda:', error.message);
        toast.error('Error al actualizar la agenda.');
        return null;
    }

    toast.success('Agenda actualizada con éxito.');
    return data as AgendaConsejo;
};
