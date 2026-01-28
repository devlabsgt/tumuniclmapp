'use server';

import { createClient } from "@/utils/supabase/server";
import { InfoUsuario, InfoUsuarioData } from "./useInfoUsuario";

// Acción para la lista simple (Árbol)
export async function getListaUsuariosAction(): Promise<InfoUsuario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('info_usuario')
    .select('user_id, dependencia_id');

  if (error) return [];
  return data as InfoUsuario[] || [];
}

// Acción para el detalle (Tarjeta) - ESTRATEGIA: "DIVIDE Y VENCERÁS"
export async function getDetalleUsuarioAction(userId: string): Promise<InfoUsuarioData | null> {
  const supabase = await createClient();

  // PASO 1: Obtener datos personales básicos del usuario
  // No hacemos joins complejos aquí para evitar errores.
  const { data: user, error: userError } = await supabase
    .from('info_usuario')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (userError || !user) {
    console.error("Error buscando usuario:", userError);
    return null;
  }

  // Variables para rellenar
  let dependenciaData: any = null;
  let horarioData: any = null;
  let contratoData: any = null;
  
  let puestoPathJerarquico = null;
  let puestoPathOrdenado = null;

  // PASO 2: Si tiene dependencia, buscamos sus datos financieros y jerarquía
  if (user.dependencia_id) {
    const { data: dep } = await supabase
      .from('dependencias')
      .select('*') // Trae todo: salario, renglon, isr, plan_prestaciones, etc.
      .eq('id', user.dependencia_id)
      .single();

    if (dep) {
      dependenciaData = dep;

      // Construir el Path Jerárquico (Bucle simple hacia arriba)
      const nombres: string[] = [dep.nombre];
      const numeros: string[] = [dep.no];
      let currentParent = dep.parent_id;
      let depth = 0;

      while (currentParent && depth < 10) {
        const { data: parent } = await supabase
          .from('dependencias')
          .select('id, nombre, no, parent_id')
          .eq('id', currentParent)
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
      puestoPathJerarquico = nombres.join(' > ');
      puestoPathOrdenado = numeros.join('.');
    }
  }

  // PASO 3: Si tiene horario, lo buscamos
  if (user.horario_id) {
    const { data: horario } = await supabase
      .from('horarios')
      .select('*')
      .eq('id', user.horario_id)
      .single();
    horarioData = horario;
  }

  // PASO 4: Buscar Contrato (Opcional)
  const { data: contratos } = await supabase
    .from('info_contrato')
    .select('*')
    .eq('user_id', userId)
    .eq('activo', true)
    .limit(1);
    
  if (contratos && contratos.length > 0) {
    contratoData = contratos[0];
  }

  // PASO 5: Buscar Rol (Opcional, solo el nombre)
  const { data: userRol } = await supabase
    .from('usuarios_roles')
    .select('roles(nombre)')
    .eq('user_id', userId)
    .maybeSingle();

  // @ts-ignore
  const rolNombre = userRol?.roles?.nombre || null;

  // CONSTRUCCIÓN DEL OBJETO FINAL
  // Combinamos todo lo que encontramos manualmente.
  return {
    id: user.user_id,
    email: user.email,
    nombre: user.nombre,
    activo: user.activo,
    rol: rolNombre,
    
    // Dejamos estos vacíos porque la TarjetaEmpleado NO los usa visualmente
    permisos: [], 
    modulos: [],
    programas: [],
    
    direccion: user.direccion,
    telefono: user.telefono,
    dpi: user.dpi,
    nit: user.nit,
    igss: user.igss,
    cuenta_no: user.cuenta_no,

    // Datos Financieros (Vienen de la consulta de Dependencia)
    puesto_nombre: dependenciaData?.nombre || null,
    renglon: dependenciaData?.renglon || null,
    salario: dependenciaData?.salario || 0,
    bonificacion: dependenciaData?.bonificacion || 0,
    prima: dependenciaData?.prima || false,
    
    // CAMPOS NUEVOS
    plan_prestaciones: dependenciaData?.plan_prestaciones || false,
    isr: dependenciaData?.isr || 0,

    // Jerarquía
    puesto_path_jerarquico: puestoPathJerarquico,
    puesto_path_ordenado: puestoPathOrdenado,

    // Contrato
    contrato_no: contratoData?.contrato_no || null,
    fecha_ini: contratoData?.fecha_ini || null,
    fecha_fin: contratoData?.fecha_fin || null,

    // Horario
    horario_nombre: horarioData?.nombre || null,
    horario_dias: horarioData?.dias || [],
    horario_entrada: horarioData?.entrada || null,
    horario_salida: horarioData?.salida || null,
  };
}