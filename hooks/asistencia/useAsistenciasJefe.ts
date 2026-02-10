import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export interface AsistenciaTableData {
  id: number;
  created_at: string;
  tipo_registro: "Entrada" | "Salida" | null;
  ubicacion: any;
  notas: string | null;
  user_id: string;
  nombre: string;
  puesto_nombre: string | null;
  oficina_nombre: string;
  oficina_path_orden: string;
  email: string;
  rol: string;
  programas: string[];
}

export default function useAsistenciasJefe(
  jefeId: string | null,
  fechaInicio: string | null,
  fechaFinal: string | null,
  filtroOficinaId: string | null = null,
) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "asistencias_jefe_global",
      jefeId,
      filtroOficinaId,
      fechaInicio,
      fechaFinal,
    ],

    queryFn: async () => {
      if (!jefeId) return [];
      const supabase = createClient();
      let idsOficinas: string[] = [];

      if (filtroOficinaId) {
        idsOficinas = [filtroOficinaId];
      } else {
        const { data: oficinas, error: errOficinas } = await supabase
          .from("dependencias")
          .select("id")
          .eq("jefe_id", jefeId);

        if (errOficinas) throw new Error(errOficinas.message);
        idsOficinas = oficinas?.map((o) => o.id) || [];
      }

      if (idsOficinas.length === 0) return [];

      const { data: puestos, error: errPuestos } = await supabase
        .from("dependencias")
        .select("id, nombre, parent_id")
        .in("parent_id", idsOficinas)
        .eq("es_puesto", true);

      if (errPuestos) throw new Error(errPuestos.message);

      const idsPuestos = puestos?.map((p) => p.id) || [];
      const todosIds = [...idsOficinas, ...idsPuestos];

      if (todosIds.length === 0) return [];

      const { data: usuarios, error: errUsuarios } = await supabase
        .from("info_usuario")
        .select("user_id, nombre, dependencia_id")
        .in("dependencia_id", todosIds);

      if (errUsuarios) throw new Error(errUsuarios.message);

      const userIds = usuarios?.map((u) => u.user_id) || [];

      if (userIds.length === 0) return [];

      const mapaUsuarios = new Map(usuarios?.map((u) => [u.user_id, u]));

      let query = supabase
        .from("registros_asistencia")
        .select("id, created_at, tipo_registro, ubicacion, notas, user_id")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      if (fechaInicio) query = query.gte("created_at", fechaInicio);
      if (fechaFinal) query = query.lte("created_at", fechaFinal);

      const { data: registros, error: errReg } = await query;
      if (errReg) throw new Error(errReg.message);

      const { data: infoOficinas } = await supabase
        .from("dependencias")
        .select("id, nombre")
        .in("id", idsOficinas);

      const mapaOficinas = new Map(infoOficinas?.map((o) => [o.id, o.nombre]));
      const mapaPuestos = new Map(
        puestos?.map((p) => [
          p.id,
          { nombre: p.nombre, parentId: p.parent_id },
        ]),
      );

      return registros.map((reg: any) => {
        const userInfo = mapaUsuarios.get(reg.user_id);
        const depId = userInfo?.dependencia_id;

        let nombreOficina = "Desconocida";
        let nombrePuesto = null;
        let idOrden = depId;

        if (mapaOficinas.has(depId)) {
          nombreOficina = mapaOficinas.get(depId) || "";
          idOrden = depId;
        } else if (mapaPuestos.has(depId)) {
          const puestoData = mapaPuestos.get(depId);
          nombrePuesto = puestoData?.nombre || null;
          const parentId = puestoData?.parentId;
          nombreOficina = mapaOficinas.get(parentId) || "Oficina Superior";
          idOrden = parentId;
        }

        return {
          id: reg.id as unknown as number,
          created_at: reg.created_at,
          tipo_registro: reg.tipo_registro as "Entrada" | "Salida" | null,
          ubicacion: reg.ubicacion,
          notas: reg.notas,
          user_id: reg.user_id,
          nombre: userInfo?.nombre || "Sin Nombre",
          email: "",
          rol: "Usuario",
          programas: [],
          puesto_nombre: nombrePuesto,
          oficina_nombre: nombreOficina,
          oficina_path_orden: idOrden,
        } as AsistenciaTableData;
      });
    },
    enabled: !!jefeId,
    staleTime: 1000 * 60 * 5,
  });

  return { registros: data || [], loading: isLoading, error };
}
