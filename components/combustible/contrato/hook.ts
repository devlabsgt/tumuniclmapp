"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getContratos, 
  createContrato, 
  updateContrato, 
  deleteContrato, 
  getSiguienteCorrelativo,
  NuevoContratoMultiplexDTO 
} from "./actions";
import { ContratoExtendido } from "./types";

const KEYS = {
  contratos: ["contratos-combustible"],
};

const FIVE_MINUTES = 1000 * 60 * 5;

export const useContratos = (initialData: ContratoExtendido[] = []) => {
  return useQuery({
    queryKey: KEYS.contratos,
    queryFn: getContratos,
    initialData: initialData.length > 0 ? initialData : undefined,
    staleTime: FIVE_MINUTES,
  });
};

export const useContratoMutations = () => {
  const queryClient = useQueryClient();

  const invalidar = () => queryClient.invalidateQueries({ queryKey: KEYS.contratos });

  const crear = useMutation({
    mutationFn: (data: NuevoContratoMultiplexDTO) => createContrato(data),
    onSuccess: invalidar,
  });

  const actualizar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NuevoContratoMultiplexDTO }) => 
      updateContrato(id, data),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => deleteContrato(id),
    onSuccess: invalidar,
  });

  const generarCorrelativo = useMutation({
    mutationFn: (anio: number) => getSiguienteCorrelativo(anio),
  });

  return { crear, actualizar, eliminar, generarCorrelativo };
};