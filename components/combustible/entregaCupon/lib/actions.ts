'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  SolicitudEntrega, 
  entregaCuponSchema, 
  EntregaCuponFormValues 
} from './schemas';

const SOLICITUD_ENTREGA_SELECT = `
  id,
  created_at,
  placa,
  municipio_destino,
  justificacion,
  kilometraje_inicial,
  estado,
  correlativo,
  solvente,
  usuario:info_usuario (
    nombre,
    dependencia:dependencias!info_usuario_dependencia_id_fkey ( nombre )
  ),
  vehiculo:vehiculos ( modelo, tipo_combustible, tipo_vehiculo ),
  detalles:datos_comision_combustible ( lugar_visitar, kilometros_recorrer, fecha_inicio, fecha_fin ),
  liquidacion:liquidacion ( correlativo, lote_masivo_id )
`;

const mapSolicitudEntrega = (item: any): SolicitudEntrega => ({
  ...item,
  usuario: Array.isArray(item.usuario) ? item.usuario[0] : item.usuario,
  vehiculo: Array.isArray(item.vehiculo) ? item.vehiculo[0] : item.vehiculo,
  liquidacion: Array.isArray(item.liquidacion) ? item.liquidacion[0] : item.liquidacion,
  detalles: item.detalles || [],
} as SolicitudEntrega);

export const getSolicitudesParaEntrega = async (): Promise<SolicitudEntrega[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('solicitud_combustible')
    .select(SOLICITUD_ENTREGA_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching solicitudes:", error);
    return [];
  }

  return (data || []).map((item: any) => mapSolicitudEntrega(item)) as unknown as SolicitudEntrega[];
};

export const getSolicitudDetalleEntrega = async (
  id: number
): Promise<SolicitudEntrega | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('solicitud_combustible')
    .select(SOLICITUD_ENTREGA_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching solicitud detalle:', error);
    return null;
  }

  return mapSolicitudEntrega(data);
};

export const getInventarioPorTipo = async (tipo: 'Gasolina' | 'Diesel') => {
  const supabase = await createClient();
   
  const { data, error } = await supabase
    .from('DetalleContrato')
    .select('id, producto, denominacion, cantidad_actual')
    .ilike('producto', `%${tipo}%`) 
    .gt('cantidad_actual', 0)
    .order('denominacion', { ascending: false });

  if (error) {
    console.error("Error al obtener inventario:", error);
    return [];
  }
  return data || [];
};

export const entregarCupones = async (payload: EntregaCuponFormValues) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
      return { success: false, error: "Usuario no autenticado." };
  }

  const result = entregaCuponSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: "Datos inválidos en la solicitud." };
  }

  const { items, solicitud_id } = result.data;

  try {
    for (const item of items) {
      
      const { error: insertError } = await supabase
        .from('entrega_cupones')
        .insert({
          solicitud_id: solicitud_id,
          detalle_contrato_id: item.detalle_contrato_id,
          correlativo_inicio: item.correlativo_inicio,
          correlativo_fin: item.correlativo_fin,
          cantidad_entregada: item.cantidad_asignada,
          encargado: user.id 
        });

      if (insertError) throw new Error("Error al registrar entrega: " + insertError.message);

      const { data: currentItem } = await supabase
        .from('DetalleContrato')
        .select('cantidad_actual')
        .eq('id', item.detalle_contrato_id)
        .single();
        
      if (currentItem) {
        const nuevoStock = currentItem.cantidad_actual - item.cantidad_asignada;
        
        const { error: updateStockError } = await supabase
            .from('DetalleContrato')
            .update({ cantidad_actual: nuevoStock })
            .eq('id', item.detalle_contrato_id);

        if (updateStockError) throw new Error("Error actualizando stock.");
      }
    }

    const { data: maxRecord } = await supabase
      .from('solicitud_combustible')
      .select('correlativo')
      .not('correlativo', 'is', null)
      .order('correlativo', { ascending: false })
      .limit(1)
      .single();

    const currentMax = maxRecord?.correlativo || 0;
    const nuevoCorrelativo = currentMax + 1;

    const { error: updateSolError } = await supabase
      .from('solicitud_combustible')
      .update({ 
          estado: 'aprobado',
          correlativo: nuevoCorrelativo,
          solvente: false 
      })
      .eq('id', solicitud_id);

    if (updateSolError) {
        console.error("ERROR DB DETALLADO:", updateSolError);
        throw new Error(`Error finalizando la solicitud: ${updateSolError.message}`);
    }

    // Pre-crear el registro de liquidación con correlativo asignado.
    // El empleado se lleva la hoja al viaje con este número.
    // Al regresar, saveLiquidacion detecta el registro y solo lo actualiza.
    const { data: lastLiq } = await supabase
      .from('liquidacion')
      .select('correlativo')
      .not('correlativo', 'is', null)
      .order('correlativo', { ascending: false })
      .limit(1)
      .single();

    const liqCorrelativo = Math.max((lastLiq?.correlativo || 1) + 1, 2);

    await supabase.from('liquidacion').insert({
      id_solicitud: solicitud_id,
      correlativo: liqCorrelativo,
      estado_liquidacion: 'pendiente',
      km_final: 0,
      cupones_devueltos: 0,
      fecha_comision: new Date().toISOString(),
    });

    revalidatePath('/combustible/entregaCupon'); 
    return { success: true, liqCorrelativo };

  } catch (error: any) {
    console.error("Error en transacción:", error);
    return { success: false, error: error.message || "Error desconocido al procesar" };
  }
};

export const rechazarSolicitud = async (id: number, motivo: string) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('solicitud_combustible')
    .update({ 
        estado: 'rechazado',
        justificacion: motivo 
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/combustible/entregaCupon');
  return { success: true };
};

export const getDatosImpresion = async (solicitud_id: number) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let nombreAprobador = 'Encargado de Combustibles'; 

  if (user) {
    const { data: datosUser } = await supabase
      .from('info_usuario')
      .select('nombre')
      .eq('user_id', user.id)
      .single();
    
    if (datosUser?.nombre) {
      nombreAprobador = datosUser.nombre;
    }
  }

  const { data: solicitud, error: solError } = await supabase
    .from('solicitud_combustible')
    .select(`
      id, created_at, placa, municipio_destino,
      usuario:info_usuario ( nombre, dpi ), 
      vehiculo:vehiculos ( modelo, tipo_combustible )
    `)
    .eq('id', solicitud_id)
    .single();

  if (solError || !solicitud) {
    console.error("Error cargando solicitud:", solError);
    return null;
  }

  const { data: entregas, error: entError } = await supabase
    .from('entrega_cupones')
    .select(`
      cantidad_entregada,
      correlativo_inicio,
      correlativo_fin,
      detalle:DetalleContrato ( producto, denominacion )
    `)
    .eq('solicitud_id', solicitud_id);

  if (entError) {
    console.error("Error cargando entregas:", entError);
    return null;
  }

  return {
    ...solicitud,
    aprobador: nombreAprobador, 
    items: entregas.map((e: any) => {
      const det = Array.isArray(e.detalle) ? e.detalle[0] : e.detalle;
      
      return {
        cantidad: e.cantidad_entregada,
        producto: det?.producto || '---',
        denominacion: det?.denominacion || 0,
        inicio: e.correlativo_inicio,
        fin: e.correlativo_fin,
        subtotal: e.cantidad_entregada * (det?.denominacion || 0)
      };
    })
  };
};

export const getDatosReporteMensual = async (mes: number, anio: number, correlativoInicial: number = 20) => {
  const supabase = await createClient();

  const inicio = new Date(anio, mes, 1, 0, 0, 0).toISOString();
  const fin = new Date(anio, mes + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('solicitud_combustible')
    .select(`
      id,
      created_at,
      placa,
      justificacion,
      usuario:info_usuario (
        nombre,
        dependencia:dependencias!info_usuario_dependencia_id_fkey ( 
          nombre,
          padre:parent_id ( nombre ) 
        )
      ),
      vehiculo:vehiculos ( modelo ),
      vales:entrega_cupones (
        cantidad_entregada,
        correlativo_inicio,
        correlativo_fin,
        detalle:DetalleContrato ( denominacion, producto )
      )
    `)
    .eq('estado', 'aprobado')
    .gte('created_at', inicio)
    .lte('created_at', fin);

  if (error || !data) return {};

  let actualCorrelativo = correlativoInicial;

  return data.reduce((acc: any, sol: any) => {
    const dep = sol.usuario?.dependencia;
    const nombreOficina = dep?.padre?.nombre || dep?.nombre || 'OFICINA NO ASIGNADA';
    
    if (!acc[nombreOficina]) {
      acc[nombreOficina] = {
        informeNo: `T3208-122-250-${String(actualCorrelativo).padStart(3, '0')}-2026`,
        items: []
      };
      actualCorrelativo++;
    }
    
    const montoTotal = sol.vales?.reduce((sum: number, v: any) => 
      sum + (v.cantidad_entregada * (v.detalle?.denominacion || 0)), 0) || 0;

    if (montoTotal > 0) {
      acc[nombreOficina].items.push({
        fecha: new Date(sol.created_at).toLocaleDateString('es-GT'),
        piloto: sol.usuario?.nombre,
        placa: sol.placa,
        comision: nombreOficina.toUpperCase().includes('RED VIAL') 
          ? 'Mantenimiento De Carreteras' 
          : (sol.justificacion || 'N/A'),
        modeloVehiculo: Array.isArray(sol.vehiculo) ? sol.vehiculo[0]?.modelo : sol.vehiculo?.modelo || 'No asignado',
        monto: montoTotal,
        tipo: sol.vales[0]?.detalle?.producto || 'N/A',
        correlativoInicio: sol.vales[0]?.correlativo_inicio,
        correlativoFin: sol.vales[sol.vales.length - 1]?.correlativo_fin
      });
    }
    return acc;
  }, {});
};

export interface SolicitudReporteItem {
  id: number;
  correlativo: number | null;
  created_at: string;
  placa: string;
  vehiculo: string;
  municipio_destino: string;
  justificacion: string | null;
  monto: number;
  tipo_combustible: string;
}

export interface ParamsReporteCombustible {
  modoRango: boolean;
  mes: number;
  anio: number;
  mesInicio: number;
  mesFin: number;
  anioInicio: number;
  anioFin: number;
}

export interface FilaReporteDependencia {
  id: string;
  prefix: string;
  level: number;
  tipo: 'dependencia' | 'empleado' | 'solicitud';
  nombre: string;
  nombrePuesto?: string;
  total: number;
  esPuesto: boolean;
  branchPrefix: string;
  rutaDependencia: string;
  userId?: string;
  solicitudes?: SolicitudReporteItem[];
  solicitud?: SolicitudReporteItem;
}

export interface ReporteJerarquicoCombustible {
  filas: FilaReporteDependencia[];
  filasPorPersona: FilaReporteDependencia[];
  granTotal: number;
}

const getRangoFechas = (params: ParamsReporteCombustible) => {
  if (!params.modoRango) {
    return {
      inicio: new Date(params.anio, params.mes, 1, 0, 0, 0).toISOString(),
      fin: new Date(params.anio, params.mes + 1, 0, 23, 59, 59).toISOString(),
    };
  }

  let inicio = new Date(params.anioInicio, params.mesInicio, 1, 0, 0, 0);
  let fin = new Date(params.anioFin, params.mesFin + 1, 0, 23, 59, 59);

  if (inicio > fin) {
    const tmpInicio = inicio;
    inicio = new Date(params.anioFin, params.mesFin, 1, 0, 0, 0);
    fin = new Date(tmpInicio.getFullYear(), tmpInicio.getMonth() + 1, 0, 23, 59, 59);
  }

  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
};

export const getReporteJerarquicoCombustible = async (
  params: ParamsReporteCombustible
): Promise<ReporteJerarquicoCombustible> => {
  const supabase = await createClient();
  const { inicio, fin } = getRangoFechas(params);

  const [depsRes, infosRes, solsRes] = await Promise.all([
    supabase.from('dependencias').select('id, nombre, parent_id, no, es_puesto'),
    supabase.from('info_usuario').select('user_id, nombre, dependencia_id'),
    supabase
      .from('solicitud_combustible')
      .select(`
        id,
        user_id,
        created_at,
        correlativo,
        placa,
        municipio_destino,
        justificacion,
        vehiculo:vehiculos ( tipo_combustible, modelo ),
        vales:entrega_cupones (
          cantidad_entregada,
          detalle:DetalleContrato ( denominacion )
        )
      `)
      .eq('estado', 'aprobado')
      .gte('created_at', inicio)
      .lte('created_at', fin),
  ]);

  const deps = depsRes.data || [];
  const infos = infosRes.data || [];
  const sols = solsRes.data || [];

  // 1. Solicitudes y totales por usuario
  const totalPorUsuario = new Map<string, number>();
  const solicitudesPorUsuario = new Map<string, SolicitudReporteItem[]>();

  (sols as any[]).forEach((s) => {
    if (!s.user_id) return;
    const monto = (s.vales || []).reduce((acc: number, v: any) => {
      const det = Array.isArray(v.detalle) ? v.detalle[0] : v.detalle;
      return acc + (v.cantidad_entregada || 0) * (det?.denominacion || 0);
    }, 0);
    if (monto <= 0) return;

    const vehiculo = Array.isArray(s.vehiculo) ? s.vehiculo[0] : s.vehiculo;
    const item: SolicitudReporteItem = {
      id: s.id,
      correlativo: s.correlativo,
      created_at: s.created_at,
      placa: s.placa,
      vehiculo: vehiculo?.modelo?.trim() || '—',
      municipio_destino: s.municipio_destino,
      justificacion: s.justificacion ?? null,
      monto,
      tipo_combustible: vehiculo?.tipo_combustible || 'N/A',
    };

    if (!solicitudesPorUsuario.has(s.user_id)) {
      solicitudesPorUsuario.set(s.user_id, []);
    }
    solicitudesPorUsuario.get(s.user_id)!.push(item);
    totalPorUsuario.set(s.user_id, (totalPorUsuario.get(s.user_id) || 0) + monto);
  });

  // 2. Construir el árbol de dependencias
  interface Nodo {
    id: string;
    nombre: string;
    no: number;
    parent_id: string | null;
    es_puesto: boolean;
    children: Nodo[];
    empleados: { user_id: string; nombre: string; total: number }[];
    total: number;
  }

  const nodeMap = new Map<string, Nodo>();
  (deps as any[]).forEach((d) => {
    nodeMap.set(d.id, {
      id: d.id,
      nombre: d.nombre,
      no: d.no ?? 0,
      parent_id: d.parent_id,
      es_puesto: !!d.es_puesto,
      children: [],
      empleados: [],
      total: 0,
    });
  });

  const roots: Nodo[] = [];
  (deps as any[]).forEach((d) => {
    const nodo = nodeMap.get(d.id)!;
    if (d.parent_id && nodeMap.has(d.parent_id)) {
      nodeMap.get(d.parent_id)!.children.push(nodo);
    } else {
      roots.push(nodo);
    }
  });

  // 3. Asignar empleados (con consumo) a su dependencia
  const usuariosUbicados = new Set<string>();
  const sinDependencia: { user_id: string; nombre: string; total: number }[] = [];

  (infos as any[]).forEach((info) => {
    const total = totalPorUsuario.get(info.user_id) || 0;
    if (total <= 0) return;
    usuariosUbicados.add(info.user_id);
    const nodo = info.dependencia_id ? nodeMap.get(info.dependencia_id) : null;
    if (nodo) {
      nodo.empleados.push({ user_id: info.user_id, nombre: info.nombre || 'Sin nombre', total });
    } else {
      sinDependencia.push({ user_id: info.user_id, nombre: info.nombre || 'Sin nombre', total });
    }
  });

  // Usuarios con consumo que no aparecen en info_usuario
  totalPorUsuario.forEach((total, userId) => {
    if (!usuariosUbicados.has(userId)) {
      sinDependencia.push({ user_id: userId, nombre: 'Usuario sin información', total });
    }
  });

  // 4. Totales acumulados (de abajo hacia arriba)
  const computarTotal = (nodo: Nodo): number => {
    let t = nodo.empleados.reduce((acc, e) => acc + e.total, 0);
    nodo.children.forEach((c) => {
      t += computarTotal(c);
    });
    nodo.total = t;
    return t;
  };
  roots.forEach(computarTotal);

  // 5. Aplanar el árbol respetando jerarquía y podando ramas sin consumo
  const filas: FilaReporteDependencia[] = [];

  const recorrer = (nodo: Nodo, prefix: string, level: number, ruta: string[]) => {
    if (nodo.total <= 0) return;

    const rutaActual = [...ruta, nodo.nombre];
    const mostrarNumero = !nodo.es_puesto;

    // Puesto con empleado: solo la persona, sin repetir el nombre del puesto
    if (nodo.es_puesto && nodo.empleados.length > 0) {
      [...nodo.empleados]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        .forEach((e, i) => {
          filas.push({
            id: `${nodo.id}-emp-${i}`,
            prefix: '',
            level,
            tipo: 'empleado',
            nombre: e.nombre,
            nombrePuesto: nodo.nombre,
            total: e.total,
            esPuesto: false,
            branchPrefix: prefix,
            rutaDependencia: rutaActual.join(' › '),
            userId: e.user_id,
          });
        });
    } else {
      filas.push({
        id: nodo.id,
        prefix: mostrarNumero ? prefix : '',
        level,
        tipo: 'dependencia',
        nombre: nodo.nombre,
        total: nodo.total,
        esPuesto: nodo.es_puesto,
        branchPrefix: prefix,
        rutaDependencia: rutaActual.join(' › '),
      });

      if (!nodo.es_puesto) {
        [...nodo.empleados]
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
          .forEach((e, i) => {
            filas.push({
              id: `${nodo.id}-emp-${i}`,
              prefix: '',
              level: level + 1,
              tipo: 'empleado',
              nombre: e.nombre,
              total: e.total,
              esPuesto: false,
              branchPrefix: prefix,
              rutaDependencia: rutaActual.join(' › '),
              userId: e.user_id,
            });
          });
      }
    }

    const hijosOrdenados = [...nodo.children].sort((a, b) => a.no - b.no);
    hijosOrdenados.forEach((c) => {
      const hijoPrefix = mostrarNumero ? `${prefix}.${c.no}` : prefix;
      recorrer(c, hijoPrefix, level + 1, rutaActual);
    });
  };

  [...roots].sort((a, b) => a.no - b.no).forEach((r) => recorrer(r, `${r.no}`, 0, []));

  // 6. Grupo de usuarios sin dependencia asignada
  if (sinDependencia.length > 0) {
    const totalSin = sinDependencia.reduce((acc, e) => acc + e.total, 0);
    filas.push({
      id: 'sin-dependencia',
      prefix: '—',
      level: 0,
      tipo: 'dependencia',
      nombre: 'SIN DEPENDENCIA ASIGNADA',
      total: totalSin,
      esPuesto: false,
      branchPrefix: 'sin-dependencia',
      rutaDependencia: 'SIN DEPENDENCIA ASIGNADA',
    });
    sinDependencia
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .forEach((e, i) => {
        filas.push({
          id: `sin-dependencia-emp-${i}`,
          prefix: '',
          level: 1,
          tipo: 'empleado',
          nombre: e.nombre,
          total: e.total,
          esPuesto: false,
          branchPrefix: 'sin-dependencia',
          rutaDependencia: 'SIN DEPENDENCIA ASIGNADA',
          userId: e.user_id,
        });
      });
  }

  filas.forEach((f) => {
    if (f.tipo === 'empleado' && f.userId) {
      f.solicitudes = (solicitudesPorUsuario.get(f.userId) || []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  });

  const filasPorPersona = filas
    .filter((f) => f.tipo === 'empleado')
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const granTotal = filas
    .filter((f) => f.level === 0 && f.tipo === 'dependencia')
    .reduce((acc, f) => acc + f.total, 0);

  return { filas, filasPorPersona, granTotal };
};

export const getLiquidacionAdmin = async (solicitud_id: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('liquidacion')
    .select('*')
    .eq('id_solicitud', solicitud_id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching liquidacion:", error);
    return null;
  }
  return data;
};

export const aprobarLiquidacionFinal = async (
  solicitud_id: number, 
  itemsDevolucion: { id: string; cantidad: number }[] = []
) => {
  const supabase = await createClient();

  try {
    if (itemsDevolucion.length > 0) {
      for (const item of itemsDevolucion) {
        if (item.cantidad > 0) {
          const { data: currentItem, error: fetchError } = await supabase
            .from('DetalleContrato')
            .select('cantidad_actual')
            .eq('id', item.id)
            .single();

          if (fetchError || !currentItem) {
            throw new Error(`Error al buscar cupón para devolución: ${fetchError?.message}`);
          }

          const stockActual = Number(currentItem.cantidad_actual);
          const cantidadDevuelta = Number(item.cantidad);

          const nuevoStock = stockActual + cantidadDevuelta;
          
          const { error: updateError } = await supabase
            .from('DetalleContrato')
            .update({ cantidad_actual: nuevoStock })
            .eq('id', item.id);

          if (updateError) {
            throw new Error(`Error actualizando inventario: ${updateError.message}`);
          }
        }
      }
    }

    await supabase
      .from('liquidacion')
      .update({ estado_liquidacion: 'aprobado' })
      .eq('id_solicitud', solicitud_id);

    const { error } = await supabase
      .from('solicitud_combustible')
      .update({ solvente: true })
      .eq('id', solicitud_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/combustible/entregaCupon');
    return { success: true };

  } catch (error: any) {
    console.error("Error en aprobación final:", error);
    return { success: false, error: error.message };
  }
};

export const getEntregasRealizadas = async (solicitud_id: number) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('entrega_cupones')
    .select(`
      correlativo_inicio,
      correlativo_fin,
      detalle:DetalleContrato ( id, producto, denominacion )
    `)
    .eq('solicitud_id', solicitud_id);

  if (error) {
    console.error("Error obteniendo historial de entregas:", error);
    return [];
  }
  
  return data.map((item: any) => {
      const det = Array.isArray(item.detalle) ? item.detalle[0] : item.detalle;
      return {
        id: det.id,                 
        producto: det.producto,
        denominacion: det.denominacion,
        inicio: item.correlativo_inicio,
        fin: item.correlativo_fin
      };
  });
};

export const generarLoteMasivo = async (solicitudIds: number[]) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Usuario no autenticado' };

  try {
    // 1. Obtener el siguiente correlativo
    const { data: maxRecord } = await supabase
      .from('lote_liquidacion_combustible')
      .select('correlativo')
      .order('correlativo', { ascending: false })
      .limit(1)
      .single();

    const nuevoCorrelativo = maxRecord?.correlativo ? maxRecord.correlativo + 1 : 2;

    // 2. Crear el nuevo lote
    const { data: lote, error: loteError } = await supabase
      .from('lote_liquidacion_combustible')
      .insert({
        creado_por: user.id,
        correlativo: nuevoCorrelativo
      })
      .select('id')
      .single();

    if (loteError || !lote) throw new Error(loteError?.message || 'Error al crear lote.');

    // 3. Vincular las liquidaciones a este lote
    const { error: updateError } = await supabase
      .from('liquidacion')
      .update({ lote_masivo_id: lote.id })
      .in('id_solicitud', solicitudIds);

    if (updateError) throw new Error(updateError.message);

    revalidatePath('/combustible/entregaCupon');
    return { success: true, loteId: lote.id, correlativo: nuevoCorrelativo };
  } catch (error: any) {
    console.error("Error generando lote masivo:", error);
    return { success: false, error: error.message };
  }
};

export const getDatosLoteMasivo = async (lote_masivo_id: number) => {
  const supabase = await createClient();

  // Obtener la info general del lote
  const { data: lote, error: loteError } = await supabase
    .from('lote_liquidacion_combustible')
    .select('*')
    .eq('id', lote_masivo_id)
    .single();

  if (loteError || !lote) return null;

  // Obtener todas las liquidaciones (y sus solicitudes) asociadas a este lote masivo
  const { data: liquidaciones, error: liqError } = await supabase
    .from('liquidacion')
    .select(`
      id,
      correlativo,
      km_final,
      id_solicitud,
      solicitud:solicitud_combustible (
        id, correlativo, placa, municipio_destino, kilometraje_inicial, user_id,
        usuario:info_usuario(nombre),
        vehiculo:vehiculos(modelo, tipo_combustible, tipo_vehiculo),
        entregas:entrega_cupones(
          cantidad_entregada, correlativo_inicio, correlativo_fin,
          created_at,
          detalle:DetalleContrato(producto, denominacion)
        )
      )
    `)
    .eq('lote_masivo_id', lote_masivo_id)
    .order('correlativo', { ascending: true });

  if (liqError) {
    console.error("Error cargando detalles del lote:", liqError);
    return null;
  }

  const primerUserId = liquidaciones && liquidaciones.length > 0 && liquidaciones[0].solicitud 
        ? Array.isArray(liquidaciones[0].solicitud) ? (liquidaciones[0].solicitud[0] as any).user_id : (liquidaciones[0].solicitud as any).user_id
        : null;

  let creadorNombre = '';
  let cargo = '';
  let direccion = '';

  if (primerUserId) {
    const { data: primerData } = await supabase
      .from('info_usuario')
      .select(`
        nombre,
        dependencia:dependencias!info_usuario_dependencia_id_fkey (
           nombre,
           padre:parent_id(nombre)
        )
      `)
      .eq('user_id', primerUserId)
      .maybeSingle();
      
    creadorNombre = primerData?.nombre || '';
    const dep = primerData?.dependencia as any;
    cargo = dep?.nombre || '';
    direccion = dep?.padre?.nombre || '';
  }

  // Mapeamos a la estructura plana que necesita la tabla del PDF
  const items = liquidaciones.map((liq: any) => {
     const sol = liq.solicitud;
     const vehiculo = Array.isArray(sol.vehiculo) ? sol.vehiculo[0] : sol.vehiculo;
     
     // Cálculos del cupón
     let valorQ = 0;
     let noCupones = '';
     let fechaEntrega = '';
     
     if (sol.entregas && sol.entregas.length > 0) {
        fechaEntrega = new Date(sol.entregas[0].created_at).toLocaleDateString('es-GT');
        // Sumar todos los cupones entregados para sacar el valor Q total
        sol.entregas.forEach((e: any) => {
            const denom = e.detalle ? (Array.isArray(e.detalle) ? e.detalle[0]?.denominacion : e.detalle.denominacion) : 0;
            valorQ += (e.cantidad_entregada * denom);
            const cuponText = e.correlativo_inicio === e.correlativo_fin 
                ? `${e.correlativo_inicio}` 
                : `${e.correlativo_inicio} al ${e.correlativo_fin}`;

            if (!noCupones) {
                 noCupones = cuponText;
            } else {
                 noCupones += ` / ${cuponText}`;
            }
        });
     }

     const isMaquina = ['maquinaria', 'retroexcavadora', 'tractor', 'patrulla de caminos', 'motoniveladora'].some(t => vehiculo?.tipo_vehiculo?.toLowerCase().includes(t)) || vehiculo?.tipo_vehiculo?.toLowerCase() === 'maquinaria';
     const inicial = sol.kilometraje_inicial || 0;
     const final = liq.km_final || 0;
     const dif = final > inicial ? final - inicial : 0;

     return {
         id_liquidacion: liq.correlativo,
         id_solicitud: sol.correlativo || sol.id || liq.id_solicitud,
         empleado: '', // Espacio en blanco para mano
         no_cupon: noCupones,
         valor_q: valorQ,
         modelo: vehiculo?.modelo || 'N/A',
         tv_vehiculo: vehiculo?.tipo_vehiculo?.toUpperCase() || 'N/A',
         destino: sol?.municipio_destino || 'N/A',
         fecha: fechaEntrega,
         tipo_combustible: vehiculo?.tipo_combustible?.toUpperCase() || 'N/A',
         inicial_val: inicial,
         final_val: final,
         diferencia_val: dif,
         is_maquina: isMaquina,
         placa: sol?.placa || 'N/A'
     };
  });

  return {
      loteCorrelativo: lote.correlativo, // Este es el general (ej. 2, 3...)
      fechaGeneracion: lote.created_at,
      creadorNombre: creadorNombre,
      creadorCargo: cargo,
      creadorDireccion: direccion,
      items
  };
};