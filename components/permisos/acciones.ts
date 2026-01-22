'use server'

import { createClient } from '@/utils/supabase/server'
import { PermisoEmpleado, EstadoPermiso } from './types'
import { revalidatePath } from 'next/cache'

export type OficinaInfo = { id: string; nombre: string }
export type PerfilUsuario = { id: string; nombre: string; rol: string | null; esJefe: boolean; dependenciaId: string | null; oficinasACargo: OficinaInfo[] }

async function getRolInterno(userId: string, supabase: any) {
  const { data } = await supabase.from('usuarios_roles').select(`roles (nombre)`).eq('user_id', userId)
  const rolesUsuario = data?.map((item: any) => item.roles?.nombre) || []
  const rolesPermitidos = ['RRHH', 'SECRETARIO', 'SUPER']
  return rolesUsuario.find((rol: string) => rolesPermitidos.includes(rol)) || null
}

export async function obtenerPerfilUsuario(): Promise<PerfilUsuario | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const rolEncontrado = await getRolInterno(user.id, supabase)
  const { data: infoData } = await supabase.from('info_usuario').select('nombre, esjefe, dependencia_id').eq('user_id', user.id).single()
  const { data: dependenciasJefe } = await supabase.from('dependencias').select('id, nombre').eq('jefe_id', user.id)
  const oficinasACargo = dependenciasJefe?.map((d: any) => ({ id: d.id, nombre: d.nombre })) || []
  return { id: user.id, nombre: infoData?.nombre || 'Usuario', rol: rolEncontrado, esJefe: infoData?.esjefe || oficinasACargo.length > 0, dependenciaId: infoData?.dependencia_id || null, oficinasACargo }
}

export async function obtenerPermisos(mes: number, anio: number) {
  const supabase = await createClient()
  const fechaInicio = new Date(anio, mes - 1, 1).toISOString()
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString()
  const { data, error } = await supabase.from('permisos_empleado').select('*').gte('created_at', fechaInicio).lte('created_at', fechaFin).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as unknown as PermisoEmpleado[]
}

export async function gestionarPermiso(permisoId: string, accion: 'aprobar' | 'rechazar', idEmpleado: string) {
    const supabase = await createClient()
    const perfil = await obtenerPerfilUsuario()
    if (!perfil) throw new Error('No autorizado')

    const { data: permisoActual, error } = await supabase.from('permisos_empleado').select('estado').eq('id', permisoId).single()
    if (error || !permisoActual) throw new Error('Permiso no encontrado')

    // Validar Jefatura (Super permisivo para pruebas)
    const { data: infoEmpleado } = await supabase.from('info_usuario').select('dependencia_id, oficina_nombre').eq('user_id', idEmpleado).single()
    const depIdEmpleado = infoEmpleado?.dependencia_id
    const depNombreEmpleado = infoEmpleado?.oficina_nombre?.toLowerCase().trim()
    const idsOficinasJefe = perfil.oficinasACargo.map(o => String(o.id))
    const nombresOficinasJefe = perfil.oficinasACargo.map(o => o.nombre.toLowerCase().trim())
    
    // Soy jefe si coinciden IDs, Nombres O si soy SUPER
    const soySuJefe = (depIdEmpleado && idsOficinasJefe.includes(String(depIdEmpleado))) || 
                      (depNombreEmpleado && nombresOficinasJefe.includes(depNombreEmpleado)) ||
                      perfil.rol === 'SUPER'
    
    const soyRRHH = ['RRHH', 'SUPER', 'SECRETARIO'].includes(perfil.rol || '')

    let nuevoEstado: EstadoPermiso | null = null

    if (accion === 'rechazar') {
        if (soyRRHH && permisoActual.estado === 'aprobado_jefe') nuevoEstado = 'rechazado_rrhh'
        else if (soySuJefe && permisoActual.estado === 'pendiente') nuevoEstado = 'rechazado_jefe'
        else if (soyRRHH) nuevoEstado = 'rechazado_rrhh'
        else throw new Error('No tienes permiso para rechazar.')
    } 
    else if (accion === 'aprobar') {
        if (permisoActual.estado === 'pendiente') {
            if (soySuJefe || (soyRRHH && perfil.esJefe)) {
                nuevoEstado = 'aprobado_jefe'
            } else {
                throw new Error('Debe ser aprobado por jefatura primero.')
            }
        } 
        else if (permisoActual.estado === 'aprobado_jefe') {
            if (soyRRHH) {
                nuevoEstado = 'aprobado'
            } else {
                throw new Error('Esperando aprobación de RRHH.')
            }
        }
    }

    if (nuevoEstado) {
        await supabase.from('permisos_empleado').update({ estado: nuevoEstado }).eq('id', permisoId)
        revalidatePath('/protected/permisos')
        return true
    }
    return false
}

// === AQUÍ ESTÁ LA CORRECCIÓN ===
export async function guardarPermiso(formData: FormData, id?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  // Obtenemos rol y si es jefe
  const rolActual = await getRolInterno(user.id, supabase)
  const { data: infoUser } = await supabase.from('info_usuario').select('esjefe').eq('user_id', user.id).single()
  const esJefe = infoUser?.esjefe || false
  const esAdmin = ['SUPER', 'RRHH', 'SECRETARIO'].includes(rolActual || '')

  const tipo = formData.get('tipo') as string
  const inicio = formData.get('inicio') as string
  const fin = formData.get('fin') as string
  // CAPTURAMOS LA DESCRIPCIÓN
  const descripcion = formData.get('descripcion') as string
  const userIdSeleccionado = formData.get('user_id') as string
  const remunerado = formData.get('remunerado') === 'on'
  
  const datos: any = { 
    tipo, inicio, fin, descripcion, // AGREGAMOS DESCRIPCIÓN AL OBJETO
    user_id: userIdSeleccionado 
  }

  // RRHH puede definir remunerado en edición (si aplica)
  if (esAdmin) { datos.remunerado = remunerado }

  if (!id) {
      // --- LÓGICA DE AUTO-APROBACIÓN ---
      // 1. Si soy Jefe y el permiso es para mí mismo -> Aprobado por Jefe automáticamente
      if (esJefe && userIdSeleccionado === user.id) {
          datos.estado = 'aprobado_jefe'
      }
      // 2. Si soy RRHH creando para otro -> Nace Pendiente (flujo normal) o lo que defina el admin
      else {
         datos.estado = 'pendiente' 
      }
  } 

  if (id) { 
      // Si es actualización
      await supabase.from('permisos_empleado').update(datos).eq('id', id) 
  } else { 
      // Si es nuevo
      await supabase.from('permisos_empleado').insert(datos) 
  }
  revalidatePath('/protected/permisos')
}

export async function eliminarPermiso(id: string) {
    const supabase = await createClient()
    await supabase.from('permisos_empleado').delete().eq('id', id)
    revalidatePath('/protected/permisos')
}