import { z } from "zod";

export const crearInventarioSchema = z.object({
  serie: z.string().min(1, "La serie es obligatoria"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  ctd: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  valor: z.coerce.number().min(0, "El valor no puede ser negativo"),
  estado: z.string().min(1, "El estado es obligatorio").default("Activo"),
  imagen_url: z.string().nullable().optional(),
  id_usuario_asignado: z.string().nullable().optional(),
  id_dependencia_asignada: z.string().nullable().optional(),
});

export type CrearInventarioFormValues = z.infer<typeof crearInventarioSchema>;

export const editarInventarioSchema = z.object({
  serie: z.string().min(1, "La serie es obligatoria"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  ctd: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  valor: z.coerce.number().min(0, "El valor no puede ser negativo"),
  estado: z.string().min(1, "El estado es obligatorio"),
  imagen_url: z.string().nullable().optional(),
});

export type EditarInventarioFormValues = z.infer<typeof editarInventarioSchema>;

export interface DependenciaBasica {
  id: string;
  nombre: string;
}

export interface MovimientoHistorial {
  id: string;
  id_inventario: string;
  id_usuario_origen: string | null;
  id_dependencia_origen: string | null;
  id_usuario_destino: string | null;
  id_dependencia_destino: string | null;
  tipo_movimiento: string;
  cantidad_movida: number;
  imagen_url: string | null;
  observaciones: string | null;
  created_at: string;
  // Extras joined from info_usuario/dependencias
  nombre_usuario_origen?: string | null;
  nombre_dependencia_origen?: string | null;
  nombre_usuario_destino?: string | null;
  nombre_dependencia_destino?: string | null;
}

export interface UsuarioBasico {
  user_id: string;
  nombre: string;
}

export interface ItemInventario {
  id: string;
  serie: string;
  descripcion: string;
  ctd: number;
  valor: number;
  estado: string;
  id_usuario: string | null;
  id_dependencia: string | null;
  imagen_url: string | null;
  created_at: string;
  // Relaciones
  info_usuario?: UsuarioBasico | null;
  dependencias?: DependenciaBasica | null;
  dependencia_real?: DependenciaBasica | null;
}

export interface FilaReporteInventario {
  id: string;
  prefix: string;
  level: number;
  tipo: 'dependencia' | 'empleado' | 'bien';
  nombre: string;
  nombrePuesto?: string;
  cantidad: number;
  valor: number;
  esPuesto: boolean;
  branchPrefix: string;
  rutaDependencia: string;
  parentId?: string | null;
  userId?: string;
  // Solo para items
  serie?: string;
  estado?: string;
  imagen_url?: string | null;
  info_usuario?: UsuarioBasico | null;
  dependencias?: DependenciaBasica | null;
}

export const trasladoSchema = z.object({
  id_usuario_destino: z.string().nullable().optional(),
  id_dependencia_destino: z.string().nullable().optional(),
  imagen_url: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
}).refine(data => data.id_usuario_destino || data.id_dependencia_destino, {
  message: "Debe seleccionar un destino (Empleado o Dependencia)",
  path: ["id_usuario_destino"]
});

export type TrasladoFormValues = z.infer<typeof trasladoSchema>;

export const bajaSchema = z.object({
  imagen_url: z.string().min(1, "La evidencia fotográfica es obligatoria"),
  observaciones: z.string().min(1, "El motivo de la baja es obligatorio"),
});

export type BajaFormValues = z.infer<typeof bajaSchema>;
