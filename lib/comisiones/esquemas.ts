import { z } from 'zod';

export const comisionSchema = z.object({
  titulo: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  comentarios: z.string().optional(),
  hora: z.string(),
  minuto: z.string(),
  periodo: z.enum(['AM', 'PM']),
  encargadoId: z.string().uuid({ message: 'Debe seleccionar un encargado.' }),
  userIds: z.array(z.string().uuid()).optional(),
});

export type ComisionFormData = z.infer<typeof comisionSchema>;