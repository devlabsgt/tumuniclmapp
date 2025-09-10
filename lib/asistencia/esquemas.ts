// src/lib/asistencia/esquemas.ts

export interface Asistencia {
  id: number;
  created_at: string;
  tipo_registro: 'Entrada' | 'Salida' | null;
  ubicacion: any;
  notas: string | null;
  user_id: string;
  nombre: string;
  email: string;
  rol: string;
  programas: string[];
}

export interface Registro {
  id?: number;
  created_at: string;
  tipo_registro: 'Entrada' | 'Salida' | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
  user_id?: string;
}