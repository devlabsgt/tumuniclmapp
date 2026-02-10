import { z } from 'zod';

const detalleSchema = z.object({
  lugar_visitar: z.string(),
  kilometros_recorrer: z.number(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
});

export const solicitudEntregaSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  placa: z.string(),
  municipio_destino: z.string(),
  kilometraje_inicial: z.number(), 
  justificacion: z.string().nullable(),
  estado: z.enum(['pendiente', 'aprobado', 'rechazado']),
  correlativo: z.number().nullable().optional(),
  
  solvente: z.boolean().optional().nullable(), 

  usuario: z.object({
    nombre: z.string(),
  }).nullable(),
  
  vehiculo: z.object({
    modelo: z.string(),
    tipo_combustible: z.string(),
    tipo_vehiculo: z.string(), 
  }).nullable(),

  detalles: z.array(detalleSchema).optional(),
});

export type SolicitudEntrega = z.infer<typeof solicitudEntregaSchema>;

export interface InventarioCupon {
  id: string; 
  producto: string; 
  denominacion: number; 
  cantidad_actual: number; 
}

export const itemEntregaSchema = z.object({
  detalle_contrato_id: z.string().min(1, "Seleccione una denominación"),
  cantidad_asignada: z.number().min(1, "La cantidad debe ser mayor a 0"),
  correlativo_inicio: z.number().min(1, "Ingrese correlativo inicial"),
  correlativo_fin: z.number().min(1, "Ingrese correlativo final"),
  total_valor: z.number(), 
  denominacion_valor: z.number(), 
});

export const entregaCuponSchema = z.object({
  solicitud_id: z.number(),
  tipo_combustible: z.enum(['Gasolina', 'Diesel']),
  items: z.array(itemEntregaSchema).min(1, "Debe agregar al menos un bloque de cupones"),
});

export type EntregaCuponFormValues = z.infer<typeof entregaCuponSchema>;
export type ItemEntrega = z.infer<typeof itemEntregaSchema>;