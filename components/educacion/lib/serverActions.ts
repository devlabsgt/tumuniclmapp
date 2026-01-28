"use server";

import supabaseAdmin from "@/utils/supabase/admin";

export async function obtenerUsuariosPorModulo(modulo: string) {
  try {
    const { data: modulosData, error: modulosError } = await supabaseAdmin
      .from("modulos")
      .select("id")
      .ilike("nombre", modulo);

    if (modulosError || !modulosData || modulosData.length === 0) return [];

    const moduloId = modulosData[0].id;

    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from("modulos_roles")
      .select("rol_id")
      .eq("modulo_id", moduloId);

    if (rolesError || !rolesData || rolesData.length === 0) return [];

    const roleIds = rolesData.map((r) => r.rol_id);

    const { data: userRolesData, error: userRolesError } = await supabaseAdmin
      .from("usuarios_roles")
      .select("user_id")
      .in("rol_id", roleIds);

    if (userRolesError || !userRolesData || userRolesData.length === 0)
      return [];

    const userIds = [...new Set(userRolesData.map((ur) => ur.user_id))];

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("info_usuario")
      .select("user_id, nombre")
      .in("user_id", userIds);

    if (profilesError) return [];

    const { data: accesos, error: accesosError } = await supabaseAdmin
      .from("accesos_programas")
      .select("user_id, programa")
      .in("user_id", userIds);

    const accesosMap = new Map<string, string[]>();
    if (!accesosError && accesos) {
      accesos.forEach((a) => {
        const current = accesosMap.get(a.user_id) || [];
        current.push(a.programa);
        accesosMap.set(a.user_id, current);
      });
    }

    const {
      data: { users: authUsers },
      error: authError,
    } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) return [];

    const combinedData = userIds
      .map((id) => {
        const profile = profiles?.find((p) => p.user_id === id);
        const authUser = authUsers.find((u) => u.id === id);
        const programas = accesosMap.get(id) || [];

        if (!authUser) return null;

        return {
          user_id: id,
          nombre: profile?.nombre || "Sin Nombre",
          email: authUser.email || "Sin Email",
          programas_asignados: programas,
        };
      })
      .filter(Boolean);

    return combinedData;
  } catch (err) {
    return [];
  }
}

export async function eliminarPrograma(id: number) {
  try {
    const { error } = await supabaseAdmin
      .from("programas_educativos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return { success: true, message: "Programa eliminado correctamente" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function editarMaestro(maestro: {
  id: number;
  nombre: string;
  ctd_alumnos: number;
  telefono: string;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("maestros_municipales")
      .update({
        nombre: maestro.nombre,
        ctd_alumnos: maestro.ctd_alumnos,
        telefono: maestro.telefono,
      })
      .eq("id", maestro.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function obtenerProgramasEducativos() {
  try {
    const { data, error } = await supabaseAdmin
      .from("programas_educativos")
      .select("id, nombre, anio")
      .is("parent_id", null);

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function actualizarAsignaciones(
  programa: string,
  toAssign: string[],
  toUnassign: string[],
) {
  try {
    if (toAssign.length > 0) {
      const inserts = toAssign.map((userId) => ({
        user_id: userId,
        programa: programa,
      }));
      const { error: insertError } = await supabaseAdmin
        .from("accesos_programas")
        .insert(inserts);

      if (insertError) throw insertError;
    }

    if (toUnassign.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("accesos_programas")
        .delete()
        .in("user_id", toUnassign)
        .eq("programa", programa);

      if (deleteError) throw deleteError;
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
