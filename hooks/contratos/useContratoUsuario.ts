'use client';

import { createClient } from '@/utils/supabase/client';
import useSWR from 'swr';
import { Database } from '@/lib/database.types';

type Contrato = Database['public']['Tables']['info_contrato']['Row'];

const supabase = createClient();

const fetcher = async (userId: string): Promise<Contrato | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('info_contrato')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  
  return data;
};

export function useContratoUsuario(userId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ['contrato', userId] : null,
    () => fetcher(userId!)
  );
  
  return {
    contrato: data,
    loading: isLoading,
    error,
    mutate,
  };
}