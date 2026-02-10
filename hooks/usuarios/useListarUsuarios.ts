"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-toastify";
import { Usuario } from "@/lib/usuarios/esquemas";

export type UsuarioConJerarquia = Usuario & {
  puesto_nombre: string | null;
  oficina_nombre: string | null;
  oficina_path_orden: string | null;
};

const getUsuarios = async (): Promise<UsuarioConJerarquia[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("obtener_usuarios");

  if (error) {
    toast.error("Error al cargar la lista de usuarios.");
    throw new Error(error.message);
  }

  return data as UsuarioConJerarquia[];
};

export function useListaUsuarios() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["usuarios"],
    queryFn: getUsuarios,
    staleTime: 1000 * 60 * 5,
  });

  return {
    usuarios: data ?? [],
    loading: isLoading,
    error: error ? error.message : null,
    fetchUsuarios: refetch,
  };
}
