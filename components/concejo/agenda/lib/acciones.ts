'use client';

import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-toastify';
import { TareaFormData, AgendaConcejo, AgendaFormData, CategoriaItem, Tarea } from './esquemas';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getCurrentTimeOnly = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { hour12: false });
};

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
 
  const fechaCompleta = formData.fecha_reunion.includes('T') 
    ? formData.fecha_reunion 
    : `${formData.fecha_reunion}T${formData.hora_reunion || '00:00'}:00`;

  const { data, error } = await supabase
    .from('agenda_concejo')
    .insert({
      titulo: formData.titulo,
      descripcion: formData.descripcion, 
      fecha_reunion: fechaCompleta,
      acta: formData.acta,
      estado: 'En preparación',
    })
    .select()
    .single();

  if (error) {
    console.error("Error de Supabase:", error.message);
    toast.error('Error al crear la agenda.');
    return null;
  }
  
  toast.success('Agenda creada con éxito.');
  return data as AgendaConcejo;
};

export const editarAgenda = async (id: string, formData: AgendaFormData): Promise<AgendaConcejo | null> => {
  const { data: agendaActual } = await supabase
    .from('agenda_concejo')
    .select('estado')
    .eq('id', id)
    .single();

  const fechaCompleta = formData.fecha_reunion.includes('T') 
    ? formData.fecha_reunion 
    : `${formData.fecha_reunion}T${formData.hora_reunion || '00:00'}:00`;

  const updates: any = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    fecha_reunion: fechaCompleta,
    acta: formData.acta,
  };

  if (formData.estado) {
    updates.estado = formData.estado;
  }

  const horaActual = getCurrentTimeOnly();

  if (agendaActual && formData.estado) {
    if (formData.estado === 'En progreso' && agendaActual.estado !== 'En progreso') {
      updates.inicio = horaActual;
    }
    if (formData.estado === 'Finalizada' && agendaActual.estado !== 'Finalizada') {
      updates.fin = horaActual;
    }
    if (formData.estado === 'En preparación' && agendaActual.estado !== 'En preparación') {
        updates.inicio = null;
        updates.fin = null;
    }
  }

  const { data, error } = await supabase
    .from('agenda_concejo')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Error al editar:", error.message);
    toast.error('Error al actualizar la agenda.');
    return null;
  }
  
  toast.success('Agenda actualizada con éxito.');
  return data as AgendaConcejo;
};

export const actualizarEstadoAgenda = async (id: string, estado: string): Promise<void> => {
  const { data: agendaActual } = await supabase
    .from('agenda_concejo')
    .select('estado')
    .eq('id', id)
    .single();

  const updates: any = { estado };
  const horaActual = getCurrentTimeOnly();

  if (agendaActual) {
    if (estado === 'En progreso' && agendaActual.estado !== 'En progreso') {
      updates.inicio = horaActual;
    }
    if (estado === 'Finalizada' && agendaActual.estado !== 'Finalizada') {
      updates.fin = horaActual;
    }
  }

  const { error } = await supabase
    .from('agenda_concejo')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error(error.message);
    toast.error('Error al actualizar el estado.');
  } else {
    toast.success('Estado actualizado con éxito.');
  }
};

export const eliminarAgenda = async (id: string): Promise<boolean> => {
  const { data: agenda } = await supabase
    .from('agenda_concejo')
    .select('acta')
    .eq('id', id)
    .single();

  if (agenda?.acta) {
    await eliminarArchivoActa(agenda.acta);
  }

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

export const subirArchivoActa = async (file: File, path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('actas')
    .upload(path, file, {
      upsert: true
    });

  if (error) {
    console.error(error.message);
    toast.error('Error al subir el archivo del acta.');
    return null;
  }
  return data.path;
};

export const eliminarArchivoActa = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('actas')
    .remove([path]);

  if (error) {
    console.error(error.message);
  }
};

export const obtenerUrlActa = (path: string): string => {
  const { data } = supabase.storage
    .from('actas')
    .getPublicUrl(path);
  
  return data.publicUrl;
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

  // CORREGIDO: Uso explícito de la relación info_usuario_dependencia_id_fkey
  const { data: datosUsuarios, error: errorUsuarios } = await supabase
    .from('info_usuario')
    .select(`
      user_id,
      nombre, 
      dependencias!info_usuario_dependencia_id_fkey (
        nombre
      )
    `)
    .in('user_id', userIds);

  if (errorUsuarios) {
    console.error('Error al obtener datos de usuarios:', errorUsuarios);
    return registros.map(r => ({
        ...r, 
        usuarios: { id: r.user_id, nombre: 'Error carga', puesto: '-' }
    }));
  }

  const registrosConUsuario = registros.map((registro) => {
    const infoUsuario = datosUsuarios?.find((u) => u.user_id === registro.user_id);
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
  // CORREGIDO: Uso explícito de la relación info_usuario_dependencia_id_fkey
  const { data, error } = await supabase
    .from('info_usuario')
    .select(`
      dependencias!info_usuario_dependencia_id_fkey (
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

export interface ReporteFila {
  usuario_id: string;
  nombre: string;
  cargo: string;
  asistencias: Record<string, {
    entrada: string | null;
    salida: string | null;
    devengado: number;
  }>;
  total_devengado: number;
}

export const obtenerDatosReporte = async (agendas: AgendaConcejo[]): Promise<ReporteFila[]> => {
  const agendaIds = agendas.map((a) => a.id);

  if (agendaIds.length === 0) return [];

  const { data: registros, error: errorRegistros } = await supabase
    .from('registros_agenda')
    .select('user_id, agenda_id, tipo_registro, created_at')
    .in('agenda_id', agendaIds)
    .order('created_at', { ascending: true });

  if (errorRegistros) {
    console.error(errorRegistros.message);
    return [];
  }

  const userIds = Array.from(new Set(registros.map((r) => r.user_id)));
  const { data: infoUsuarios, error: errorInfo } = await supabase
    .from('info_usuario')
    .select(`
      user_id,
      nombre,
      dependencias!info_usuario_dependencia_id_fkey (
        nombre
      )
    `)
    .in('user_id', userIds);

  if (errorInfo) {
    console.error(errorInfo.message);
    return [];
  }

  const reporteMap = new Map<string, ReporteFila>();

  infoUsuarios.forEach((info: any) => {
    const dependencia = info.dependencias;
    const cargo = dependencia?.nombre || 'Sin Cargo';
    
    reporteMap.set(info.user_id, {
      usuario_id: info.user_id,
      nombre: info.nombre || 'Desconocido',
      cargo: cargo,
      asistencias: {},
      total_devengado: 0,
    });
  });

  registros.forEach((reg) => {
    const fila = reporteMap.get(reg.user_id);
    if (!fila) return;

    if (!fila.asistencias[reg.agenda_id]) {
      fila.asistencias[reg.agenda_id] = { entrada: null, salida: null, devengado: 0 };
    }

    if (reg.tipo_registro === 'Entrada') {
      fila.asistencias[reg.agenda_id].entrada = reg.created_at;
    } else if (reg.tipo_registro === 'Salida') {
      fila.asistencias[reg.agenda_id].salida = reg.created_at;
    }
  });

  reporteMap.forEach((fila) => {
    Object.keys(fila.asistencias).forEach((agendaId) => {
      const datos = fila.asistencias[agendaId];
      if (datos.entrada && datos.salida) {
        datos.devengado = 2000;
        fila.total_devengado += 2000;
      }
    });
  });

  return Array.from(reporteMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
};

export const obtenerNombreDirectorDAFIM = async (): Promise<string> => {
  // CORREGIDO: Uso explícito de la relación info_usuario_dependencia_id_fkey
  const { data, error } = await supabase
    .from('info_usuario')
    .select(`
      nombre,
      dependencias!info_usuario_dependencia_id_fkey!inner (
        nombre
      )
    `)
    // Usamos ILIKE y comodines para coincidir aunque haya errores de escritura ("Adminsitración")
    .ilike('dependencias.nombre', 'Directora de la Dirección de Admin%Financiera Integrada Municipal')
    .eq('activo', true)
    .maybeSingle();

  if (error || !data) {
    return '';
  }

  return data.nombre;
};