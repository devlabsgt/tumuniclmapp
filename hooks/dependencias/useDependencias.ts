'use client';

import { createClient } from '@/utils/supabase/client';
import useSWR from 'swr';
import { Database } from '@/lib/database.types';

type Dependencia = Database['public']['Tables']['dependencias']['Row'];

const supabase = createClient();

const fetcher = async (): Promise<Dependencia[]> => {
  const { data, error } = await supabase
    .from('dependencias')
    .select('*, no')
    .order('no', { ascending: true });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
};

export function useDependencias() {
  const { data, error, isLoading, mutate } = useSWR('dependencias', fetcher);
  
  return {
    dependencias: data ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}