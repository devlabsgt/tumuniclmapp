"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getSolicitudesParaEntrega, 
  getInventarioPorTipo, 
  getLiquidacionAdmin, 
  getEntregasRealizadas,
  entregarCupones,
  rechazarSolicitud,
  aprobarLiquidacionFinal,
  getDatosReporteMensual
} from "./actions";
import { SolicitudEntrega, EntregaCuponFormValues } from "./schemas";

const KEYS = {
  solicitudes: ["solicitudes-entrega"],
  inventario: (tipo: string) => ["inventario", tipo],
  liquidacion: (id: number) => ["liquidacion-admin", id],
  historialEntregas: (id: number) => ["entregas-realizadas", id],
};

const FIVE_MINUTES = 1000 * 60 * 5;

export const useSolicitudes = (initialData: SolicitudEntrega[] = []) => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: KEYS.solicitudes,
    queryFn: getSolicitudesParaEntrega,
    initialData: initialData.length > 0 ? initialData : undefined,
    staleTime: FIVE_MINUTES, 
  });

  const updateLocalSolicitud = (id: number, fields: Partial<SolicitudEntrega>) => {
    queryClient.setQueryData<SolicitudEntrega[]>(KEYS.solicitudes, (oldData) => {
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
    updateLocalSolicitud 
  };
};

export const useInventario = (tipo: 'Gasolina' | 'Diesel') => {
  return useQuery({
    queryKey: KEYS.inventario(tipo),
    queryFn: () => getInventarioPorTipo(tipo),
    staleTime: FIVE_MINUTES, 
  });
};

export const useLiquidacionAdminData = (solicitudId: number) => {
  return useQuery({
    queryKey: KEYS.liquidacion(solicitudId),
    queryFn: () => getLiquidacionAdmin(solicitudId),
    enabled: !!solicitudId, 
    staleTime: FIVE_MINUTES, 
  });
};

export const useHistorialEntregas = (solicitudId: number) => {
  return useQuery({
    queryKey: KEYS.historialEntregas(solicitudId),
    queryFn: () => getEntregasRealizadas(solicitudId),
    enabled: !!solicitudId,
    staleTime: FIVE_MINUTES, 
  });
};

export const useEntregaMutations = () => {
  const queryClient = useQueryClient();

  const invalidarLista = () => queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });

  const entregar = useMutation({
    mutationFn: (payload: EntregaCuponFormValues) => entregarCupones(payload),
    onSuccess: () => {
      invalidarLista(); 
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
    },
  });

  const rechazar = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => rechazarSolicitud(id, motivo),
    onSuccess: invalidarLista,
  });

  const aprobarFinal = useMutation({
    mutationFn: ({ id, devolucion }: { id: number; devolucion: any[] }) => aprobarLiquidacionFinal(id, devolucion),
    onSuccess: invalidarLista,
  });

  return { entregar, rechazar, aprobarFinal };
};

export const useReporteMutations = () => {
  const queryClient = useQueryClient();

  const obtenerReporte = async (mes: number, anio: number) => {
    return queryClient.fetchQuery({
      queryKey: ["reporte-mensual", mes, anio],
      queryFn: () => getDatosReporteMensual(mes, anio),
      staleTime: FIVE_MINUTES, 
    });
  };

  return { obtenerReporte };
};