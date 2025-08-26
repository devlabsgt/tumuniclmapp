'use client';

import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-toastify';
import { TareaFormData } from './esquemas';

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

export interface CategoriaItem {
  id: string;
  nombre: string;
}

export interface Tarea {
  id: string;
  titulo_item: string;
  categoria: CategoriaItem;
  estado: string;
  notas: string[] | null;
  seguimiento: string[] | null;
  fecha_vencimiento: string | null;
}

// Interfaz para los datos del formulario de creación.
export interface AgendaFormData {
  titulo: string;
  descripcion: string;
  fecha_reunion: string;
  hora_reunion: string;
}

// === Funciones de la Agenda ===
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

export const fetchAgendaConcejoPorId = async (id: string): Promise<AgendaConcejo | null> => {
  const { data, error } = await supabase
    .from('agenda_concejo')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al cargar la agenda:', error.message);
    return null;
  }
  return data as AgendaConcejo;
};

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

// === Funciones de las Categorías ===
export const fetchCategorias = async (): Promise<CategoriaItem[]> => {
  const { data, error } = await supabase
    .from('categorias_tareas_concejo')
    .select('*');

  if (error) {
    console.error('Error al cargar categorías:', error.message);
    return [];
  }
  return data as CategoriaItem[];
};

export const crearCategoria = async (nombre: string): Promise<void> => {
  const { error } = await supabase
    .from('categorias_tareas_concejo')
    .insert({ nombre });

  if (error) {
    console.error('Error al crear la categoría:', error.message);
    toast.error('Error al crear la categoría.');
  } else {
    toast.success('Categoría creada con éxito.');
  }
};

export const editarCategoria = async (id: string, nombre: string): Promise<void> => {
  const { error } = await supabase
    .from('categorias_tareas_concejo')
    .update({ nombre })
    .eq('id', id);

  if (error) {
    console.error('Error al editar la categoría:', error.message);
    toast.error('Error al editar la categoría.');
  } else {
    toast.success('Categoría actualizada con éxito.');
  }
};

// === Funciones de las Tareas ===
export const crearTarea = async (formData: TareaFormData, agendaId: string): Promise<Tarea | null> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .insert({
      titulo_item: formData.titulo_item,
      categoria_id: formData.categoria_id,
      estado: formData.estado,
      notas: formData.notas,
      seguimiento: formData.seguimiento,
      fecha_vencimiento: formData.fecha_vencimiento,
      agenda_concejo_id: agendaId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error al crear la tarea:', error.message);
    toast.error('Error al crear la tarea.');
    return null;
  }
  toast.success('Tarea creada con éxito.');
  return data as Tarea;
};

export const editarTarea = async (id: string, formData: TareaFormData): Promise<Tarea | null> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .update({
      titulo_item: formData.titulo_item,
      categoria_id: formData.categoria_id,
      estado: formData.estado,
      notas: formData.notas,
      seguimiento: formData.seguimiento,
      fecha_vencimiento: formData.fecha_vencimiento,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al editar la tarea:', error.message);
    toast.error('Error al editar la tarea.');
    return null;
  }
  toast.success('Tarea actualizada con éxito.');
  return data as Tarea;
};

export const eliminarTarea = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tareas_concejo')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar la tarea:', error.message);
    throw new Error('Error al eliminar la tarea.');
  }
};

export const fetchTareasDeAgenda = async (agendaId: string): Promise<Tarea[]> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .select('*, categoria:categorias_tareas_concejo(*)')
    .eq('agenda_concejo_id', agendaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al cargar las tareas de la agenda:', error.message);
    return [];
  }
  return data as Tarea[];
};

export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getNowTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const actualizarNotas = async (tareaId: string, notas: string[]): Promise<void> => {
  const { error } = await supabase
    .from('tareas_concejo')
    .update({ notas })
    .eq('id', tareaId);

  if (error) {
    console.error('Error al actualizar notas:', error.message);
    toast.error('Error al actualizar notas.');
  } else {
    toast.success('Notas actualizadas con éxito.');
  }
};

export const actualizarSeguimiento = async (tareaId: string, seguimiento: string[]): Promise<void> => {
  const { error } = await supabase
    .from('tareas_concejo')
    .update({ seguimiento })
    .eq('id', tareaId);

  if (error) {
    console.error('Error al actualizar seguimiento:', error.message);
    toast.error('Error al actualizar seguimiento.');
  } else {
    toast.success('Seguimiento actualizado con éxito.');
  }
};