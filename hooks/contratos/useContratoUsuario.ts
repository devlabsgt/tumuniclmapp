'use client';

import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Database } from '@/lib/database.types';

type Contrato = Database['public']['Tables']['info_contrato']['Row'];

interface ContratoData {
  contrato: Contrato | null;
  cargoAsignado: string | null;
}

const FIVE_MINUTES = 1000 * 60 * 5;

const KEYS = {
  contrato: (userId: string | null, depId: string | null | undefined) => 
    ['contrato', userId, depId],
};

export function useContratoUsuario(userId: string | null, dependenciaId: string | null | undefined) {
  
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: KEYS.contrato(userId, dependenciaId),
    
    queryFn: async (): Promise<ContratoData> => {
      const supabase = createClient();
      let contrato: Contrato | null = null;
      let cargoAsignado: string | null = null;

      const { data: contratoData, error: contratoError } = await supabase
        .from('info_contrato')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (contratoError && contratoError.code !== 'PGRST116') {
        throw new Error(contratoError.message);
      }
      
      contrato = contratoData;

      if (dependenciaId) {
        const { data: dependenciaData, error: dependenciaError } = await supabase
          .from('dependencias')
          .select('nombre')
          .eq('id', dependenciaId)
          .single();

        if (dependenciaError && dependenciaError.code !== 'PGRST116') {
          console.error('Error fetching dependencia name:', dependenciaError);
        }

        cargoAsignado = dependenciaData?.nombre ?? null;
      }
      
      return { contrato, cargoAsignado };
    },
    
    enabled: !!userId,
    
    staleTime: FIVE_MINUTES,
  });
  
  return {
    contrato: data?.contrato ?? null,
    cargoAsignado: data?.cargoAsignado ?? null,
    loading: isLoading,
    error,
    mutate: refetch,
  };
}