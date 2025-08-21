import { z } from 'zod';

// Esquema para la creación de una Tarea del Concejo
export const tareaSchema = z.object({
  titulo_item: z.string().min(3, { message: 'El título de la tarea es obligatorio y debe tener al menos 3 caracteres.' }),
  categoria_id: z.string().uuid({ message: 'Debe seleccionar una categoría válida.' }),
  estado: z.string().min(1, { message: 'El estado es obligatorio.' }),
  notas: z.string().optional().nullable(),
  fecha_vencimiento: z.string().optional().nullable(),
});

// Tipos exportados para usar en la aplicación
export type TareaFormData = z.infer<typeof tareaSchema>;