// components/combustible/entregaCupon/lib/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  SolicitudEntrega, 
  entregaCuponSchema, 
  EntregaCuponFormValues 
} from './schemas';

// ==========================================
// 1. OBTENER LISTADO DE SOLICITUDES (Tu código actual)
// ==========================================
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

// ==========================================
// 2. OBTENER INVENTARIO (Para llenar el Select del Modal)
// ==========================================
export const getInventarioPorTipo = async (tipo: 'Gasolina' | 'Diesel') => {
  const supabase = await createClient();
   
  // Buscamos en 'DetalleContrato' filtrando por el nombre del producto
  // Usamos ilike para que coincida mayúsculas/minúsculas (ej: '%Gasolina%')
  const { data, error } = await supabase
    .from('DetalleContrato')
    .select('id, producto, denominacion, cantidad_actual')
    .ilike('producto', `%${tipo}%`) 
    .gt('cantidad_actual', 0) // Solo traemos lo que tiene saldo > 0
    .order('denominacion', { ascending: false });

  if (error) {
    console.error("Error al obtener inventario:", error);
    return [];
  }
  return data || [];
};

// ==========================================
// 3. GUARDAR ENTREGA Y APROBAR (Transacción)
// ==========================================
export const entregarCupones = async (payload: EntregaCuponFormValues) => {
  const supabase = await createClient();

  // A. Validación de datos en el servidor
  const result = entregaCuponSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: "Datos inválidos en la solicitud." };
  }

  const { items, solicitud_id } = result.data;

  try {
    // Recorremos cada bloque de cupones (fila del formulario)
    for (const item of items) {
      
      // 1. Registrar entrega en `entrega_cupones`
      const { error: insertError } = await supabase
        .from('entrega_cupones')
        .insert({
          solicitud_id: solicitud_id,
          detalle_contrato_id: item.detalle_contrato_id,
          correlativo_inicio: item.correlativo_inicio,
          correlativo_fin: item.correlativo_fin,
          cantidad_entregada: item.cantidad_asignada
        });

      if (insertError) throw new Error("Error al registrar entrega: " + insertError.message);

      // 2. Descontar Inventario en `DetalleContrato`
      // Leemos el stock actual para restarle
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

    // 3. Finalizar: Actualizar estado de la solicitud a 'aprobada'
    const { error: updateSolError } = await supabase
      .from('solicitud_combustible')
      .update({ estado: 'aprobado' })
      .eq('id', solicitud_id);

    // NUEVO CÓDIGO CON DETALLES
    if (updateSolError) {
        console.error("ERROR DB DETALLADO:", updateSolError); // Ver en consola del servidor
        throw new Error(`Error finalizando la solicitud: ${updateSolError.message} (${updateSolError.code})`);
    }

    // 4. Revalidar para que la lista se actualice sola
    revalidatePath('/combustible/entregaCupon'); 
    return { success: true };

  } catch (error: any) {
    console.error("Error en transacción:", error);
    return { success: false, error: error.message || "Error desconocido al procesar" };
  }
};

// ==========================================
// 4. NUEVA FUNCIÓN: RECHAZAR SOLICITUD
// ==========================================
export const rechazarSolicitud = async (id: number, motivo: string) => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('solicitud_combustible')
    .update({ 
        estado: 'rechazado',
        justificacion: motivo // Guardamos el motivo (asegúrate que tu BD permita re-escribir esto o usa otro campo)
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/combustible/entregaCupon');
  return { success: true };
};

// ==========================================
// 5. OBTENER DATOS PARA IMPRESIÓN (CORREGIDO)
// ==========================================
export const getDatosImpresion = async (solicitud_id: number) => {
  const supabase = await createClient();

  // A. Obtener el nombre del usuario en sesión (Quien está entregando el vale)
  const { data: { user } } = await supabase.auth.getUser();
  let nombreAprobador = 'Encargado de Combustibles'; // Valor por defecto

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

  // B. Obtener datos de la solicitud (AQUÍ AGREGAMOS "dpi")
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

  // C. Obtener los cupones entregados
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
    aprobador: nombreAprobador, // <--- Enviamos el nombre del admin
    items: entregas.map((e: any) => {
      // Manejo seguro por si detalle viene como array
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