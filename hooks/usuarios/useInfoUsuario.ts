"use client";

import { useState, useEffect, useCallback } from "react";
import { getListaUsuariosAction, getDetalleUsuarioAction } from "./actions";

// Interfaz EXACTA que necesita TarjetaEmpleado
export interface InfoUsuarioData {
  id: string | null;
  email: string | null;
  nombre: string | null;
  activo: boolean | null;
  rol: string | null;

  // Arrays requeridos por legado, aunque no se usen en la tarjeta
  permisos: string[];
  modulos: string[];
  programas: string[];

  direccion: string | null;
  telefono: string | null;
  dpi: string | null;
  nit: string | null;
  igss: string | null;
  cuenta_no: string | null;

  puesto_nombre: string | null;
  puesto_path_jerarquico: string | null;
  puesto_path_ordenado: string | null;

  // Financiero
  salario: number | null;
  bonificacion: number | null;
  renglon: string | null;
  prima: boolean | null;

  // NUEVOS CAMPOS
  plan_prestaciones?: boolean | null;
  isr?: number | null;

  contrato_no: string | null;
  fecha_ini: string | null;
  fecha_fin: string | null;

  horario_nombre: string | null;
  horario_dias: number[] | null;
  horario_entrada: string | null;
  horario_salida: string | null;
}

export interface InfoUsuario {
  user_id: string;
  dependencia_id: string | null;
}

// Hook para el Árbol (Lista simple)
export function useInfoUsuarios() {
  const [infoUsuarios, setInfoUsuarios] = useState<InfoUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInfoUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListaUsuariosAction();
      setInfoUsuarios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfoUsuarios();
  }, [fetchInfoUsuarios]);

  return { infoUsuarios, loading, mutate: fetchInfoUsuarios };
}

// Hook para la Tarjeta (Detalle completo)
export function useInfoUsuario(userId: string | null) {
  const [usuario, setUsuario] = useState<InfoUsuarioData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuario = useCallback(async () => {
    if (!userId) {
      setUsuario(null);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const data = await getDetalleUsuarioAction(userId);
      setUsuario(data);
    } catch (err: any) {
      console.error("Error en useInfoUsuario:", err);
      setError("Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  return { usuario, cargando, error, fetchUsuario };
}
