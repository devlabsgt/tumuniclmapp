// components/tareas/types.ts

// ✅ CAMBIO 1: Renombramos 'UsuarioSistema' a 'Usuario' para que coincida con NewTarea.tsx
export interface Usuario {
  user_id: string; // PK
  nombre: string;
  esjefe: boolean;
  activo: boolean;
}

// Estructura de un item del checklist (dentro del JSONB)
export interface ChecklistItem {
  title: string;
  is_completed: boolean;
}

// Estructura de la Tarea (Tabla 'tasks')
export interface Tarea {
  id: string;
  title: string;
  description: string | null;
  due_date: string; // Supabase devuelve timestamptz como string ISO
  status: string;   // Texto: Asignado, En Proceso, Completado...
  checklist: ChecklistItem[];
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relación (Join) con info_usuario
  assignee?: {
    nombre: string;
  };
  creator?: {
    nombre: string;
  };
}

// Datos necesarios para crear una tarea nueva
export interface NewTaskState {
  title: string;
  description: string;
  due_date: string;
  assigned_to: string;
  checklist: ChecklistItem[];
  // ✅ CAMBIO 2: Agregamos 'status' porque actions.ts y NewTarea lo usan al guardar
  status: string; 
}