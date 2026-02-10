"use server";

import { createClient } from "@/utils/supabase/server";

// Interfaces (Puedes moverlas a un archivo types.ts si prefieres, pero aquí funcionan)
export interface InfoUsuarioData {
  id: string | null;
  email: string | null;
  nombre: string | null;
  activo: boolean | null;
  rol: string | null;
  permisos: string[];
  modulos: string[];
  programas: string[];
  direccion: string | null;
  telefono: string | null;
  dpi: string | null;
  nit: string | null;
  igss: string | null;
  cuenta_no: string | null;
  puesto_nombre: string | null;
  puesto_path_jerarquico: string | null;
  puesto_path_ordenado: string | null;
  salario: number | null;
  bonificacion: number | null;
  renglon: string | null;
  prima: boolean | null;
  plan_prestaciones?: boolean | null;
  isr?: number | null;
  contrato_no: string | null;
  fecha_ini: string | null;
  fecha_fin: string | null;
  horario_nombre: string | null;
  horario_dias: number[] | null;
  horario_entrada: string | null;
  horario_salida: string | null;
}

export interface InfoUsuario {
  user_id: string;
  dependencia_id: string | null;
}

export async function getListaUsuariosAction(): Promise<InfoUsuario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("info_usuario")
    .select("user_id, dependencia_id");

  if (error) return [];
  return (data as InfoUsuario[]) || [];
}

export async function getDetalleUsuarioAction(
  userId: string,
): Promise<InfoUsuarioData | null> {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from("info_usuario")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (userError || !user) {
    return null;
  }

  let dependenciaData: any = null;
  let horarioData: any = null;
  let contratoData: any = null;
  let puestoPathJerarquico = null;
  let puestoPathOrdenado = null;

  if (user.dependencia_id) {
    const { data: dep } = await supabase
      .from("dependencias")
      .select("*")
      .eq("id", user.dependencia_id)
      .single();

    if (dep) {
      dependenciaData = dep;
      const nombres: string[] = [dep.nombre];
      const numeros: string[] = [dep.no];
      let currentParent = dep.parent_id;
      let depth = 0;

      while (currentParent && depth < 10) {
        const { data: parent } = await supabase
          .from("dependencias")
          .select("id, nombre, no, parent_id")
          .eq("id", currentParent)
          .single();

        if (parent) {
          nombres.unshift(parent.nombre);
          numeros.unshift(parent.no);
          currentParent = parent.parent_id;
        } else {
          break;
        }
        depth++;
      }
      puestoPathJerarquico = nombres.join(" > ");
      puestoPathOrdenado = numeros.join(".");
    }
  }

  if (user.horario_id) {
    const { data: horario } = await supabase
      .from("horarios")
      .select("*")
      .eq("id", user.horario_id)
      .single();
    horarioData = horario;
  }

  const { data: contratos } = await supabase
    .from("info_contrato")
    .select("*")
    .eq("user_id", userId)
    .eq("activo", true)
    .limit(1);

  if (contratos && contratos.length > 0) {
    contratoData = contratos[0];
  }

  const { data: userRol } = await supabase
    .from("usuarios_roles")
    .select("roles(nombre)")
    .eq("user_id", userId)
    .maybeSingle();

  // @ts-ignore
  const rolNombre = userRol?.roles?.nombre || null;

  return {
    id: user.user_id,
    email: user.email,
    nombre: user.nombre,
    activo: user.activo,
    rol: rolNombre,
    permisos: [],
    modulos: [],
    programas: [],
    direccion: user.direccion,
    telefono: user.telefono,
    dpi: user.dpi,
    nit: user.nit,
    igss: user.igss,
    cuenta_no: user.cuenta_no,
    puesto_nombre: dependenciaData?.nombre || null,
    renglon: dependenciaData?.renglon || null,
    salario: dependenciaData?.salario || 0,
    bonificacion: dependenciaData?.bonificacion || 0,
    prima: dependenciaData?.prima || false,
    plan_prestaciones: dependenciaData?.plan_prestaciones || false,
    isr: dependenciaData?.isr || 0,
    puesto_path_jerarquico: puestoPathJerarquico,
    puesto_path_ordenado: puestoPathOrdenado,
    contrato_no: contratoData?.contrato_no || null,
    fecha_ini: contratoData?.fecha_ini || null,
    fecha_fin: contratoData?.fecha_fin || null,
    horario_nombre: horarioData?.nombre || null,
    horario_dias: horarioData?.dias || [],
    horario_entrada: horarioData?.entrada || null,
    horario_salida: horarioData?.salida || null,
  };
}
