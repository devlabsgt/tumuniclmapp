export interface ContratoCombustible {
  id: string
  created_at: string
  anio: number
  estacion: string
  numero_contrato: string
}

export interface DetalleContrato {
  id: string
  contrato_id: string
  producto: string
  denominacion: number
  cantidad_inicial: number
  cantidad_actual: number
}

export interface ContratoExtendido extends ContratoCombustible {
  detalles: DetalleContrato[] 
}