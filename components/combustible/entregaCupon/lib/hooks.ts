"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSolicitudesParaEntrega } from "./actions";
import { SolicitudEntrega } from "./schemas";

export const useSolicitudes = (initialData: SolicitudEntrega[] = []) => {
  const queryClient = useQueryClient();
  const queryKey = ["solicitudes-entrega"];

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKey,
    queryFn: getSolicitudesParaEntrega,
    initialData: initialData.length > 0 ? initialData : undefined,
  });

  const updateLocalSolicitud = (id: number, fields: Partial<SolicitudEntrega>) => {
    queryClient.setQueryData<SolicitudEntrega[]>(queryKey, (oldData) => {
      if (!oldData) return [];
      
      return oldData.map((sol) =>
        sol.id === id ? { ...sol, ...fields } : sol
      );
    });
  };

  return {
    solicitudes: data || [],
    loading: isLoading,
    refresh: refetch,
    updateLocalSolicitud,
  };
};