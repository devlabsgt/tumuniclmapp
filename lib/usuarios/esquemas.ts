export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  rol: string;
  permisos: string[];
  programas_asignados: string[];
}