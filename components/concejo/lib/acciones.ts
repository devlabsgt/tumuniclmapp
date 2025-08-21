'use client';

import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-toastify';

// Inicialización del cliente Supabase.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define una interfaz para los datos de la agenda.
export interface AgendaConcejo {
  id: string;
  created_at: string;
  fecha_reunion: string;
  titulo: string;
  descripcion: string;
  estado: string;
}

// Interfaz para los datos del formulario de creación.
export interface AgendaFormData {
  titulo: string;
  descripcion: string;
  fecha_reunion: string;
  hora_reunion: string; // <-- Nuevo campo
}

// Función para cargar todas las agendas del concejo desde la base de datos.
export const cargarAgendas = async (): Promise<AgendaConcejo[]> => {
  const { data, error } = await supabase
    .from('agenda_concejo')
    .select('*')
    .order('fecha_reunion', { ascending: false });

  if (error) {
    console.error('Error al cargar agendas:', error.message);
    return [];
  }

  return data as AgendaConcejo[];
};

// Función para crear una nueva agenda en la base de datos.
export const crearAgenda = async (formData: AgendaFormData): Promise<AgendaConcejo | null> => {
  const { data, error } = await supabase
    .from('agenda_concejo')
    .insert({
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      fecha_reunion: formData.fecha_reunion,
      estado: 'En Progreso',
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear la agenda:', error.message);
    toast.error('Error al crear la agenda.');
    return null;
  }

  toast.success('Agenda creada con éxito.');
  return data as AgendaConcejo;
};

// Función para editar una agenda existente.
export const editarAgenda = async (id: string, formData: AgendaFormData): Promise<AgendaConcejo | null> => {
    const { data, error } = await supabase
        .from('agenda_concejo')
        .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion,
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
    return data as AgendaConcejo;
};

export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Nueva función para obtener la hora actual.
export const getNowTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};