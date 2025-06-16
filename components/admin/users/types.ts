export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: string; // ← reemplaza `roles?: string[]`
  activo: boolean;
}
