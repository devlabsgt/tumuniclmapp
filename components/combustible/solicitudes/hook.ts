'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// CORRECCIÓN 1: Ruta correcta (mismo directorio)
import { 
  getMySolicitudes, 
  saveSolicitud, 
  updateSolicitud, 
  deleteSolicitud, 
  searchVehiculos,
  getSolicitudParaLiquidacion,
  saveLiquidacion,
  getLiquidacionBySolicitudId,
  updateLiquidacion
} from './actions'; 

// CORRECCIÓN 2: Ruta correcta (mismo directorio)
import { CreateSolicitudPayload, SolicitudCombustible, Vehiculo } from './types';

// --- CLAVES PARA LA CACHÉ (QUERY KEYS) ---
export const KEYS = {
  solicitudes: ['solicitudes'],
  vehiculos: (q: string) => ['vehiculos', q],
  liquidacion: (id: number) => ['liquidacion', id],
};

// ==========================================
// 1. HOOKS DE LECTURA (GET)
// ==========================================

export const useSolicitudes = () => {
  return useQuery({
    queryKey: KEYS.solicitudes,
    queryFn: () => getMySolicitudes(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

export const useSearchVehiculos = (query: string) => {
  return useQuery({
    queryKey: KEYS.vehiculos(query),
    queryFn: () => searchVehiculos(query),
    enabled: query.length > 2, 
    staleTime: 1000 * 60, 
  });
};

// Hook específico para el Modal de Liquidación
export const useLiquidacionData = (solicitudId: number | null) => {
  return useQuery({
    queryKey: KEYS.liquidacion(solicitudId!),
    queryFn: async () => {
        if (!solicitudId) return null;
        const [solicitudData, liquidacionData] = await Promise.all([
            getSolicitudParaLiquidacion(solicitudId),
            getLiquidacionBySolicitudId(solicitudId)
        ]);
        return { solicitudData, liquidacionData };
    },
    enabled: !!solicitudId, 
    refetchOnWindowFocus: false 
  });
};

// ==========================================
// 2. HOOKS DE ESCRITURA (MUTATIONS)
// ==========================================

export const useSolicitudMutations = () => {
  const queryClient = useQueryClient();

  // Crear Solicitud
  const crear = useMutation({
    mutationFn: (data: CreateSolicitudPayload) => saveSolicitud(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });
    },
  });

  // Actualizar Solicitud
  const actualizar = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateSolicitudPayload }) => updateSolicitud(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });
    },
  });

  // Eliminar Solicitud
  const eliminar = useMutation({
    mutationFn: (id: number) => deleteSolicitud(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });
    },
  });

  return { crear, actualizar, eliminar };
};

export const useLiquidacionMutations = () => {
    const queryClient = useQueryClient();

    // Guardar Liquidación
    const guardar = useMutation({
        mutationFn: saveLiquidacion,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: KEYS.liquidacion(variables.id_solicitud) });
            queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });
        }
    });

    // Actualizar Liquidación
    const actualizar = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateLiquidacion(id, data),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });
        }
    });

    return { guardar, actualizar };
};