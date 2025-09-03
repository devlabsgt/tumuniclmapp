// lib/acciones.ts

import { createClient } from '@/utils/supabase/client';
import Swal from 'sweetalert2';

const supabase = createClient();

// Tipos
interface Registro {
  id?: number;
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
  notas?: string | null;
}
