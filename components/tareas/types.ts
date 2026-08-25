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

export interface ArchivoAdjunto {
  id: string;
  tipo: 'pdf' | 'enlace';
  nombre: string;
  url: string;
  ruta_storage?: string; // Solo para PDFs
  cargado_por?: string;  // Nombre del usuario que subió el archivo
}

// --- Tipos para actividades grupales ---

/** Una sub-tarea dentro del JSONB de asignaciones de un miembro */
export interface AsignacionMiembro {
  title: string;
  is_complete: boolean;
}

/** Un registro de la tabla act_miembros */
export interface ActMiembro {
  id: string;
  id_act: string;
  id_user: string;
  asignaciones: AsignacionMiembro[];
  completed_at: string | null;
  comentario: string | null;
  created_at: string;
  // Resuelto en el SA por join lógico con info_usuario
  nombre_usuario?: string;
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
  updated_at?: string | null;
  confirmed_at: string | null;
  archivos: ArchivoAdjunto[] | null;
  
  // Relaciones expandidas
  assignee?: { 
    nombre: string; 
    oficina_nombre?: string; // Para agrupar visualmente
  };
  creator?: { nombre: string };
  
  // Miembros grupales (solo presente si la tarea tiene registros en act_miembros)
  miembros?: ActMiembro[];
  
  // Propiedades calculadas en el frontend
  estadoFiltro?: string;
  alcance?: 'equipo' | 'externa';
  es_concejo?: boolean;
  punto_titulo?: string;
  agenda_titulo?: string;
  agenda_fecha?: string;
}

export interface NewTaskState {
  title: string;
  description?: string | null;
  due_date: string;
  assigned_to: string;
  checklist: ChecklistItem[];
  status?: string;
  // Miembros para actividades grupales (opcional)
  miembros?: { userId: string; asignaciones: AsignacionMiembro[] }[];
}