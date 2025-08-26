import { z } from 'zod';

// Define una interfaz para los datos de la agenda.
export interface AgendaConcejo {
  id: string;
  created_at: string;
  fecha_reunion: string;
  titulo: string;
  descripcion: string;
  estado: string;
  acta: string;
  libro: string;
}

// Interfaz para los datos del formulario de creación y edición de agendas.
export interface AgendaFormData {
  titulo: string;
  descripcion: string;
  fecha_reunion: string;
  hora_reunion: string;
  acta: string;
  libro: string;
  estado: string;
}

// Interfaz para los datos de las categorías de las tareas.
export interface CategoriaItem {
  id: string;
  nombre: string;
}

// Interfaz para los datos de las tareas del concejo.
export interface Tarea {
  id: string;
  titulo_item: string;
  categoria: CategoriaItem;
  estado: string;
  notas: string[] | null;
  seguimiento: string[] | null;
  votacion: string | null;
}

// Esquema de validación para el formulario de la Sesión del Concejo.
export const sesionSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  acta: z.string().min(1, 'El número de acta es requerido.'),
  libro: z.string().min(1, 'El número de libro es requerido.'),
  descripcion: z.string().optional(),
  fecha_reunion: z.string().min(1, 'La fecha es requerida.'),
  hora_reunion: z.string().min(1, 'La hora es requerida.'),
});

export type SesionFormData = z.infer<typeof sesionSchema>;

// Esquema de validación para el formulario de la Tarea del Concejo.
export const tareaSchema = z.object({
  titulo_item: z.string().min(3, { message: 'El título de la tarea es obligatorio y debe tener al menos 3 caracteres.' }),
  categoria_id: z.string().uuid({ message: 'Debe seleccionar una categoría válida.' }),
  estado: z.string().min(1, { message: 'El estado es obligatorio.' }),
  notas: z.array(z.string()).optional().nullable(),
  seguimiento: z.array(z.string()).optional().nullable(),
  votacion: z.string().optional(),
});

export type TareaFormData = z.infer<typeof tareaSchema>;