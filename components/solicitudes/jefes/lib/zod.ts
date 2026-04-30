import { z } from 'zod';

export const solicitudJefeSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  tipo_solicitud: z.literal('oficinas'),
  estado: z.enum(['pendiente', 'completado', 'rechazado']),
  fecha_solicitud: z.string().nullable(),
  fecha_terminado: z.string().nullable(),

  solicitante_uid: z.string().uuid().nullable(),
  solicitante: z.object({ nombre: z.string() }).nullable().optional(),

  asignado_a_uid: z.string().uuid().nullable(),
  asignado: z.object({ nombre: z.string() }).nullable().optional(),

  nombre_responsable: z.string().nullable(),
  telefono_contacto: z.string().nullable(),
  ubicacion: z.string().nullable(),
  comentarios: z.string().nullable(),
  checklists: z.any().optional(),
});

export type SolicitudJefe = z.infer<typeof solicitudJefeSchema>;

export const crearSolicitudJefeSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().optional(),
  asignado_a_uid: z.string().uuid().nullable().optional(),
  fecha_actividad: z.string().min(1, "La fecha es requerida"),
  subtareas: z.array(z.object({
    descripcion: z.string().min(1, "Descripción de la tarea requerida"),
    completado: z.boolean().default(false)
  })).default([]),
});

export type CrearSolicitudJefeValues = z.infer<typeof crearSolicitudJefeSchema>;
