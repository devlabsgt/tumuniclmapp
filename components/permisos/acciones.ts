'use server'

import { createClient } from '@/utils/supabase/server'
import { PermisoEmpleado } from './types'
import { revalidatePath } from 'next/cache'

export type PerfilUsuario = {
  id: string
  rol: string | null
  esJefe: boolean
  dependenciaId: string | null
}

// Función auxiliar para obtener rol (Reutilizada internamente)
async function getRolInterno(userId: string, supabase: any) {
  const { data } = await supabase
    .from('usuarios_roles')
    .select(`roles (nombre)`)
    .eq('user_id', userId)
  
  const rolesUsuario = data?.map((item: any) => item.roles?.nombre) || []
  const rolesPermitidos = ['RRHH', 'SECRETARIO', 'SUPER']
  return rolesUsuario.find((rol: string) => rolesPermitidos.includes(rol)) || null
}

export async function obtenerPerfilUsuario(): Promise<PerfilUsuario | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // 1. Obtener Rol
  const rolEncontrado = await getRolInterno(user.id, supabase)

  // 2. Obtener Info Usuario (Jefe y Dependencia)
  const { data: infoData } = await supabase
    .from('info_usuario')
    .select('esjefe, dependencia_id')
    .eq('user_id', user.id)
    .single()

  return {
    id: user.id,
    rol: rolEncontrado,
    esJefe: infoData?.esjefe || false,
    dependenciaId: infoData?.dependencia_id || null
  }
}

export async function obtenerRolUsuario() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return await getRolInterno(user.id, supabase)
}

export async function obtenerPermisos(mes: number, anio: number) {
  const supabase = await createClient()

  const fechaInicio = new Date(anio, mes - 1, 1).toISOString()
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString()

  const { data, error } = await supabase
    .from('permisos_empleado')
    .select('*')
    .gte('created_at', fechaInicio)
    .lte('created_at', fechaFin)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as PermisoEmpleado[]
}

export async function guardarPermiso(formData: FormData, id?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  // === SEGURIDAD DE EDICIÓN ===
  // Si hay ID (es una edición), verificamos que el usuario tenga rol administrativo
  if (id) {
    const rolActual = await getRolInterno(user.id, supabase)
    const esAdministrativo = ['SUPER', 'RRHH', 'SECRETARIO'].includes(rolActual || '')
    
    if (!esAdministrativo) {
      throw new Error('No tienes permisos para editar solicitudes existentes.')
    }
  }
  // ============================

  const tipo = formData.get('tipo') as string
  const inicio = formData.get('inicio') as string
  const fin = formData.get('fin') as string
  const estado = formData.get('estado') as string
  const userIdSeleccionado = formData.get('user_id') as string

  if (!userIdSeleccionado) throw new Error('El usuario es obligatorio')

  const datos: any = {
    tipo,
    inicio,
    fin,
    user_id: userIdSeleccionado 
  }

  if (estado) {
    datos.estado = estado
  }

  let error
  if (id) {
    const { error: updateError } = await supabase
      .from('permisos_empleado')
      .update({ tipo, inicio, fin, estado })
      .eq('id', id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('permisos_empleado')
      .insert(datos)
    error = insertError
  }

  if (error) throw new Error(error.message)
  
  revalidatePath('/permisos')
}

export async function eliminarPermiso(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('permisos_empleado')
        .delete()
        .eq('id', id)
    
    if (error) throw new Error(error.message)
    revalidatePath('/permisos')
}