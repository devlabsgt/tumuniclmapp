import { z } from 'zod';

// --- Esquema para Programas y Niveles ---
export const programaSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre es obligatorio.' }),
  descripcion: z.string().min(1, { message: 'La descripción es obligatoria.' }),
  anio: z.number({ message: 'El año es obligatorio.' }).int(),
  parent_id: z.number().int().nullable().optional(),
  lugar: z.string().optional(),
  encargado: z.string().optional(), // Se añade 'encargado' como opcional inicialmente
}).superRefine((data, ctx) => {
  // Si es un Nivel (tiene un parent_id), entonces 'lugar' y 'encargado' son obligatorios.
  if (data.parent_id) {
    if (!data.lugar || data.lugar.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lugar'],
        message: 'El lugar es obligatorio para un nivel.',
      });
    }
    if (!data.encargado || data.encargado.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['encargado'],
        message: 'El encargado es obligatorio para un nivel.',
      });
    }
  }
});

// --- Esquema para Alumnos ---
export const alumnoSchema = z.object({
  nombre_completo: z.string().min(3, { message: 'El nombre es obligatorio.' }),
  cui_alumno: z.string()
    .refine(val => /^\d{13}$/.test(val), {
      message: 'El CUI del alumno debe tener 13 dígitos y contener solo números.',
    }),
  fecha_nacimiento: z.string().min(1, { message: 'La fecha es obligatoria.' })
    .refine((date) => new Date(date) <= new Date(), { message: "La fecha no puede ser en el futuro." })
    .refine((date) => new Date(date) >= new Date('1900-01-01'), { message: "El año no puede ser anterior a 1900." }),
  sexo: z.enum(['F', 'M']),
  nombre_encargado: z.string().min(3, { message: 'El nombre del encargado es obligatorio.' }),
  cui_encargado: z.string()
    .refine(val => /^\d{13}$/.test(val), {
      message: 'El CUI del encargado debe tener 13 dígitos y contener solo números.',
    }),
  telefono_encargado: z.string().length(8, { message: 'El teléfono del encargado debe tener 8 dígitos.' }),
  telefono_alumno: z.string().length(8, { message: 'El teléfono del alumno debe tener 8 dígitos.' }).optional().or(z.literal('')),
});


// --- Tipos exportados para usar en toda la aplicación ---
export type Programa = z.infer<typeof programaSchema> & {
  id: number;
  lugar?: string | null;
  encargado?: string | null; // Se añade el tipo para 'encargado'
};

export type Alumno = z.infer<typeof alumnoSchema> & {
  id: string;
  created_at: string;
  programa_id?: number;
};
