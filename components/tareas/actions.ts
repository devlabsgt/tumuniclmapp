'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChecklistItem, NewTaskState, Tarea, Usuario, PerfilUsuario, TipoVistaTareas } from './types'; 

async function getRolInterno(userId: string, supabase: any) {
  const { data } = await supabase.from('usuarios_roles').select(`roles (nombre)`).eq('user_id', userId);
  const rolesUsuario = data?.map((item: any) => item.roles?.nombre) || [];
  const rolesPermitidos = ['RRHH', 'SECRETARIO', 'SUPER'];
  return rolesUsuario.find((rol: string) => rolesPermitidos.includes(rol)) || null;
}

async function obtenerPerfilCompleto(userId: string, supabase: any): Promise<PerfilUsuario> {
  const rol = await getRolInterno(userId, supabase);
  const { data: info } = await supabase.from('info_usuario').select('nombre, esjefe').eq('user_id', userId).single();
  const { data: oficinas } = await supabase.from('dependencias').select('id, nombre').eq('jefe_id', userId);

  return {
    id: userId,
    nombre: info?.nombre || 'Usuario',
    rol: rol,
    esJefe: info?.esjefe || (oficinas && oficinas.length > 0) || false,
    oficinasACargo: oficinas?.map((o: any) => ({ id: o.id, nombre: o.nombre })) || []
  };
}

export async function obtenerDatosGestor(tipoVista: TipoVistaTareas) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const perfil = await obtenerPerfilCompleto(user.id, supabase);

  // 1. OBTENER DEPENDENCIAS (Para resolver nombres y jerarquías)
  // Traemos 'parent_id' para saber si un usuario pertenece a una sub-dependencia (puesto) de mi oficina
  const { data: dependencias } = await supabase
    .from('dependencias')
    .select('id, nombre, parent_id');
  
  // Mapa para búsqueda rápida: ID -> Objeto Dependencia
  const depMap = new Map(dependencias?.map((d: any) => [d.id, d]));

  // Helper para obtener el nombre de la OFICINA (Padre) si es un puesto
  const getNombreOficinaReal = (depId: string | null) => {
      if (!depId) return 'Sin Oficina Asignada';
      const dep = depMap.get(depId);
      if (!dep) return 'Oficina Desconocida';
      
      // Si tiene padre, asumimos que el padre es la Oficina y el actual es el Puesto
      if (dep.parent_id) {
          const padre = depMap.get(dep.parent_id);
          return padre ? padre.nombre : dep.nombre;
      }
      // Si no tiene padre, es la oficina principal
      return dep.nombre;
  };

  // Helper para obtener el ID de la OFICINA (Padre) para comparar con el jefe
  const getIdOficinaReal = (depId: string | null) => {
      if (!depId) return null;
      const dep = depMap.get(depId);
      if (!dep) return null;
      return dep.parent_id ? dep.parent_id : dep.id;
  };

  // 2. OBTENER USUARIOS (Solo columnas existentes en tu diagrama)
  const { data: rawUsuarios, error: errorUsuarios } = await supabase
    .from('info_usuario')
    .select('user_id, nombre, esjefe, activo, dependencia_id') 
    .order('nombre');

  if (errorUsuarios) {
      console.error("Error crítico cargando usuarios:", errorUsuarios);
      return { perfil, tareas: [], usuarios: [] };
  }

  // Enriquecemos usuarios calculando su oficina real
  const todosLosUsuarios = (rawUsuarios || []).map((u: any) => ({
      ...u,
      oficina_nombre: getNombreOficinaReal(u.dependencia_id),
      // Guardamos el ID de la oficina real para filtrar fácil abajo
      oficina_real_id: getIdOficinaReal(u.dependencia_id) 
  }));

  // 3. QUERY DE TAREAS
  let query = supabase.from('tasks').select('*').order('due_date', { ascending: true });

  if (tipoVista === 'mis_actividades') {
      query = query.eq('assigned_to', user.id);
  } 
  else if (tipoVista === 'gestion_jefe') {
      if (!perfil.esJefe) return { perfil, tareas: [], usuarios: [] };

      // IDs de las oficinas donde soy jefe
      const misOficinasIds = perfil.oficinasACargo.map(o => o.id);

      // Buscamos empleados que pertenezcan a mis oficinas (directamente o por puesto hijo)
      const misEmpleadosIds = todosLosUsuarios
        .filter((u: any) => u.oficina_real_id && misOficinasIds.includes(u.oficina_real_id))
        .map((u: any) => u.user_id);

      if (misEmpleadosIds.length > 0) {
          // Tareas de mi equipo, EXCLUYÉNDOME A MÍ (para no duplicar)
          query = query.in('assigned_to', misEmpleadosIds).neq('assigned_to', user.id);
      } else {
          return { perfil, tareas: [], usuarios: todosLosUsuarios as Usuario[] };
      }
  }
  else if (tipoVista === 'gestion_rrhh') {
      const esRRHH = ['RRHH', 'SUPER', 'SECRETARIO'].includes(perfil.rol || '');
      if (!esRRHH) return { perfil, tareas: [], usuarios: [] };
      query = query.limit(500);
  }

  const { data: rawTareas, error: errorTareas } = await query;
  
  if (errorTareas) {
      console.error("Error fetching tasks:", errorTareas);
      return { perfil, tareas: [], usuarios: [] };
  }

  // 4. MAPEAR TAREAS
  const tareas: Tarea[] = (rawTareas || []).map((t: any) => {
    const creador = todosLosUsuarios.find((u: any) => u.user_id === t.created_by); 
    const asignado = todosLosUsuarios.find((u: any) => u.user_id === t.assigned_to);

    return {
      ...t,
      creator: { nombre: creador?.nombre || 'Desconocido' }, 
      assignee: { 
          nombre: asignado?.nombre || 'Sin asignar',
          oficina_nombre: asignado?.oficina_nombre || 'Sin Oficina Asignada' 
      }
    };
  });

  return { perfil, tareas, usuarios: todosLosUsuarios as Usuario[] };
}

// --- MUTACIONES (IGUALES, SOLO ASEGURANDO REVALIDATE) ---

export async function crearTarea(formData: NewTaskState) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const perfil = await obtenerPerfilCompleto(user.id, supabase);
  let asignadoFinal = formData.assigned_to || user.id;

  if (!perfil.esJefe && asignadoFinal !== user.id) {
    asignadoFinal = user.id;
  }

  const { error } = await supabase.from('tasks').insert({
    title: formData.title,
    description: formData.description,
    due_date: formData.due_date,
    assigned_to: asignadoFinal,
    created_by: user.id,
    checklist: formData.checklist, 
    status: 'Asignado' 
  });

  if (error) throw new Error(error.message);
  revalidatePath('/protected/actividades');
  revalidatePath('/protected/actividades/jefe');
  revalidatePath('/protected/actividades/rrhh');
}

export async function actualizarTarea(id: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/protected/actividades', 'layout'); 
}

export async function updateChecklist(taskId: string, newChecklist: ChecklistItem[]) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ checklist: newChecklist }).eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/protected/actividades', 'layout');
}

export async function cambiarEstado(taskId: string, nuevoEstado: string) {
  const supabase = await createClient();
  if (nuevoEstado === 'Completado') {
    const { data: tarea } = await supabase.from('tasks').select('checklist').eq('id', taskId).single();
    if (tarea && tarea.checklist) {
      const lista = tarea.checklist as unknown as ChecklistItem[];
      if (lista.some(item => !item.is_completed)) throw new Error("Faltan items por completar.");
    }
  }
  const { error } = await supabase.from('tasks').update({ status: nuevoEstado }).eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/protected/actividades', 'layout');
}

export async function eliminarTarea(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/protected/actividades', 'layout');
}

export async function duplicarTarea(datos: NewTaskState) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.from('tasks').insert([{
        title: datos.title,
        description: datos.description || null,
        due_date: datos.due_date,
        assigned_to: datos.assigned_to || user.id,
        created_by: user.id,
        status: 'Asignado',
        checklist: datos.checklist?.map(i => ({ title: String(i.title), is_completed: false })) || []
  }]);

  if (error) throw new Error(error.message);
  revalidatePath('/protected/actividades', 'layout');
}