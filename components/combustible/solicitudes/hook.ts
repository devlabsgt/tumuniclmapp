'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMySolicitudes, saveSolicitud, updateSolicitud, deleteSolicitud, 
  searchVehiculos, getSolicitudParaLiquidacion, saveLiquidacion,
  getLiquidacionBySolicitudId, updateLiquidacion, getCurrentUserInfo,
  getDatosSolicitudImpresion
} from './actions'; 
import { CreateSolicitudPayload } from './types';

export const KEYS = {
  solicitudes: ['solicitudes'],
  vehiculos: (q: string) => ['vehiculos', q],
  liquidacion: (id: number) => ['liquidacion', id],
  perfil: ['perfil'],
  impresion: (id: number) => ['impresion', id],
};

const FIVE_MINUTES = 1000 * 60 * 5;

export const useUserInfo = () => {
  return useQuery({
    queryKey: KEYS.perfil,
    queryFn: () => getCurrentUserInfo(),
    staleTime: FIVE_MINUTES, 
  });
};
 
export const useDetalleImpresion = (id: number) => {
  return useQuery({
    queryKey: KEYS.impresion(id),
    queryFn: () => getDatosSolicitudImpresion(id),
    enabled: !!id, 
    staleTime: FIVE_MINUTES, 
  });
};

export const useSearchVehiculos = (query: string) => {
  return useQuery({
    queryKey: KEYS.vehiculos(query),
    queryFn: () => searchVehiculos(query),
    enabled: query.length >= 1, 
    staleTime: FIVE_MINUTES,   
  });
};

export const useSolicitudes = () => {
  return useQuery({
    queryKey: KEYS.solicitudes,
    queryFn: () => getMySolicitudes(),
    staleTime: FIVE_MINUTES, 
  });
};

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
    staleTime: FIVE_MINUTES, 
  });
};

export const useSolicitudMutations = () => {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });

  const crear = useMutation({ mutationFn: saveSolicitud, onSuccess: invalidar });
  const actualizar = useMutation({ 
    mutationFn: ({ id, data }: { id: number; data: CreateSolicitudPayload }) => updateSolicitud(id, data), 
    onSuccess: invalidar 
  });
  const eliminar = useMutation({ mutationFn: deleteSolicitud, onSuccess: invalidar });

  return { crear, actualizar, eliminar };
};

export const useLiquidacionMutations = () => {
    const queryClient = useQueryClient();
    
    const invalidar = (id: number) => {
        queryClient.invalidateQueries({ queryKey: KEYS.liquidacion(id) });
        queryClient.invalidateQueries({ queryKey: KEYS.solicitudes });
    };

    const guardar = useMutation({
        mutationFn: saveLiquidacion,
        onSuccess: (_, vars) => invalidar(vars.id_solicitud)
    });

    const actualizar = useMutation({
        mutationFn: ({ id, data, id_solicitud }: { id: string, data: any, id_solicitud: number }) => 
            updateLiquidacion(id, data), 
        
        onSuccess: (_, vars) => invalidar(vars.id_solicitud)
    });

    return { guardar, actualizar };
};