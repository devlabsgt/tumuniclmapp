// components/admin/users/types.ts
export type Usuario = {
  id: string;
  email: string;
  nombre: string | null;
  rol: 'admin' | 'usuario';
};