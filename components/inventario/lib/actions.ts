'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { CrearInventarioFormValues, ItemInventario, TipoVistaInventario } from './schemas';

export const getInventarioActivo = async (
  estadoFiltro: string = 'Activo',
  tipoVista: TipoVistaInventario = 'general'
): Promise<ItemInventario[]> => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from('inventario').select('*').order('created_at', { ascending: false });
  if (estadoFiltro === 'Activo') {
    query = query.in('estado', ['Activo', 'Regular', 'Malo']);
  } else if (estadoFiltro === 'Inactivo') {
    query = query.in('estado', ['Inactivo', 'Baja']);
  }
  // Si es 'Todos', no filtramos por estado

  if (user) {
    if (tipoVista === 'general') {
      const { data: rolesData } = await supabase
        .from('usuarios_roles')
        .select(`roles (nombre)`)
        .eq('user_id', user.id);
      
      const rolesUsuario = rolesData?.map((item: any) => item.roles?.nombre) || [];
      const puedeVerGeneral = rolesUsuario.some((rol: string) => ['SUPER', 'SECRETARIO', 'DAFIM'].includes(rol));
      
      if (!puedeVerGeneral) {
        // Force fallback to 'propia' if they try to bypass
        query = query.eq('id_usuario', user.id);
      }
    } else if (tipoVista === 'propia') {
      query = query.eq('id_usuario', user.id);
    } else if (tipoVista === 'dependencia') {
      const { data: userData } = await supabase
        .from('info_usuario')
        .select('dependencia_id')
        .eq('user_id', user.id)
        .single();
      
      const { data: todasDeps } = await supabase
        .from('dependencias')
        .select('id, parent_id, jefe_id');

      const depIds = new Set<string>();
      if (userData?.dependencia_id) depIds.add(userData.dependencia_id);
      
      if (todasDeps) {
        const oficinasJefe = todasDeps.filter(d => d.jefe_id === user.id).map(d => d.id);
        oficinasJefe.forEach(id => {
          depIds.add(id);
          // Add immediate children
          todasDeps.filter(d => d.parent_id === id).forEach(child => depIds.add(child.id));
        });
      }

      const depIdsArray = Array.from(depIds);
      if (depIdsArray.length > 0) {
        const { data: usersInDeps } = await supabase
          .from('info_usuario')
          .select('user_id')
          .in('dependencia_id', depIdsArray);
        
        const userIdsArray = usersInDeps ? usersInDeps.map(u => u.user_id) : [];
        
        const orConditions = [];
        orConditions.push(`id_dependencia.in.(${depIdsArray.join(',')})`);
        if (userIdsArray.length > 0) {
          orConditions.push(`id_usuario.in.(${userIdsArray.join(',')})`);
        }
        
        query = query.or(orConditions.join(','));
      } else {
        query = query.eq('id_dependencia', 'invalid_dep_fallback');
      }
    }
  }

  const { data: invData, error: invError } = await query;

  if (invError) {
    console.error("Error fetching inventario:", invError);
    return [];
  }

  // Obtener dependencias y usuarios para hacer el "join" manual
  const { data: depData } = await supabase.from('dependencias').select('id, nombre, parent_id, es_puesto');
  const { data: userData } = await supabase.from('info_usuario').select('user_id, nombre, dependencia_id');

  const depMap = new Map((depData || []).map((d: any) => [d.id, d]));
  const userMap = new Map((userData || []).map((u: any) => [u.user_id, u]));

  const getDependenciaReal = (depId: string | null) => {
    if (!depId) return null;
    let curr = depMap.get(depId);
    while (curr && curr.es_puesto && curr.parent_id) {
      curr = depMap.get(curr.parent_id);
    }
    return curr ? { id: curr.id, nombre: curr.nombre } : null;
  };

  return (invData || []).map((item: any) => {
    const infoUsuario = item.id_usuario ? userMap.get(item.id_usuario) : null;
    const depDirecta = item.id_dependencia ? depMap.get(item.id_dependencia) : null;
    
    const startingDepId = infoUsuario ? infoUsuario.dependencia_id : (depDirecta ? depDirecta.id : null);
    const depReal = getDependenciaReal(startingDepId);

    return {
      ...item,
      info_usuario: infoUsuario ? { user_id: infoUsuario.user_id, nombre: infoUsuario.nombre } : null,
      dependencias: depDirecta ? { id: depDirecta.id, nombre: depDirecta.nombre } : null,
      dependencia_real: depReal
    };
  });
};

export const getDependenciasBasicas = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('dependencias').select('id, nombre, es_puesto').order('nombre');
  if (error) return [];
  return data;
};

export const getUsuariosBasicos = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('info_usuario').select('user_id, nombre').order('nombre');
  if (error) return [];
  return data;
};

export const crearBienInventario = async (payload: CrearInventarioFormValues) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
      return { success: false, error: "Usuario no autenticado." };
  }

  let idDependenciaFinal = payload.id_dependencia_asignada || null;

  if (payload.id_usuario_asignado) {
    const { data: userData } = await supabase
      .from('info_usuario')
      .select('dependencia_id')
      .eq('user_id', payload.id_usuario_asignado)
      .single();
    
    if (userData && userData.dependencia_id) {
      idDependenciaFinal = userData.dependencia_id;
    }
  }

  const { data: nuevoBien, error } = await supabase
    .from('inventario')
    .insert([
      {
        serie: payload.serie,
        descripcion: payload.descripcion,
        ctd: payload.ctd,
        valor: payload.valor,
        estado: payload.estado,
        imagen_url: payload.imagen_url,
        id_usuario: payload.id_usuario_asignado || null,
        id_dependencia: idDependenciaFinal,
      }
    ])
    .select('id')
    .single();

  if (error || !nuevoBien) {
    console.error("Error creating inventario:", error);
    return { success: false, error: error?.message || 'Error desconocido' };
  }

  // Insertar en historial_movimientos (Alta Inicial)
  await supabase
    .from('historial_movimientos')
    .insert([{
      id_inventario: nuevoBien.id,
      id_usuario_destino: payload.id_usuario_asignado || null,
      id_dependencia_destino: idDependenciaFinal,
      tipo_movimiento: 'Alta',
      cantidad_movida: payload.ctd,
      imagen_url: payload.imagen_url,
      observaciones: 'Alta Inicial',
    }]);

  revalidatePath('/inventario');
  return { success: true };
};

export const actualizarImagenInventarioAction = async (id: string, path: string | null) => {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado.");

  const { error } = await supabase
    .from('inventario')
    .update({ imagen_url: path })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/inventario');
  return { path };
};

export const getReporteJerarquicoInventario = async (
  estadoFiltro: string = 'Activo',
  tipoVista: TipoVistaInventario = 'general'
) => {
  const supabase = await createClient();

  // 1. Obtener todas las dependencias
  const { data: depsData, error: depsError } = await supabase
    .from('dependencias')
    .select('id, nombre, parent_id, es_puesto, no')
    .order('no');
  if (depsError) throw depsError;

  // 2. Obtener usuarios
  const { data: infosData, error: infosError } = await supabase
    .from('info_usuario')
    .select('user_id, nombre, dependencia_id, activo');
  if (infosError) throw infosError;

  // 3. Obtener inventario (siempre todo para el reporte jerárquico, así armamos los apartados 9 y 10)
  let invQuery = supabase
    .from('inventario')
    .select('id, serie, descripcion, ctd, valor, estado, id_usuario, id_dependencia, imagen_url');
  
  if (estadoFiltro === 'Activo') {
    invQuery = invQuery.in('estado', ['Activo', 'Regular', 'Malo']);
  } else if (estadoFiltro === 'Inactivo') {
    invQuery = invQuery.in('estado', ['Inactivo', 'Baja']);
  }
  // Si es 'Todos', no filtramos por estado

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    if (tipoVista === 'general') {
      const { data: rolesData } = await supabase
        .from('usuarios_roles')
        .select(`roles (nombre)`)
        .eq('user_id', user.id);
      
      const rolesUsuario = rolesData?.map((item: any) => item.roles?.nombre) || [];
      const puedeVerGeneral = rolesUsuario.some((rol: string) => ['SUPER', 'SECRETARIO', 'DAFIM'].includes(rol));
      
      if (!puedeVerGeneral) {
        // Force fallback to 'propia' if they try to bypass
        invQuery = invQuery.eq('id_usuario', user.id);
      }
    } else if (tipoVista === 'propia') {
      invQuery = invQuery.eq('id_usuario', user.id);
    } else if (tipoVista === 'dependencia') {
      const { data: userData } = await supabase
        .from('info_usuario')
        .select('dependencia_id')
        .eq('user_id', user.id)
        .single();
      
      const { data: todasDeps } = await supabase
        .from('dependencias')
        .select('id, parent_id, jefe_id');

      const depIds = new Set<string>();
      if (userData?.dependencia_id) depIds.add(userData.dependencia_id);
      
      if (todasDeps) {
        const oficinasJefe = todasDeps.filter(d => d.jefe_id === user.id).map(d => d.id);
        oficinasJefe.forEach(id => {
          depIds.add(id);
          // Add immediate children
          todasDeps.filter(d => d.parent_id === id).forEach(child => depIds.add(child.id));
        });
      }

      const depIdsArray = Array.from(depIds);
      if (depIdsArray.length > 0) {
        const { data: usersInDeps } = await supabase
          .from('info_usuario')
          .select('user_id')
          .in('dependencia_id', depIdsArray);
        
        const userIdsArray = usersInDeps ? usersInDeps.map(u => u.user_id) : [];
        
        const orConditions = [];
        orConditions.push(`id_dependencia.in.(${depIdsArray.join(',')})`);
        if (userIdsArray.length > 0) {
          orConditions.push(`id_usuario.in.(${userIdsArray.join(',')})`);
        }
        
        invQuery = invQuery.or(orConditions.join(','));
      } else {
        invQuery = invQuery.eq('id_dependencia', 'invalid_dep_fallback');
      }
    }
  }

  const { data: invData, error: invError } = await invQuery;
  
  if (invError) throw invError;

  // --- Lógica de armado ---
  const deps = depsData || [];
  const infos = infosData || [];
  const items = invData || [];

  type Nodo = {
    id: string;
    nombre: string;
    no: number;
    parent_id: string | null;
    es_puesto: boolean;
    children: Nodo[];
    empleados: { 
      user_id: string; 
      nombre: string; 
      cantidad: number;
      valor: number;
      bienes: any[];
    }[];
    bienesDirectos: any[];
    totalCantidad: number;
    totalValor: number;
  };

  const nodeMap = new Map<string, Nodo>();
  deps.forEach((d: any) => {
    nodeMap.set(d.id, {
      id: d.id,
      nombre: d.nombre,
      no: d.no ?? 0,
      parent_id: d.parent_id,
      es_puesto: !!d.es_puesto,
      children: [],
      empleados: [],
      bienesDirectos: [],
      totalCantidad: 0,
      totalValor: 0,
    });
  });

  const roots: Nodo[] = [];
  deps.forEach((d: any) => {
    const nodo = nodeMap.get(d.id)!;
    if (d.parent_id && nodeMap.has(d.parent_id)) {
      nodeMap.get(d.parent_id)!.children.push(nodo);
    } else {
      roots.push(nodo);
    }
  });

  // Asignar bienes a usuarios o dependencias
  const bienesPorUsuario = new Map<string, any[]>();
  const bienesPorDependencia = new Map<string, any[]>();

  // Map manually info_usuario and dependencias so DetalleInventarioModal knows assignment
  items.forEach((item: any) => {
    if (item.id_usuario) {
      const user = infos.find((i: any) => i.user_id === item.id_usuario);
      if (user) item.info_usuario = { user_id: user.user_id, nombre: user.nombre };
    }
    if (item.id_dependencia) {
      const dep = deps.find((d: any) => d.id === item.id_dependencia);
      if (dep) item.dependencias = { id: dep.id, nombre: dep.nombre };
    }
  });
  const bienesSinAsignarActivos: any[] = [];
  const bienesInactivos: any[] = [];

  items.forEach((item: any) => {
    const isActivo = ['Activo', 'Regular', 'Malo'].includes(item.estado);
    const isInactivo = ['Inactivo', 'Baja'].includes(item.estado);

    if (isInactivo) {
      bienesInactivos.push(item);
    } else if (isActivo) {
      if (item.id_usuario) {
        if (!bienesPorUsuario.has(item.id_usuario)) bienesPorUsuario.set(item.id_usuario, []);
        bienesPorUsuario.get(item.id_usuario)!.push(item);
      } else if (item.id_dependencia) {
        if (!bienesPorDependencia.has(item.id_dependencia)) bienesPorDependencia.set(item.id_dependencia, []);
        bienesPorDependencia.get(item.id_dependencia)!.push(item);
      } else {
        bienesSinAsignarActivos.push(item);
      }
    }
  });

  // Asignar usuarios a dependencias
  infos.forEach((info: any) => {
    const bienes = bienesPorUsuario.get(info.user_id) || [];
    // Ya no filtramos a los usuarios sin bienes para mostrar todo el organigrama

    const cantidad = bienes.reduce((acc, b) => acc + (b.ctd || 1), 0);
    const valor = bienes.reduce((acc, b) => acc + Number(b.valor || 0), 0);

    const empleadoObj = {
      user_id: info.user_id,
      nombre: info.nombre || 'Sin nombre',
      cantidad,
      valor,
      bienes
    };

    const nodo = info.dependencia_id ? nodeMap.get(info.dependencia_id) : null;
    if (nodo) {
      nodo.empleados.push(empleadoObj);
    }
  });

  // Asignar bienes directos a dependencias
  bienesPorDependencia.forEach((bienes, depId) => {
    const nodo = nodeMap.get(depId);
    if (nodo) {
      nodo.bienesDirectos = bienes;
    }
  });

  // Agregar los nuevos apartados (9 y 10)
  roots.push({
    id: 'root-sin-asignar',
    nombre: 'BIENES SIN ASIGNAR',
    no: 9,
    parent_id: null,
    es_puesto: false,
    children: [],
    empleados: [],
    bienesDirectos: bienesSinAsignarActivos,
    totalCantidad: 0,
    totalValor: 0,
  });

  roots.push({
    id: 'root-baja',
    nombre: 'BIENES DE BAJA',
    no: 10,
    parent_id: null,
    es_puesto: false,
    children: [],
    empleados: [],
    bienesDirectos: bienesInactivos,
    totalCantidad: 0,
    totalValor: 0,
  });

  // Calcular totales
  const computarTotal = (nodo: Nodo): { cant: number, val: number } => {
    let cant = nodo.empleados.reduce((acc, e) => acc + e.cantidad, 0);
    let val = nodo.empleados.reduce((acc, e) => acc + e.valor, 0);

    cant += nodo.bienesDirectos.reduce((acc, b) => acc + (b.ctd || 1), 0);
    val += nodo.bienesDirectos.reduce((acc, b) => acc + Number(b.valor || 0), 0);

    nodo.children.forEach((c) => {
      const hijos = computarTotal(c);
      cant += hijos.cant;
      val += hijos.val;
    });

    nodo.totalCantidad = cant;
    nodo.totalValor = val;
    return { cant, val };
  };
  roots.forEach(computarTotal);

  // Aplanar
  const filas: any[] = [];
  const recorrer = (nodo: Nodo, prefix: string, level: number, ruta: string[]) => {
    // Podamos las ramas vacías para que solo salgan dependencias con bienes asignados
    if (nodo.totalCantidad === 0) return;

    const rutaActual = [...ruta, nodo.nombre];
    const mostrarNumero = !nodo.es_puesto;

    if (nodo.es_puesto && nodo.empleados.length > 0) {
      // Puesto con empleado: solo la persona y su cargo, al mismo nivel, sin carpeta extra
      [...nodo.empleados]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        .forEach((e, i) => {
          filas.push({
            id: `emp-${e.user_id}`,
            prefix: '',
            level,
            tipo: 'empleado',
            nombre: e.nombre,
            nombrePuesto: nodo.nombre,
            cantidad: e.cantidad,
            valor: e.valor,
            esPuesto: false,
            branchPrefix: prefix,
            rutaDependencia: rutaActual.join(' › '),
            nombreDepartamento: nodo.es_puesto ? ruta[ruta.length - 1] || nodo.nombre : nodo.nombre,
            parentId: nodo.parent_id, // Atado al departamento superior
            userId: e.user_id,
            bienes: e.bienes,
          });

          // Agregar los bienes de este empleado como hijos
          e.bienes.forEach((b: any) => {
            filas.push({
              id: `bien-${b.id}`,
              prefix: '',
              level: level + 1,
              tipo: 'bien',
              nombre: b.descripcion,
              cantidad: b.ctd,
              valor: b.valor,
              esPuesto: false,
              branchPrefix: prefix,
              rutaDependencia: rutaActual.join(' › '),
              nombreDepartamento: nodo.es_puesto ? ruta[ruta.length - 1] || nodo.nombre : nodo.nombre,
              parentId: `emp-${e.user_id}`,
              serie: b.serie,
              estado: b.estado,
              imagen_url: b.imagen_url,
              info_usuario: b.info_usuario,
              dependencias: b.dependencias,
            });
          });
        });
    } else {
      // Es departamento o puesto vacío
      filas.push({
        id: nodo.id,
        prefix: mostrarNumero ? prefix : '',
        level,
        tipo: 'dependencia',
        nombre: nodo.nombre,
        cantidad: nodo.totalCantidad,
        valor: nodo.totalValor,
        esPuesto: nodo.es_puesto,
        branchPrefix: prefix,
        rutaDependencia: rutaActual.join(' › '),
        nombreDepartamento: nodo.es_puesto ? ruta[ruta.length - 1] || nodo.nombre : nodo.nombre,
        parentId: nodo.parent_id,
      });

      // Empleados dentro del departamento (si no es puesto)
      if (!nodo.es_puesto) {
        [...nodo.empleados]
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
          .forEach((e) => {
            filas.push({
              id: `emp-${e.user_id}`,
              prefix: '',
              level: level + 1,
              tipo: 'empleado',
              nombre: e.nombre,
              nombrePuesto: undefined,
              cantidad: e.cantidad,
              valor: e.valor,
              esPuesto: false,
              branchPrefix: prefix,
              rutaDependencia: rutaActual.join(' › '),
              nombreDepartamento: nodo.es_puesto ? ruta[ruta.length - 1] || nodo.nombre : nodo.nombre,
              parentId: nodo.id,
              userId: e.user_id,
              bienes: e.bienes,
            });

            // Agregar los bienes de este empleado como hijos
            e.bienes.forEach((b: any) => {
              filas.push({
                id: `bien-${b.id}`,
                prefix: '',
                level: level + 2,
                tipo: 'bien',
                nombre: b.descripcion,
                cantidad: b.ctd,
                valor: b.valor,
                esPuesto: false,
                branchPrefix: prefix,
                rutaDependencia: rutaActual.join(' › '),
                nombreDepartamento: nodo.es_puesto ? ruta[ruta.length - 1] || nodo.nombre : nodo.nombre,
                parentId: `emp-${e.user_id}`,
                serie: b.serie,
                estado: b.estado,
                imagen_url: b.imagen_url,
                info_usuario: b.info_usuario,
                dependencias: b.dependencias,
              });
            });
          });
      }
    }

    // Bienes directos del nodo (departamento o puesto vacío)
    // Si era un puesto con empleado, los bienes ya van en el empleado
    if (!nodo.es_puesto || nodo.empleados.length === 0) {
      nodo.bienesDirectos.forEach((b) => {
        filas.push({
          id: `bien-${b.id}`,
          prefix: '',
          level: level + 1,
          tipo: 'bien',
          nombre: b.descripcion,
          cantidad: b.ctd,
          valor: b.valor,
          esPuesto: false,
          branchPrefix: prefix,
          rutaDependencia: rutaActual.join(' › '),
          nombreDepartamento: nodo.es_puesto ? ruta[ruta.length - 1] || nodo.nombre : nodo.nombre,
          parentId: nodo.id,
          serie: b.serie,
          estado: b.estado,
          imagen_url: b.imagen_url,
          info_usuario: b.info_usuario,
          dependencias: b.dependencias,
        });
      });
    }

    nodo.children
      .sort((a, b) => (a.no || 0) - (b.no || 0))
      .forEach((c, idx) => {
        const childPrefix = prefix === '—' ? '—' : `${prefix}.${idx + 1}`;
        recorrer(c, childPrefix, level + 1, rutaActual);
      });
  };

  roots
    .sort((a, b) => (a.no || 0) - (b.no || 0))
    .forEach((r, idx) => {
      recorrer(r, `${idx + 1}`, 0, []);
    });

  return filas;
};

export const trasladarBien = async (
  idBien: string,
  nuevoIdUsuario: string | null,
  nuevoIdDependencia: string | null,
  imagenUrl: string | null,
  observaciones: string | null
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Usuario no autenticado' };

  // 1. Obtener bien actual para saber origen
  const { data: bienActual, error: errorFetch } = await supabase
    .from('inventario')
    .select('id_usuario, id_dependencia')
    .eq('id', idBien)
    .single();

  if (errorFetch || !bienActual) {
    return { success: false, error: 'Bien no encontrado' };
  }

  // 2. Resolver la dependencia destino si es un usuario
  let idDependenciaFinal = nuevoIdDependencia;

  if (nuevoIdUsuario) {
    const { data: userData } = await supabase
      .from('info_usuario')
      .select('dependencia_id')
      .eq('user_id', nuevoIdUsuario)
      .single();
    
    if (userData && userData.dependencia_id) {
      idDependenciaFinal = userData.dependencia_id;
    }
  }

  // 3. Insertar historial
  const { error: errorHistorial } = await supabase
    .from('historial_movimientos')
    .insert([{
      id_inventario: idBien,
      id_usuario_origen: bienActual.id_usuario,
      id_dependencia_origen: bienActual.id_dependencia,
      id_usuario_destino: nuevoIdUsuario,
      id_dependencia_destino: idDependenciaFinal,
      tipo_movimiento: 'Traslado',
      cantidad_movida: 1, // Por ahora 1, asumiendo items individuales
      imagen_url: imagenUrl,
      observaciones: observaciones,
    }]);

  if (errorHistorial) {
    console.error('Error insertando historial de traslado', errorHistorial);
    return { success: false, error: errorHistorial.message };
  }

  // 4. Actualizar inventario
  const updatePayload: any = {
    id_usuario: nuevoIdUsuario,
    id_dependencia: idDependenciaFinal,
  };
  if (imagenUrl) {
    updatePayload.imagen_url = imagenUrl;
  }

  const { error: errorUpdate } = await supabase
    .from('inventario')
    .update(updatePayload)
    .eq('id', idBien);

  if (errorUpdate) {
    console.error('Error actualizando bien en traslado', errorUpdate);
    return { success: false, error: errorUpdate.message };
  }

  revalidatePath('/inventario');
  return { success: true };
};

export const darBajaBien = async (
  idBien: string,
  imagenUrl: string | null,
  observaciones: string
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Usuario no autenticado' };

  // 1. Obtener bien actual
  const { data: bienActual, error: errorFetch } = await supabase
    .from('inventario')
    .select('id_usuario, id_dependencia')
    .eq('id', idBien)
    .single();

  if (errorFetch || !bienActual) {
    return { success: false, error: 'Bien no encontrado' };
  }

  // 2. Insertar historial
  const { error: errorHistorial } = await supabase
    .from('historial_movimientos')
    .insert([{
      id_inventario: idBien,
      id_usuario_origen: bienActual.id_usuario,
      id_dependencia_origen: bienActual.id_dependencia,
      tipo_movimiento: 'Baja',
      cantidad_movida: 1,
      imagen_url: imagenUrl,
      observaciones: observaciones,
    }]);

  if (errorHistorial) {
    console.error('Error insertando historial de baja', errorHistorial);
    return { success: false, error: errorHistorial.message };
  }

  // 3. Actualizar inventario
  const updatePayloadBaja: any = {
    estado: 'Inactivo',
  };
  if (imagenUrl) {
    updatePayloadBaja.imagen_url = imagenUrl;
  }

  const { error: errorUpdate } = await supabase
    .from('inventario')
    .update(updatePayloadBaja)
    .eq('id', idBien);

  if (errorUpdate) {
    console.error('Error dando de baja bien', errorUpdate);
    return { success: false, error: errorUpdate.message };
  }

  revalidatePath('/inventario');
  return { success: true };
};

export const editarBien = async (
  idBien: string,
  datos: {
    serie: string;
    descripcion: string;
    ctd: number;
    valor: number;
    estado: string;
    imagen_url?: string | null;
  }
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Usuario no autenticado' };

  const { error } = await supabase
    .from('inventario')
    .update({
      serie: datos.serie,
      descripcion: datos.descripcion,
      ctd: datos.ctd,
      valor: datos.valor,
      estado: datos.estado,
      imagen_url: datos.imagen_url,
    })
    .eq('id', idBien);

  if (error) {
    console.error('Error editando bien', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/inventario');
  return { success: true };
};

export const eliminarBien = async (idBien: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Usuario no autenticado' };

  // Eliminar el historial primero (si hay restricción de llave foránea)
  const { error: errorHistorial } = await supabase
    .from('historial_movimientos')
    .delete()
    .eq('id_inventario', idBien);

  if (errorHistorial) {
    console.error('Error eliminando historial del bien', errorHistorial);
    // Continuamos aunque falle, porque a veces onDelete="CASCADE" lo hace automáticamente
  }

  // Eliminar el bien
  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', idBien);

  if (error) {
    console.error('Error eliminando bien', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/inventario');
  return { success: true };
};

export const getHistorialBien = async (idBien: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // Obtener movimientos
  const { data: movimientos, error } = await supabase
    .from('historial_movimientos')
    .select('*')
    .eq('id_inventario', idBien)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching historial', error);
    throw new Error('Error al obtener el historial');
  }

  if (!movimientos || movimientos.length === 0) return [];

  // Obtener diccionarios de usuarios y dependencias para mapear los nombres
  const { data: usuarios } = await supabase.from('info_usuario').select('user_id, nombre');
  const { data: dependencias } = await supabase.from('dependencias').select('id, nombre');

  const mapUsuarios = new Map(usuarios?.map(u => [u.user_id, u.nombre]) || []);
  const mapDependencias = new Map(dependencias?.map(d => [d.id, d.nombre]) || []);

  return movimientos.map(m => ({
    ...m,
    nombre_usuario_origen: m.id_usuario_origen ? mapUsuarios.get(m.id_usuario_origen) : null,
    nombre_dependencia_origen: m.id_dependencia_origen ? mapDependencias.get(m.id_dependencia_origen) : null,
    nombre_usuario_destino: m.id_usuario_destino ? mapUsuarios.get(m.id_usuario_destino) : null,
    nombre_dependencia_destino: m.id_dependencia_destino ? mapDependencias.get(m.id_dependencia_destino) : null,
  }));
};
