import { Usuario } from '@/lib/usuarios/esquemas';

export type UsuarioConJerarquia = Usuario & {
  puesto_nombre: string | null;
  oficina_nombre: string | null;
  oficina_path_orden: string | null;
  dependencia_id: string | null;
};

export type EstadoPermiso = 'pendiente' | 'aprobado_jefe' | 'aprobado' | 'rechazado' | 'rechazado_jefe' | 'rechazado_rrhh';

export type PermisoEmpleado = {
  id: string
  user_id: string
  tipo: string
  inicio: string
  fin: string
  estado: EstadoPermiso
  created_at: string
  remunerado: boolean 
  usuario?: UsuarioConJerarquia
}

export type PermisosPorOficina = {
  oficina_nombre: string
  path_orden: string
  permisos: PermisoEmpleado[]
}