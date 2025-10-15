'use client';

import { createClient } from '@/utils/supabase/client';
import useSWR from 'swr';
import { Database } from '@/lib/database.types';

type Contrato = Database['public']['Tables']['info_contrato']['Row'];

interface ContratoData {
  contrato: Contrato | null;
  cargoAsignado: string | null;
}

const supabase = createClient();

const fetcher = async ({ userId, dependenciaId }: { userId: string, dependenciaId: string | null | undefined }): Promise<ContratoData> => {
  let contrato: Contrato | null = null;
  let cargoAsignado: string | null = null;

  // 1. Obtener la información del contrato
  const { data: contratoData, error: contratoError } = await supabase
    .from('info_contrato')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (contratoError && contratoError.code !== 'PGRST116') {
    throw new Error(contratoError.message);
  }
  
  contrato = contratoData;

  // 2. Obtener el nombre de la dependencia (Cargo) si el ID está disponible
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
};

export function useContratoUsuario(userId: string | null, dependenciaId: string | null | undefined) {
  const shouldFetch = userId;
  
  const fetchKey = shouldFetch ? ['contrato', userId, dependenciaId] : null;

  const { data, error, isLoading, mutate } = useSWR(
    fetchKey,
    () => fetcher({ userId: userId!, dependenciaId })
  );
  
  return {
    contrato: data?.contrato ?? null,
    cargoAsignado: data?.cargoAsignado ?? null,
    loading: isLoading,
    error,
    mutate,
  };
}