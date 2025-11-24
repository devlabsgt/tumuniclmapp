'use client';

import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-toastify';
import { TareaFormData, AgendaConcejo, AgendaFormData, CategoriaItem, Tarea } from './esquemas';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const cargarAgendas = async (): Promise<AgendaConcejo[]> => {
  const { data, error } = await supabase
    .from('agenda_concejo')
    .select('*')
    .order('fecha_reunion', { ascending: false });

  if (error) {
    console.error(error.message);
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
    console.error(error.message);
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
      estado: 'En preparación',
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
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
      estado: formData.estado,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(error.message);
    toast.error('Error al actualizar la agenda.');
    return null;
  }
  toast.success('Agenda actualizada con éxito.');
  return data as AgendaConcejo;
};

export const actualizarEstadoAgenda = async (id: string, estado: string): Promise<void> => {
  const { error } = await supabase
    .from('agenda_concejo')
    .update({ estado })
    .eq('id', id);

  if (error) {
    console.error(error.message);
    toast.error('Error al actualizar el estado.');
  } else {
    toast.success('Estado actualizado con éxito.');
  }
};

export const eliminarAgenda = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('agenda_concejo')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error.message);
    toast.error('Error al eliminar la agenda.');
    return false;
  }
  
  toast.success('Agenda eliminada con éxito.');
  return true;
};

export const fetchCategorias = async (): Promise<CategoriaItem[]> => {
  const { data, error } = await supabase
    .from('categorias_tareas_concejo')
    .select('*');

  if (error) {
    console.error(error.message);
    return [];
  }
  return data as CategoriaItem[];
};

export const crearCategoria = async (nombre: string): Promise<void> => {
  const { error } = await supabase
    .from('categorias_tareas_concejo')
    .insert({ nombre });

  if (error) {
    console.error(error.message);
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
    console.error(error.message);
    toast.error('Error al editar la categoría.');
  } else {
    toast.success('Categoría actualizada con éxito.');
  }
};

export const crearTarea = async (formData: TareaFormData, agendaId: string): Promise<Tarea | null> => {
  const { data, error } = await supabase
    .from('tareas_concejo')
    .insert({
      titulo_item: formData.titulo_item,
      categoria_id: formData.categoria_id,
      estado: formData.estado,
      notas: formData.notas,
      seguimiento: formData.seguimiento,
      votacion: formData.votacion,
      agenda_concejo_id: agendaId,
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
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
      votacion: formData.votacion,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
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
    console.error(error.message);
    toast.error('Error al actualizar seguimiento.');
  } else {
    toast.success('Seguimiento actualizado con éxito.');
  }
};


export const fetchAsistenciaGlobalAgenda = async (agendaId: string) => {
  // 1. Obtener los registros de asistencia
  const { data: registros, error: errorRegistros } = await supabase
    .from('registros_agenda')
    .select('*')
    .eq('agenda_id', agendaId);

  if (errorRegistros) {
    console.error('Error al obtener registros:', errorRegistros);
    return [];
  }

  if (!registros || registros.length === 0) {
    return [];
  }

  const userIds = Array.from(new Set(registros.map((r) => r.user_id)));


  const { data: datosUsuarios, error: errorUsuarios } = await supabase
    .from('info_usuario')
    .select(`
      user_id,
      nombre, 
      dependencias (
        nombre
      )
    `)
    .in('user_id', userIds);

  if (errorUsuarios) {
    console.error('Error al obtener datos de usuarios:', errorUsuarios);
    // Retornamos los registros aunque no tengamos los nombres, para que no falle todo
    return registros.map(r => ({
        ...r, 
        usuarios: { id: r.user_id, nombre: 'Error carga', puesto: '-' }
    }));
  }

  // 4. Combinar los registros con la información del usuario
  const registrosConUsuario = registros.map((registro) => {
    // Buscamos la info de este usuario especifico
    const infoUsuario = datosUsuarios?.find((u) => u.user_id === registro.user_id);
    
    // Extraemos el nombre de la dependencia (puesto) de forma segura
    // 'dependencias' puede venir como objeto o array dependiendo de tu configuración 1:1 o 1:N
    const dependenciaData = infoUsuario?.dependencias as any;
    const nombrePuesto = dependenciaData?.nombre || 'Sin dependencia';

    return {
      ...registro,
      usuarios: {
        id: registro.user_id,
        nombre: infoUsuario?.nombre || 'Desconocido',
        puesto: nombrePuesto
      }
    };
  });

  return registrosConUsuario;
};
export const obtenerRegistrosAgendaUsuario = async (userId: string, agendaId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('registros_agenda')
    .select('*')
    .eq('user_id', userId)
    .eq('agenda_id', agendaId);

  if (error) {
    console.error(error.message);
    return [];
  }
  return data || [];
};

export const marcarAsistenciaAgenda = async (
  userId: string,
  agendaId: string,
  tipo: string,
  ubicacion: { lat: number; lng: number },
  notas: string
): Promise<any | null> => {
  const datosUbicacion = {
    latitude: ubicacion.lat,
    longitude: ubicacion.lng,
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('registros_agenda')
    .insert({
      user_id: userId,
      agenda_id: agendaId,
      tipo_registro: tipo,
      ubicacion: datosUbicacion,
      notas: notas,
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }
  return data;
};

export const obtenerPuestoUsuario = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('info_usuario')
    .select(`
      dependencias (
        nombre
      )
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error(error.message);
    }
    return '';
  }

  const dependencia = data?.dependencias as any;
  return dependencia?.nombre || '';
};