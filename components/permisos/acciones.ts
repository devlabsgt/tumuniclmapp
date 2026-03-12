"use server";

import { createClient } from "@/utils/supabase/server";
import { PermisoEmpleado, EstadoPermiso } from "./types";
import { revalidatePath } from "next/cache";

export type OficinaInfo = { id: string; nombre: string };
export type PerfilUsuario = {
  id: string;
  nombre: string;
  rol: string | null;
  esJefe: boolean;
  dependenciaId: string | null;
  oficinasACargo: OficinaInfo[];
};

async function getRolInterno(userId: string, supabase: any) {
  const { data } = await supabase
    .from("usuarios_roles")
    .select(`roles (nombre)`)
    .eq("user_id", userId);
  const rolesUsuario = data?.map((item: any) => item.roles?.nombre) || [];
  const rolesPermitidos = ["RRHH", "SECRETARIO", "SUPER"];
  return (
    rolesUsuario.find((rol: string) => rolesPermitidos.includes(rol)) || null
  );
}

export async function obtenerPerfilUsuario(): Promise<PerfilUsuario | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const rolEncontrado = await getRolInterno(user.id, supabase);
  const { data: infoData } = await supabase
    .from("info_usuario")
    .select("nombre, esjefe, dependencia_id")
    .eq("user_id", user.id)
    .single();
  const { data: dependenciasJefe } = await supabase
    .from("dependencias")
    .select("id, nombre")
    .eq("jefe_id", user.id);
  const oficinasACargo =
    dependenciasJefe?.map((d: any) => ({ id: d.id, nombre: d.nombre })) || [];
  return {
    id: user.id,
    nombre: infoData?.nombre || "Usuario",
    rol: rolEncontrado,
    esJefe: infoData?.esjefe || oficinasACargo.length > 0,
    dependenciaId: infoData?.dependencia_id || null,
    oficinasACargo,
  };
}

export async function obtenerPermisos(mes: number, anio: number) {
  const supabase = await createClient();
  const fechaInicio = new Date(anio, mes - 1, 1).toISOString();
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from("permisos_empleado")
    .select("*")
    .gte("created_at", fechaInicio)
    .lte("created_at", fechaFin)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as unknown as PermisoEmpleado[];
}

export async function gestionarPermiso(
  permisoId: string,
  accion: "aprobar" | "rechazar",
  idEmpleado: string,
) {
  const supabase = await createClient();
  const perfil = await obtenerPerfilUsuario();
  if (!perfil) throw new Error("No autorizado");

  const { data: permisoActual } = await supabase
    .from("permisos_empleado")
    .select("estado")
    .eq("id", permisoId)
    .single();
  if (!permisoActual) throw new Error("Permiso no encontrado");

  let nuevoEstado: EstadoPermiso | null = null;

  if (accion === "rechazar") {
    nuevoEstado =
      permisoActual.estado === "pendiente"
        ? "rechazado_jefe"
        : "rechazado_rrhh";
  } else if (accion === "aprobar") {
    if (permisoActual.estado === "pendiente") {
      nuevoEstado = "aprobado_jefe";
    } else if (permisoActual.estado === "aprobado_jefe") {
      nuevoEstado = "aprobado";
    }
  }

  if (nuevoEstado) {
    const { error } = await supabase
      .from("permisos_empleado")
      .update({ estado: nuevoEstado })
      .eq("id", permisoId);
    if (error) throw new Error(error.message);

    revalidatePath("/protected/permisos");
    return true;
  }

  return false;
}

export async function guardarPermiso(formData: FormData, id?: string) {
  const supabase = await createClient();
  const tipo = formData.get("tipo") as string;
  const inicio = formData.get("inicio") as string;
  const fin = formData.get("fin") as string;
  const descripcion = formData.get("descripcion") as string;
  const userIdSeleccionado = formData.get("user_id") as string;
  const estado = formData.get("estado") as string;
  const remunerado = formData.get("remunerado") === "on";
  const datos: any = {
    tipo,
    inicio,
    fin,
    descripcion,
    user_id: userIdSeleccionado,
    remunerado: remunerado,
  };

  if (estado) {
    datos.estado = estado;
  } else if (!id) {
    datos.estado = "pendiente";
  }

  if (id) {
    const { error } = await supabase
      .from("permisos_empleado")
      .update(datos)
      .eq("id", id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("permisos_empleado").insert(datos);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/protected/permisos");
}

export async function eliminarPermiso(id: string) {
  const supabase = await createClient();
  await supabase.from("permisos_empleado").delete().eq("id", id);
  revalidatePath("/protected/permisos");
}

export async function obtenerPermisosDelUsuario(userId: string): Promise<PermisoEmpleado[]> {
  const supabase = await createClient();
  
  const [{ data, error }, { data: infoUsuario }] = await Promise.all([
    supabase
      .from("permisos_empleado")
      .select("*")
      .eq("user_id", userId)
      .order("inicio", { ascending: false }),
    supabase
      .from("info_usuario")
      .select("nombre, dependencia_id")
      .eq("user_id", userId)
      .single(),
  ]);

  if (error || !data) return [];

  // Si tenemos info del usuario, obtener el nombre de su dependencia (puesto)
  let puestoNombre: string | null = null;
  let oficinaNombre: string | null = null;
  if (infoUsuario?.dependencia_id) {
    const { data: dep } = await supabase
      .from("dependencias")
      .select("nombre, parent_id")
      .eq("id", infoUsuario.dependencia_id)
      .single();
    if (dep) {
      puestoNombre = dep.nombre;
      // Obtener la oficina (parent de la dependencia)
      if (dep.parent_id) {
        const { data: parent } = await supabase
          .from("dependencias")
          .select("nombre")
          .eq("id", dep.parent_id)
          .single();
        oficinaNombre = parent?.nombre || dep.nombre;
      } else {
        oficinaNombre = dep.nombre;
      }
    }
  }

  const usuarioInfo = infoUsuario ? {
    id: userId,
    nombre: infoUsuario.nombre,
    puesto_nombre: puestoNombre,
    oficina_nombre: oficinaNombre,
    dependencia_id: infoUsuario.dependencia_id,
    oficina_path_orden: null,
  } : undefined;

  return data.map(p => ({ ...p, usuario: usuarioInfo })) as unknown as PermisoEmpleado[];
}
