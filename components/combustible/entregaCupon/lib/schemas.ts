// components/combustible/entregaCupon/lib/schemas.ts
import { z } from 'zod';

// Esquema para los detalles del recorrido
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
  kilometraje_inicial: z.number(), // Nuevo
  justificacion: z.string().nullable(),
  estado: z.enum(['pendiente', 'aprobado', 'rechazado']),
  
  usuario: z.object({
    nombre: z.string(),
  }).nullable(),
  
  vehiculo: z.object({
    modelo: z.string(),
    tipo_combustible: z.string(),
    tipo_vehiculo: z.string(), // Nuevo
  }).nullable(),

  // Array de itinerario
  detalles: z.array(detalleSchema).optional(),
});

export type SolicitudEntrega = z.infer<typeof solicitudEntregaSchema>;

// 1. Tipo para el Inventario (lo que traemos de la BD para llenar el Select)
export interface InventarioCupon {
  id: string; // UUID de DetalleContrato
  producto: string; // 'Gasolina Regular', 'Diesel', etc.
  denominacion: number; // 50, 100, etc.
  cantidad_actual: number; // Stock disponible
}

// 2. Schema para CADA FILA del formulario (Item de entrega)
export const itemEntregaSchema = z.object({
  detalle_contrato_id: z.string().min(1, "Seleccione una denominación"),
  cantidad_asignada: z.number().min(1, "La cantidad debe ser mayor a 0"),
  correlativo_inicio: z.number().min(1, "Ingrese correlativo inicial"),
  correlativo_fin: z.number().min(1, "Ingrese correlativo final"),
  total_valor: z.number(), // Calculado: cantidad * denominacion
  denominacion_valor: z.number(), // Para referencia visual
});

// 3. Schema del FORMULARIO COMPLETO
export const entregaCuponSchema = z.object({
  solicitud_id: z.number(),
  tipo_combustible: z.enum(['Gasolina', 'Diesel']),
  items: z.array(itemEntregaSchema).min(1, "Debe agregar al menos un bloque de cupones"),
});

export type EntregaCuponFormValues = z.infer<typeof entregaCuponSchema>;
export type ItemEntrega = z.infer<typeof itemEntregaSchema>;