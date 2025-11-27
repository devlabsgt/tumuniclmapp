import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado en el servidor' }, { status: 401 })
    }

    const { subscription, userAgent, userId } = await request.json()

    if (user.id !== userId) {
        return NextResponse.json({ error: 'ID de usuario no coincide con la sesion' }, { status: 403 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription,
        device_agent: userAgent
      }, {
        onConflict: 'user_id, subscription' 
      })

    if (error) {
      console.error('Error en Supabase al guardar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Excepción al guardar:', error)
    return NextResponse.json({ error: 'Error interno de la API' }, { status: 500 })
  }
}