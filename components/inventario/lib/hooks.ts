"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInventarioActivo,
  getDependenciasBasicas,
  getUsuariosBasicos,
  crearBienInventario,
  trasladarBien,
  darBajaBien,
  getReporteJerarquicoInventario,
  editarBien,
  eliminarBien,
  getHistorialBien
} from "./actions";
import { CrearInventarioFormValues, EditarInventarioFormValues, TipoVistaInventario } from "./schemas";

const KEYS = {
  inventarioActivo: ["inventario-activo"],
  dependencias: ["dependencias-basicas"],
  usuarios: ["usuarios-basicos"],
  reporteJerarquico: ["reporte-jerarquico-inventario"],
};

const FIVE_MINUTES = 1000 * 60 * 5;
const ONE_HOUR = 1000 * 60 * 60;

export const useInventarioActivo = (
  estadoFiltro: string = 'Activo',
  tipoVista: TipoVistaInventario = 'general'
) => {
  return useQuery({
    queryKey: [...KEYS.inventarioActivo, estadoFiltro, tipoVista],
    queryFn: () => getInventarioActivo(estadoFiltro, tipoVista),
    staleTime: FIVE_MINUTES,
  });
};

export const useDependenciasBasicas = () => {
  return useQuery({
    queryKey: KEYS.dependencias,
    queryFn: getDependenciasBasicas,
    staleTime: ONE_HOUR, // las dependencias no cambian tan seguido
  });
};

export const useUsuariosBasicos = () => {
  return useQuery({
    queryKey: KEYS.usuarios,
    queryFn: getUsuariosBasicos,
    staleTime: ONE_HOUR, // los usuarios no cambian tan seguido
  });
};

export const useReporteJerarquicoInventario = (estadoFiltro: string = 'Activo') => {
  return useQuery({
    queryKey: [...KEYS.reporteJerarquico, estadoFiltro],
    queryFn: () => getReporteJerarquicoInventario(estadoFiltro),
    staleTime: FIVE_MINUTES,
  });
};

export const useHistorialBien = (idBien: string) => {
  return useQuery({
    queryKey: ["historial-bien", idBien],
    queryFn: () => getHistorialBien(idBien),
    staleTime: FIVE_MINUTES,
    enabled: !!idBien,
  });
};

export const useInventarioMutations = () => {
  const queryClient = useQueryClient();

  const invalidarInventario = () => {
    queryClient.invalidateQueries({ queryKey: KEYS.inventarioActivo });
    queryClient.invalidateQueries({ queryKey: KEYS.reporteJerarquico });
  };

  const crearBien = useMutation({
    mutationFn: (payload: CrearInventarioFormValues) => crearBienInventario(payload),
    onSuccess: invalidarInventario,
  });

  const trasladar = useMutation({
    mutationFn: ({
      idBien,
      nuevoIdUsuario,
      nuevoIdDependencia,
      imagenUrl,
      observaciones
    }: {
      idBien: string;
      nuevoIdUsuario: string | null;
      nuevoIdDependencia: string | null;
      imagenUrl: string | null;
      observaciones: string | null;
    }) => trasladarBien(idBien, nuevoIdUsuario, nuevoIdDependencia, imagenUrl, observaciones),
    onSuccess: invalidarInventario,
  });

  const darBaja = useMutation({
    mutationFn: ({
      idBien,
      imagenUrl,
      observaciones
    }: {
      idBien: string;
      imagenUrl: string | null;
      observaciones: string;
    }) => darBajaBien(idBien, imagenUrl, observaciones),
    onSuccess: invalidarInventario,
  });

  const editar = useMutation({
    mutationFn: ({ idBien, datos }: { idBien: string, datos: EditarInventarioFormValues }) => editarBien(idBien, datos),
    onSuccess: invalidarInventario,
  });

  const eliminar = useMutation({
    mutationFn: (idBien: string) => eliminarBien(idBien),
    onSuccess: invalidarInventario,
  });

  return {
    crearBien,
    trasladar,
    darBaja,
    editar,
    eliminar
  };
};
