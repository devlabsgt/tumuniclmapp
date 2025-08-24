import { z } from 'zod';

export const sesionSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  acta: z.string().min(1, 'El número de acta es requerido.'),
  libro: z.string().min(1, 'El número de libro es requerido.'),
  descripcion: z.string().optional(),
  fecha_reunion: z.string().min(1, 'La fecha es requerida.'),
  hora_reunion: z.string().min(1, 'La hora es requerida.'),
});

export type SesionFormData = z.infer<typeof sesionSchema>;