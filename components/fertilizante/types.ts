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

export interface ResumenBeneficiarios {
  total: number;
  hombres: number;
  mujeres: number;
}

export interface TablaBeneficiariosProps {
  data: Beneficiario[];
  resumen: ResumenBeneficiarios;
  isLoading: boolean;
  permisos: string[]; // ✅ NUEVA PROP
}

export type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';

export type OrdenFiltro =
  | 'nombre_completo_asc'
  | 'nombre_completo_desc'
  | 'fecha_asc'
  | 'fecha_desc'
  | 'codigo_asc'
  | 'codigo_desc'
  | 'cantidad_desc'
  | 'solo_anulados'
  | 'solo_extraviados'
  | 'genero_hombres_primero'
  | 'genero_mujeres_primero';


  export interface MTopLugaresProps {
  conteoPorLugar: Record<string, number>; // ahora espera sumas, no conteos
  onClose: () => void;
}