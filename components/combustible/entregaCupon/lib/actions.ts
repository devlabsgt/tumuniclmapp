'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  SolicitudEntrega, 
  entregaCuponSchema, 
  EntregaCuponFormValues 
} from './schemas';

export const getSolicitudesParaEntrega = async (): Promise<SolicitudEntrega[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('solicitud_combustible')
    .select(`
      id,
      created_at,
      placa,
      municipio_destino,
      justificacion,
      kilometraje_inicial,
      estado,
      correlativo,
      solvente, 
      usuario:info_usuario ( nombre ),
      vehiculo:vehiculos ( modelo, tipo_combustible, tipo_vehiculo ),
      detalles:datos_comision_combustible ( lugar_visitar, kilometros_recorrer, fecha_inicio, fecha_fin )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching solicitudes:", error);
    return [];
  }

  return data as unknown as SolicitudEntrega[];
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

    revalidatePath('/combustible/entregaCupon'); 
    return { success: true };

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
      usuario:info_usuario (
        nombre,
        dependencia:dependencias!info_usuario_dependencia_id_fkey ( 
          nombre,
          padre:parent_id ( nombre ) 
        )
      ),
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
        monto: montoTotal,
        tipo: sol.vales[0]?.detalle?.producto || 'N/A',
        correlativoInicio: sol.vales[0]?.correlativo_inicio,
        correlativoFin: sol.vales[sol.vales.length - 1]?.correlativo_fin
      });
    }
    return acc;
  }, {});
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