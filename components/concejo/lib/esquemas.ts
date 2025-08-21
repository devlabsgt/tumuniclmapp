// lib/esquemas.ts
import { z } from 'zod';

// Esquema para la creación de una Agenda del Consejo
export const agendaSchema = z.object({
  titulo: z.string().min(3, { message: 'El título es obligatorio y debe tener al menos 3 caracteres.' }),
  descripcion: z.string().min(10, { message: 'La descripción es obligatoria y debe tener al menos 10 caracteres.' }),
  fecha_reunion: z.string()
    .min(1, { message: 'La fecha de la reunión es obligatoria.' }),
  hora_reunion: z.string()
    .min(1, { message: 'La hora de la reunión es obligatoria.' }),
});

// Tipos exportados para usar en la aplicación
export type AgendaFormData = z.infer<typeof agendaSchema>;