"use server";

import { createClient } from "@/utils/supabase/server";

export interface ReporteNominaFila {
  id: string;
  nombre: string;
  puesto: string;
  dependencia_nombre: string;
  path_orden: string;
  renglon: string;

  // VALORES BASE (Unitarios)
  salario_unitario: number;
  bonificacion_unitaria: number;

  // VALORES PRE-CALCULADOS (Por defecto mensual o lo que venga de DB)
  // Pero estos se sobrescribirán en el cliente si es 031/035
  prima: boolean;
  plan_prestaciones: boolean;
  isr: number;
}

export async function obtenerReporteNomina(): Promise<ReporteNominaFila[]> {
  const supabase = await createClient();

  const { data: usuarios, error } = await supabase
    .from("info_usuario")
    .select(
      `
      user_id,
      nombre,
      dependencia_id,
      dependencias!info_usuario_dependencia_id_fkey (
        id, nombre, parent_id, renglon, salario, bonificacion, 
        prima, plan_prestaciones, isr, no
      )
    `,
    )
    .eq("activo", true)
    .not("dependencia_id", "is", null);

  if (error || !usuarios) {
    return [];
  }

  const { data: todasDependencias } = await supabase
    .from("dependencias")
    .select("id, nombre, parent_id, no");

  const depMap = new Map(todasDependencias?.map((d) => [d.id, d]));

  const procesarJerarquia = (depId: string) => {
    const numeros: string[] = [];
    const nombres: string[] = [];
    let currentId: string | null = depId;
    let safety = 0;
    while (currentId && safety < 15) {
      const dep = depMap.get(currentId);
      if (dep) {
        numeros.unshift(dep.no.toString());
        nombres.unshift(dep.nombre);
        currentId = dep.parent_id;
      } else {
        break;
      }
      safety++;
    }
    const pathOrden = numeros.join(".");
    let nombreAgrupador = "";
    if (nombres.length > 1) {
      nombreAgrupador = nombres.slice(0, -1).join(" > ");
    } else {
      nombreAgrupador = nombres[0] || "SIN UBICACIÓN";
    }
    return { path_orden: pathOrden, dependencia_nombre: nombreAgrupador };
  };

  const reporte: ReporteNominaFila[] = usuarios
    .map((u: any) => {
      const dep = u.dependencias;
      const d = Array.isArray(dep) ? dep[0] : dep;

      if (!d) return null;

      const jerarquia = procesarJerarquia(d.id);

      return {
        id: u.user_id,
        nombre: u.nombre,
        puesto: d.nombre,
        dependencia_nombre: jerarquia.dependencia_nombre,
        path_orden: jerarquia.path_orden,
        renglon: d.renglon || "---",

        // Enviamos el valor crudo de la DB
        salario_unitario: d.salario || 0,
        bonificacion_unitaria: d.bonificacion || 0,

        prima: d.prima || false,
        plan_prestaciones: d.plan_prestaciones || false,
        isr: d.isr || 0,
      };
    })
    .filter((item): item is ReporteNominaFila => item !== null);

  return reporte.sort((a, b) =>
    a.path_orden.localeCompare(b.path_orden, undefined, { numeric: true }),
  );
}

export async function obtenerFirmasAutoridades() {
  const supabase = await createClient();
  const { data: empleados } = await supabase
    .from("info_usuario")
    .select(`nombre, dependencias!info_usuario_dependencia_id_fkey (nombre)`)
    .eq("activo", true);

  if (!empleados) return { rrhh: "", dafim: "" };

  let nombreRRHH = "";
  let nombreDAFIM = "";

  for (const emp of empleados) {
    const dep = Array.isArray(emp.dependencias)
      ? emp.dependencias[0]
      : emp.dependencias;
    if (!dep || !dep.nombre) continue;
    const puesto = dep.nombre.toUpperCase();
    if (
      puesto.includes("RECURSOS HUMANOS") &&
      (puesto.includes("COORDINADOR") ||
        puesto.includes("DIRECTOR") ||
        puesto.includes("ENCARGADO"))
    ) {
      nombreRRHH = emp.nombre || "";
    }
    if (
      (puesto.includes("DAFIM") || puesto.includes("FINANCIERA")) &&
      (puesto.includes("DIRECTOR") || puesto.includes("COORDINADOR"))
    ) {
      nombreDAFIM = emp.nombre || "";
    }
  }
  return { rrhh: nombreRRHH, dafim: nombreDAFIM };
}
