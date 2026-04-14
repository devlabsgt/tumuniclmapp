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
      usuario:info_usuario ( 
          nombre,
          dependencia:dependencias!info_usuario_dependencia_id_fkey ( nombre ) 
      ),
      vehiculo:vehiculos ( modelo, tipo_combustible, tipo_vehiculo ),
      detalles:datos_comision_combustible ( lugar_visitar, kilometros_recorrer, fecha_inicio, fecha_fin ),
      liquidacion:liquidacion ( correlativo, lote_masivo_id )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching solicitudes:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
      ...item,
      usuario: Array.isArray(item.usuario) ? item.usuario[0] : item.usuario,
      vehiculo: Array.isArray(item.vehiculo) ? item.vehiculo[0] : item.vehiculo,
      liquidacion: Array.isArray(item.liquidacion) ? item.liquidacion[0] : item.liquidacion,
      detalles: item.detalles || []
  })) as unknown as SolicitudEntrega[];
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

  const { data: creadorData } = await supabase
    .from('info_usuario')
    .select(`
      nombre,
      dependencia:dependencias!info_usuario_dependencia_id_fkey (
         nombre,
         padre:parent_id(nombre)
      )
    `)
    .eq('user_id', lote.creado_por)
    .maybeSingle();

  const dep = creadorData?.dependencia as any;
  const direccion = dep?.padre?.nombre || '';
  const cargo = dep?.nombre || '';

  // Obtener todas las liquidaciones (y sus solicitudes) asociadas a este lote masivo
  const { data: liquidaciones, error: liqError } = await supabase
    .from('liquidacion')
    .select(`
      id,
      correlativo,
      km_final,
      id_solicitud,
      solicitud:solicitud_combustible (
        id, correlativo, placa, municipio_destino, kilometraje_inicial,
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
      creadorNombre: creadorData?.nombre || '',
      creadorCargo: cargo,
      creadorDireccion: direccion,
      items
  };
};