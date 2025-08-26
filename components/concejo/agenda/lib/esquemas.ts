import { z } from 'zod';

// Esquema para la Sesión del Concejo
export const sesionSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  acta: z.string().min(1, 'El número de acta es requerido.'),
  libro: z.string().min(1, 'El número de libro es requerido.'),
  descripcion: z.string().optional(),
  fecha_reunion: z.string().min(1, 'La fecha es requerida.'),
  hora_reunion: z.string().min(1, 'La hora es requerida.'),
});

export type SesionFormData = z.infer<typeof sesionSchema>;

// Esquema para la Tarea del Concejo
export const tareaSchema = z.object({
  titulo_item: z.string().min(3, { message: 'El título de la tarea es obligatorio y debe tener al menos 3 caracteres.' }),
  categoria_id: z.string().uuid({ message: 'Debe seleccionar una categoría válida.' }),
  estado: z.string().min(1, { message: 'El estado es obligatorio.' }),
  notas: z.array(z.string()).optional().nullable(),
  seguimiento: z.array(z.string()).optional().nullable(),
  fecha_vencimiento: z.string().min(1, { message: 'La fecha de vencimiento es obligatoria.' }),
});

export type TareaFormData = z.infer<typeof tareaSchema>;