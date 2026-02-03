'use server'

import { createClient } from '@/utils/supabase/server';
import { UsuarioInfo, Vehiculo, DetalleComision, SolicitudCombustible } from './types';

interface CreateSolicitudPayload {
  usuario_id: string;
  vehiculo: Vehiculo;
  es_nuevo_vehiculo: boolean;
  municipio_destino: string;
  departamento_destino: string;
  kilometraje_inicial: number;
  justificacion: string;
  detalles: DetalleComision[];
}

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

  // 1. Borrar cabecera
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

  // 2. Limpieza manual de detalles
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
      kilometraje_inicial, justificacion, estado,
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
  let dpiSolicitante = ''; // Variable para el DPI
  let unidadDireccion = '---';

  if (solicitud.user_id) {
    const { data: usuario, error: userError } = await supabase
      .from('info_usuario')
      // AQUI AGREGAMOS "dpi" AL SELECT
      .select('nombre, dpi, dependencia_id')
      .eq('user_id', solicitud.user_id)
      .single();

    if (!userError && usuario) {
      nombreSolicitante = usuario.nombre;
      dpiSolicitante = usuario.dpi || ''; // Guardamos el DPI
      
      if (usuario.dependencia_id) {
        const { data: dep } = await supabase
          .from('dependencias')
          .select(`nombre, padre:parent_id ( nombre )`)
          .eq('id', usuario.dependencia_id)
          .single();

        if (dep) {
          const nombreDep = dep.nombre;
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
    solicitante_dpi: dpiSolicitante, // <--- Retornamos el DPI
    unidad_direccion: unidadDireccion,
    aprobador: nombreAprobador,
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