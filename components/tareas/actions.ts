'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { ChecklistItem, NewTaskState, Tarea, Usuario } from './types'; 

// --- CARGAR DATOS (NUEVA LÓGICA: TODOS LOS EMPLEADOS + PRIVACIDAD DE TAREAS) ---
export async function obtenerDatosGestor() {
  const supabase = await createClient();
  
  // 1. Verificamos usuario
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // 2. Traemos perfil (Solo necesitamos saber si es jefe para permisos visuales)
  const { data: perfil } = await supabase
    .from('info_usuario')
    .select('esjefe') 
    .eq('user_id', user.id)
    .single();

  const esJefe = perfil?.esjefe ?? false;

  // 3. TAREAS: Lógica de "Solo lo mío y lo que yo asigne"
  // Traemos tareas donde:
  // A) Yo soy el responsable (assigned_to = yo)
  // B) Yo soy el creador (created_by = yo) -> Esto permite ver las tareas que asignaste a otros
  const { data: rawTareas } = await supabase
    .from('tasks')
    .select('*')
    .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`) 
    .order('due_date', { ascending: true });

  // 4. USUARIOS: Traemos A TODOS los activos (Sin filtro de dependencia)
  // Esto permite asignar tareas a cualquier empleado de la empresa.
  const { data: rawUsuarios } = await supabase
    .from('info_usuario')
    .select('user_id, nombre, esjefe, activo')
    .eq('activo', true)
    .order('nombre');

  const usuarios = (rawUsuarios || []) as Usuario[];
  const misTareas = rawTareas || [];

  // 5. Enriquecemos con nombres (Manual Join)
  const tareas: Tarea[] = misTareas.map((t: any) => {
    // Buscamos los nombres en la lista global de usuarios
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
    usuarios: usuarios // Enviamos la lista completa para el dropdown de "Nueva Tarea"
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

  // Si no es jefe, forzamos que se asigne a sí mismo (seguridad extra)
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

// --- ACTUALIZAR TAREA ---
export async function actualizarTarea(id: string, updates: { title?: string; description?: string; due_date?: string }) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('tasks') 
    .update({
      ...updates
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

  // Solo actualizamos el checklist
  const updates: any = { 
    checklist: newChecklist
  };

  // Si la tarea estaba en "Asignado" y marcamos algo, pasamos a "En Proceso"
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

  // Solo actualizamos el estado
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

// --- DUPLICAR TAREA ---
export async function duplicarTarea(datos: NewTaskState) {
  const supabase = await createClient();

  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("❌ SERVER: Error de autenticación", authError);
        throw new Error("Usuario no autenticado o sesión expirada");
    }

    // 2. Verificar perfil (Jefe)
    const { data: perfil } = await supabase
        .from('info_usuario')
        .select('esjefe')
        .eq('user_id', user.id)
        .single();
    
    const esJefe = perfil?.esjefe ?? false;

    // 3. Preparar el Payload
    let asignadoA = datos.assigned_to;
    if (!asignadoA || (!esJefe && asignadoA !== user.id)) {
        asignadoA = user.id;
    }

    const checklistLimpio = Array.isArray(datos.checklist) 
        ? datos.checklist.map(i => ({ title: String(i.title), is_completed: false }))
        : [];

    if (!datos.due_date) {
        throw new Error("La fecha llegó vacía al servidor");
    }

    const payloadInsert = {
        title: datos.title,
        description: datos.description || null,
        due_date: datos.due_date,
        assigned_to: asignadoA,
        created_by: user.id,
        status: 'Asignado',
        checklist: checklistLimpio
    };

    // 4. Insertar
    const { data, error } = await supabase
        .from('tasks')
        .insert([payloadInsert])
        .select();

    if (error) {
        console.error("🔴 SERVER ERROR SUPABASE (Detalles):", error);
        throw new Error(`Error BD: ${error.message}`);
    }

    revalidatePath('/protected/tareas');

  } catch (err: any) {
    console.error("💥 SERVER: Excepción capturada:", err);
    throw new Error(err.message || "Error desconocido en servidor");
  }
}