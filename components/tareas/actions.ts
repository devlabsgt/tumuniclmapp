'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChecklistItem, NewTaskState, Tarea, Usuario } from './types'; 

// --- CARGAR DATOS (FILTRADO POR DEPENDENCIA) ---
// --- CARGAR DATOS (CON LOGS DE DEPURACIÓN) ---
// --- CARGAR DATOS (CON LOGS COMPLETOS) ---
// --- CARGAR DATOS (CON LOGICA RECURSIVA DE DEPENDENCIAS) ---
export async function obtenerDatosGestor() {
  const supabase = await createClient();
  
  // 1. Verificamos usuario
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // 2. Traemos perfil
  const { data: perfil } = await supabase
    .from('info_usuario')
    .select('esjefe, dependencia_id') 
    .eq('user_id', user.id)
    .single();

  const esJefe = perfil?.esjefe ?? false;
  const miDependencia = perfil?.dependencia_id;

  // 3. TAREAS (Lógica estándar)
  let query = supabase.from('tasks')
    .select('*') 
    .order('due_date', { ascending: true });

  if (!esJefe) {
    query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
  }

  // 4. PREPARAR FILTRO DE USUARIOS (Lógica Jerárquica)
  let listaDeIds: string[] = [];

  if (miDependencia) {
    // A) Primero averiguamos si mi puesto tiene un PADRE (Ej: Soy 'Conta', padre es 'Finanzas')
    const { data: depActual } = await supabase
      .from('dependencias')
      .select('id, parent_id')
      .eq('id', miDependencia)
      .single();

    const idPadre = depActual?.parent_id;

    if (idPadre) {
      // CASO 1: Tengo un jefe/padre. 
      // Quiero ver a: El Padre (Jefe de área) + Mis hermanos (mismo parent_id) + Yo mismo.
      const { data: familia } = await supabase
        .from('dependencias')
        .select('id')
        .or(`id.eq.${idPadre},parent_id.eq.${idPadre}`); // Trae al padre Y a los hijos
      
      listaDeIds = familia?.map(d => d.id) || [miDependencia];
      
    } else {
      // CASO 2: Yo soy el padre supremo (o no tengo padre asignado).
      // Traemos a los que cuelguen directamente de mí (mis hijos directos) y a mí mismo.
      const { data: hijos } = await supabase
        .from('dependencias')
        .select('id')
        .or(`id.eq.${miDependencia},parent_id.eq.${miDependencia}`);
        
      listaDeIds = hijos?.map(d => d.id) || [miDependencia];
    }
  } else {
    // Si no tengo dependencia, solo me veo a mí mismo (seguridad)
    listaDeIds = []; 
  }

  // 5. CONSULTA FINAL DE USUARIOS
  let usuariosQuery = supabase.from('info_usuario')
    .select('user_id, nombre, esjefe, activo, dependencia_id')
    .eq('activo', true)
    .order('nombre');

  if (listaDeIds.length > 0) {
    // Usamos .in() para buscar en la lista de IDs validos (Padre + Hijos)
    usuariosQuery = usuariosQuery.in('dependencia_id', listaDeIds);
  } else {
    // Fallback: solo yo
    usuariosQuery = usuariosQuery.eq('user_id', user.id);
  }

  const [tareasRes, usuariosRes] = await Promise.all([query, usuariosQuery]);

  const rawTareas = tareasRes.data || [];
  const usuarios = (usuariosRes.data || []) as Usuario[];

  // 6. MANUAL JOIN
  const tareas: Tarea[] = rawTareas.map((t: any) => {
    const creador = usuarios.find(u => u.user_id === t.created_by);
    const asignado = usuarios.find(u => u.user_id === t.assigned_to);

    return {
      ...t,
      creator: { nombre: creador?.nombre || 'Desconocido' }, 
      assignee: { nombre: asignado?.nombre || 'Sin asignar' }
    };
  });

  return {
    usuarioActual: user.id,
    esJefe: esJefe,
    tareas: tareas,
    usuarios: usuarios
  };
}

// --- CREAR TAREA ---
export async function crearTarea(formData: NewTaskState) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: perfil } = await supabase
    .from('info_usuario')
    .select('esjefe')
    .eq('user_id', user.id)
    .single();
    
  const esJefe = perfil?.esjefe ?? false;
  let asignadoFinal = formData.assigned_to || user.id;

  if (!esJefe && asignadoFinal !== user.id) {
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

  if (error) {
    console.error("🔴 Error al crear tarea:", error);
    throw new Error('No se pudo crear: ' + error.message);
  }
  revalidatePath('/protected/tareas');
}

// --- ACTUALIZAR TAREA (CORREGIDO) ---
export async function actualizarTarea(id: string, updates: { title?: string; description?: string; due_date?: string }) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('tasks') 
    .update({
      ...updates
      // ❌ SE ELIMINÓ: updated_at: new Date().toISOString()
      // Al quitar esa línea, Supabase ya no buscará la columna inexistente.
    })
    .eq('id', id);

  if (error) {
    console.error("🔴 Error actualizar tarea:", error);
    throw new Error('Error al actualizar la tarea');
  }
  
  revalidatePath('/protected/tareas');
}

// --- ACTUALIZAR CHECKLIST ---
export async function updateChecklist(taskId: string, newChecklist: ChecklistItem[]) {
  const supabase = await createClient();
  
  const { data: tarea } = await supabase
    .from('tasks')
    .select('status')
    .eq('id', taskId)
    .single();

  // 👇 LIMPIO: Solo actualizamos el checklist
  const updates: any = { 
    checklist: newChecklist
  };

  if (tarea && tarea.status === 'Asignado') {
    const hayItemsCompletados = newChecklist.some(item => item.is_completed);
    if (hayItemsCompletados) {
      updates.status = 'En Proceso';
    }
  }

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.log("🔴 ERROR SUPABASE (Update Checklist):", error.message);
    throw new Error(error.message);
  }
  
  revalidatePath('/protected/tareas');
}

// --- CAMBIAR ESTADO ---
export async function cambiarEstado(taskId: string, nuevoEstado: string) {
  const supabase = await createClient();

  if (nuevoEstado === 'Completado') {
    const { data: tarea } = await supabase.from('tasks').select('checklist').eq('id', taskId).single();
    if (tarea && tarea.checklist) {
      const lista = tarea.checklist as unknown as ChecklistItem[];
      if (lista.some(item => !item.is_completed)) {
        throw new Error("⛔ No puedes finalizar: Faltan items en el checklist.");
      }
    }
  }

  // 👇 LIMPIO: Solo actualizamos el estado
  const { error } = await supabase.from('tasks')
    .update({ 
        status: nuevoEstado
    })
    .eq('id', taskId);

  if (error) {
    console.error("🔴 Error cambiar estado:", error);
    throw new Error(error.message);
  }
  revalidatePath('/protected/tareas');
}

// --- ELIMINAR TAREA ---
export async function eliminarTarea(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  
  if (error) {
    console.error("🔴 Error eliminar:", error);
    throw new Error(error.message);
  }
  revalidatePath('/protected/tareas');
}