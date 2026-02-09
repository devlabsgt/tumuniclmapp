// features/solicitudes/types.ts

export interface Dependencia {
  id: string;
  nombre: string;
  // El padre puede venir como objeto o como null desde la BD
  padre?: {
    id: string;
    nombre: string;
  } | null; 
}

export interface UsuarioInfo {
  user_id: string;
  nombre: string;
  dependencia?: Dependencia | null;
}


export interface Vehiculo {
  placa: string;
  tipo_vehiculo: string;
  modelo: string;
  tipo_combustible: string;
}

export interface DetalleComision {
  fecha_inicio: string; // ISO Date
  fecha_fin: string;    // ISO Date
  lugar_visitar: string;
  kilometros_recorrer: number;
}

export interface SolicitudCombustible {
  id: number;
  created_at: string;
  placa: string;
  municipio_destino: string;
  departamento_destino: string;
  kilometraje_inicial: number;
  justificacion: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  correlativo?: number | null;
  detalles: DetalleComision[];
  vehiculo?: Vehiculo; // Join
  usuario?: UsuarioInfo; // Join
  solvente?: boolean | null;
}