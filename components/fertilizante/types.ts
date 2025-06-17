export interface Beneficiario {
  id: string;
  nombre_completo: string | null;
  dpi: string | null;
  lugar: string | null;
  fecha: string;
  fecha_nacimiento?: string | null;
  codigo: string;
  telefono?: string | null;
  sexo?: string | null;
  cantidad?: number | null;
  estado?: string | null;
}
