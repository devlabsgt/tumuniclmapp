// src/lib/asistencia/esquemas.ts

export interface Asistencia {
  id: number;
  created_at: string;
  tipo_registro: string;
  ubicacion: any;
  notas: string;
  user_id: string;
  nombre: string;
  email: string;
  rol: string;
  programas: string[];
}

export interface Registro {
  id?: number;
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
  user_id?: string;
}