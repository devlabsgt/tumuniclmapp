'use server'

import { createClient } from '@/utils/supabase/server';
import { UsuarioInfo, Vehiculo, DetalleComision, SolicitudCombustible, CreateSolicitudPayload } from './types';


const convertToUTC = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return new Date().toISOString();
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
      console.warn("⚠️ Fecha inválida recibida, usando fecha actual:", dateInput);
      return new Date().toISOString(); 
  }
  return date.toISOString();
};

export const getCurrentUserInfo = async (): Promise<UsuarioInfo | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: infoUser, error: userError } = await supabase
    .from('info_usuario')
    .select('user_id, nombre, dependencia_id')
    .eq('user_id', user.id)
    .single();

  if (userError || !infoUser) return null;

  let dependenciaData = null;
  if (infoUser.dependencia_id) {
    const { data: dep, error: depError } = await supabase
      .from('dependencias')
      .select(`id, nombre, padre:parent_id ( id, nombre )`)
      .eq('id', infoUser.dependencia_id)
      .single();
    if (!depError && dep) dependenciaData = dep;
  }

  let padreInfo = null;
  if (dependenciaData && dependenciaData.padre) {
      padreInfo = Array.isArray(dependenciaData.padre) ? dependenciaData.padre[0] : dependenciaData.padre;
  }

  return {
    user_id: infoUser.user_id,
    nombre: infoUser.nombre,
    dependencia: dependenciaData ? { id: dependenciaData.id, nombre: dependenciaData.nombre, padre: padreInfo } : null
  };
};

export const searchVehiculos = async (query: string): Promise<Vehiculo[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehiculos')
    .select('placa, tipo_vehiculo, modelo, tipo_combustible')
    .ilike('placa', `%${query}%`)
    .limit(5);
  if (error) return [];
  return (data || []).map(v => ({
      placa: v.placa || '',
      tipo_vehiculo: v.tipo_vehiculo || '',
      modelo: v.modelo || '',
      tipo_combustible: v.tipo_combustible || ''
  }));
};

export const saveSolicitud = async (input: CreateSolicitudPayload) => {
  const supabase = await createClient();
  if (input.es_nuevo_vehiculo) {
    await supabase.from('vehiculos').upsert({
        placa: input.vehiculo.placa,
        tipo_vehiculo: input.vehiculo.tipo_vehiculo,
        modelo: input.vehiculo.modelo,
        tipo_combustible: input.vehiculo.tipo_combustible,
      }, { onConflict: 'placa' });
  }

  const { data: solicitudData, error: solError } = await supabase
    .from('solicitud_combustible')
    .insert({
      user_id: input.usuario_id,
      placa: input.vehiculo.placa,
      municipio_destino: input.municipio_destino,
      departamento_destino: input.departamento_destino,
      kilometraje_inicial: input.kilometraje_inicial,
      justificacion: input.justificacion,
      estado: 'pendiente', 
    })
    .select('id').single();

  if (solError) throw new Error(solError.message);
  
  if (input.detalles.length > 0) {
    const comisionesToInsert = input.detalles.map((c) => ({
      solicitud_id: solicitudData.id,       
      fecha_inicio: convertToUTC(c.fecha_inicio),      
      fecha_fin: convertToUTC(c.fecha_fin),            
      lugar_visitar: c.lugar_visitar,    
      kilometros_recorrer: Number(c.kilometros_recorrer) 
    }));
    const { error: comError } = await supabase.from('datos_comision_combustible').insert(comisionesToInsert);
    if (comError) {
       await supabase.from('solicitud_combustible').delete().eq('id', solicitudData.id);
       throw new Error(comError.message);
    }
  }
  return { success: true, id: solicitudData.id };
};

// ==========================================
// 4. ELIMINAR SOLICITUD
// ==========================================
export const deleteSolicitud = async (id: number) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('solicitud_combustible')
    .delete()
    .eq('id', id)
    .select(); 

  if (error) {
    throw new Error(`Error al eliminar solicitud: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No tienes permisos para eliminar esta solicitud o ya no existe.");
  }

  await supabase
    .from('datos_comision_combustible')
    .delete()
    .eq('solicitud_id', id);

  return { success: true };
};

export const getMySolicitudes = async (): Promise<SolicitudCombustible[]> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('solicitud_combustible')
    .select(`
      id, created_at, placa, municipio_destino, departamento_destino,
      kilometraje_inicial, justificacion, estado, correlativo, solvente, 
      vehiculo:vehiculos ( placa, modelo, tipo_vehiculo, tipo_combustible ),
      detalles:datos_comision_combustible ( fecha_inicio, fecha_fin, lugar_visitar, kilometros_recorrer )
    `) 
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  
  return (data || []).map((item: any) => ({
    ...item,
    vehiculo: Array.isArray(item.vehiculo) ? item.vehiculo[0] : item.vehiculo,
    detalles: item.detalles || []
  }));
};

export const updateSolicitud = async (idSolicitud: number, payload: CreateSolicitudPayload) => {
  const supabase = await createClient();
  await supabase.from('vehiculos').upsert({
        placa: payload.vehiculo.placa,
        tipo_vehiculo: payload.vehiculo.tipo_vehiculo,
        modelo: payload.vehiculo.modelo,
        tipo_combustible: payload.vehiculo.tipo_combustible,
      }, { onConflict: 'placa' });

  const { error: errUpdate } = await supabase
    .from('solicitud_combustible')
    .update({
       municipio_destino: payload.municipio_destino,
       departamento_destino: payload.departamento_destino,
       kilometraje_inicial: payload.kilometraje_inicial,
       justificacion: payload.justificacion,
       placa: payload.vehiculo.placa 
    })
    .eq('id', idSolicitud);

  if (errUpdate) throw new Error(errUpdate.message);

  await supabase.from('datos_comision_combustible').delete().eq('solicitud_id', idSolicitud);

  if (payload.detalles.length > 0) {
      const detallesParaInsertar = payload.detalles.map((d) => ({
          solicitud_id: idSolicitud,
          lugar_visitar: d.lugar_visitar,
          kilometros_recorrer: Number(d.kilometros_recorrer),
          fecha_inicio: convertToUTC(d.fecha_inicio),
          fecha_fin: convertToUTC(d.fecha_fin)
      }));
      const { error: errInsert } = await supabase.from('datos_comision_combustible').insert(detallesParaInsertar);
      if (errInsert) throw new Error(errInsert.message);
  }
  return { success: true };
};

// ==========================================
// 5. OBTENER DATOS PARA IMPRESIÓN (PDF)
// ==========================================
export const getDatosSolicitudImpresion = async (id: number) => {
  const supabase = await createClient();

  // 1. Obtener la solicitud
  const { data: solicitud, error: solError } = await supabase
    .from('solicitud_combustible')
    .select(`
      *,
      vehiculo:vehiculos ( * ),
      detalles:datos_comision_combustible ( * )
    `)
    .eq('id', id)
    .single();

  if (solError || !solicitud) return null;

  // 2. Obtener información del solicitante (INCLUYENDO DPI)
  let nombreSolicitante = '---';
  let dpiSolicitante = ''; 
  let unidadDireccion = '---';

  if (solicitud.user_id) {
    const { data: usuario, error: userError } = await supabase
      .from('info_usuario')
      .select('nombre, dpi, dependencia_id')
      .eq('user_id', solicitud.user_id)
      .single();

    if (!userError && usuario) {
      nombreSolicitante = usuario.nombre;
      dpiSolicitante = usuario.dpi || ''; 
      
      if (usuario.dependencia_id) {
        const { data: dep } = await supabase
          .from('dependencias')
          .select(`nombre, padre:parent_id ( nombre )`)
          .eq('id', usuario.dependencia_id)
          .single();

        if (dep) {
          const nombreDep = dep.nombre;
          // Manejo seguro por si padre es array u objeto
          const padreObj = Array.isArray(dep.padre) ? dep.padre[0] : dep.padre;
          const nombrePadre = padreObj?.nombre;
          unidadDireccion = nombrePadre ? `${nombrePadre} / ${nombreDep}` : nombreDep;
        }
      }
    }
  }

  // 3. Obtener Cupones y ENCARGADO
  const { data: entregas } = await supabase
    .from('entrega_cupones')
    .select(`
      cantidad_entregada,
      correlativo_inicio,
      correlativo_fin,
      encargado, 
      detalle:detalle_contrato_id ( producto, denominacion ) 
    `) 
    .eq('solicitud_id', id);

  // Lógica Aprobador
  let nombreAprobador = ''; 
  if (entregas && entregas.length > 0) {
    const encargadoId = entregas[0].encargado; 
    if (encargadoId) {
      const { data: datosEncargado } = await supabase
        .from('info_usuario')
        .select('nombre')
        .eq('user_id', encargadoId)
        .single();
      
      if (datosEncargado?.nombre) {
        nombreAprobador = datosEncargado.nombre;
      }
    }
  }

  const itemsCupones = (entregas || []).map((e: any) => {
    const det = Array.isArray(e.detalle) ? e.detalle[0] : e.detalle;
    return {
      cantidad: e.cantidad_entregada,
      producto: det?.producto || '',
      denominacion: det?.denominacion || 0,
      inicio: e.correlativo_inicio,
      fin: e.correlativo_fin,
      subtotal: e.cantidad_entregada * (det?.denominacion || 0)
    };
  });

  const vehiculoData = Array.isArray(solicitud.vehiculo) ? solicitud.vehiculo[0] : solicitud.vehiculo;

  return {
    id: solicitud.id,
    created_at: solicitud.created_at,
    municipio_destino: solicitud.municipio_destino,
    departamento_destino: solicitud.departamento_destino,
    kilometraje_inicial: solicitud.kilometraje_inicial,
    justificacion: solicitud.justificacion,
    solicitante_nombre: nombreSolicitante,
    solicitante_dpi: dpiSolicitante,
    unidad_direccion: unidadDireccion,
    aprobador: nombreAprobador,
    correlativo: solicitud.correlativo, // <--- AQUI ESTÁ EL CAMBIO IMPORTANTE
    vehiculo: {
      tipo: vehiculoData?.tipo_vehiculo || '---',
      placa: vehiculoData?.placa || '---',
      modelo: vehiculoData?.modelo || '---',
      combustible: vehiculoData?.tipo_combustible || '---'
    },
    detalles: solicitud.detalles || [],
    cupones: itemsCupones
  };
};

// ==========================================
// 6. APROBAR SOLICITUD (GENERAR CORRELATIVO)
// ==========================================
export const approveSolicitud = async (id: number) => {
  const supabase = await createClient();

  const { data: currentSolicitud, error: fetchError } = await supabase
    .from('solicitud_combustible')
    .select('estado')
    .eq('id', id)
    .single();

  if (fetchError || !currentSolicitud) {
    throw new Error("No se encontró la solicitud.");
  }

  if (currentSolicitud.estado !== 'pendiente') {
    throw new Error(`No se puede aprobar. Estado actual: ${currentSolicitud.estado}`);
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

  const { error: updateError } = await supabase
    .from('solicitud_combustible')
    .update({ 
      estado: 'aprobado',
      correlativo: nuevoCorrelativo,
      solvente: false 
    })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Error al aprobar solicitud: ${updateError.message}`);
  }

  return { success: true, correlativo: nuevoCorrelativo };
};

// ==========================================
// NUEVO: FUNCIONES PARA LIQUIDACIÓN
// ==========================================

export const getSolicitudParaLiquidacion = async (id: number) => {
  const supabase = await createClient();

  const { data: solicitud, error } = await supabase
    .from('solicitud_combustible')
    .select(`
      id, created_at, kilometraje_inicial, municipio_destino, departamento_destino,
      placa, correlativo, estado, user_id, solvente,
      vehiculo:vehiculos ( modelo, tipo_vehiculo )
    `)
    .eq('id', id)
    .eq('estado', 'aprobado')
    .single();

  if (error || !solicitud) return null;

  let nombreUsuario = '---';
  let cargoUsuario = '---';  
  let unidadUsuario = '---'; 
  
  if (solicitud.user_id) {
    const { data: usr } = await supabase
        .from('info_usuario')
        .select('nombre, dependencia_id')
        .eq('user_id', solicitud.user_id)
        .single();
    
    if (usr) {
        nombreUsuario = usr.nombre;

        if (usr.dependencia_id) {
             const { data: dep } = await supabase
                .from('dependencias')
                .select(`
                    nombre, 
                    padre:parent_id ( nombre )
                `)
                .eq('id', usr.dependencia_id)
                .single();
             
             if(dep) {
                 cargoUsuario = dep.nombre;

                 const padreObj = Array.isArray(dep.padre) ? dep.padre[0] : dep.padre;
                 if (padreObj?.nombre) {
                     unidadUsuario = padreObj.nombre;
                 }
             }
        }
    }
  }

  return {
    ...solicitud,
    usuario: {
        nombre: nombreUsuario,
        cargo: cargoUsuario,
        unidad: unidadUsuario
    }
  };
};

// 2. Guardar la Liquidación
export const saveLiquidacion = async (payload: {
  id_solicitud: number;
  km_final: number;
  cupones_devueltos: number;
  fecha_comision: string;
}) => {
  const supabase = await createClient();

  // 1. PRIMERO VERIFICAMOS SI YA EXISTE
  const { data: existingRecord } = await supabase
    .from('liquidacion')
    .select('id')
    .eq('id_solicitud', payload.id_solicitud)
    .single();

  if (existingRecord) {
    // 2. SI EXISTE, ACTUALIZAMOS EN LUGAR DE DUPLICAR
    return await updateLiquidacion(existingRecord.id, {
        km_final: payload.km_final,
        cupones_devueltos: payload.cupones_devueltos, // Ahora sí lo aceptará
        fecha_comision: payload.fecha_comision
    });
  }

  // 3. SI NO EXISTE, INSERTAMOS
  const { error } = await supabase
    .from('liquidacion')
    .insert({
      id_solicitud: payload.id_solicitud,
      km_final: payload.km_final,
      cupones_devueltos: payload.cupones_devueltos,
      fecha_comision: payload.fecha_comision,
      estado_liquidacion: 'liquidado' 
    });

  if (error) throw new Error(error.message);
  return { success: true };
};
// ==========================================
// NUEVO: OBTENER LIQUIDACIÓN EXISTENTE
// ==========================================
export const getLiquidacionBySolicitudId = async (idSolicitud: number) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('liquidacion')
    .select('*')
    .eq('id_solicitud', idSolicitud)
    .single();

  if (error) return null;
  return data;
};

// ==========================================
// NUEVO: ACTUALIZAR LIQUIDACIÓN (EDICIÓN)
// ==========================================
export const updateLiquidacion = async (idLiquidacion: string, payload: {
  km_final: number;
  cupones_devueltos: number; 
  fecha_comision: string;
}) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from('liquidacion')
    .update({
      km_final: payload.km_final,
      cupones_devueltos: payload.cupones_devueltos, 
      fecha_comision: payload.fecha_comision
    })
    .eq('id', idLiquidacion);

  if (error) throw new Error(error.message);
  return { success: true };
};