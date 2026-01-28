// components/tareas/types.ts

export type TipoVistaTareas = 'mis_actividades' | 'gestion_jefe' | 'gestion_rrhh';

export interface OficinaInfo {
  id: string;
  nombre: string;
}

export interface PerfilUsuario {
  id: string;
  nombre: string;
  rol: string | null;
  esJefe: boolean;
  oficinasACargo: OficinaInfo[];
}

export interface Usuario {
  user_id: string;
  nombre: string;
  esjefe: boolean;
  activo: boolean;
  oficina_nombre?: string | null; // Vital para agrupar
  dependencia_id?: string | null;
  puesto_nombre?: string | null;
}

export interface ChecklistItem {
  title: string;
  is_completed: boolean;
}

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
  
  // Relaciones expandidas
  assignee?: { 
    nombre: string; 
    oficina_nombre?: string; // Para agrupar visualmente
  };
  creator?: { nombre: string };
  
  // Propiedades calculadas en el frontend
  estadoFiltro?: string; 
}

export interface NewTaskState {
  title: string;
  description?: string | null;
  due_date: string;
  assigned_to: string;
  checklist: ChecklistItem[];
  status?: string;
}