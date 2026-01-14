// components/tareas/types.ts

// 1. USUARIO
export interface Usuario {
  user_id: string; // PK
  nombre: string;
  esjefe: boolean;
  activo: boolean;
}

// 2. CHECKLIST
export interface ChecklistItem {
  title: string;
  is_completed: boolean;
}

// 3. TAREA (Lo que viene de la Base de Datos)
export interface Tarea {
  id: string;
  title: string;
  description: string | null;
  due_date: string; // ISO string
  status: string;   
  checklist: ChecklistItem[] | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  assignee?: { nombre: string };
  creator?: { nombre: string };
}

// 4. NUEVA TAREA (Lo que enviamos desde el formulario)
export interface NewTaskState {
  title: string;
  description?: string | null; // 👈 Lo hacemos opcional (?) para evitar errores con vacíos
  due_date: string;
  assigned_to: string;
  checklist: ChecklistItem[];
  status?: string; // 👈 ¡CLAVE! Ponemos el '?' para que sea opcional
}