export type SignupData = {
  nombre: string;
  email: string;
  password: string;
  confirmar: string;
  roles: string[]; // ← corregido aquí
};
