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

    if (!subscription) {
        return NextResponse.json({ error: 'Faltan datos de suscripcion' }, { status: 400 })
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

    return NextResponse.json({ success: true, message: 'Suscripcion guardada/actualizada' }, { status: 200 })

  } catch (error) {
    console.error('Excepcion al guardar:', error)
    return NextResponse.json({ error: 'Error interno de la API' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription, userId } = await request.json()

    if (user.id !== userId) {
        return NextResponse.json({ error: 'Unauthorized user ID' }, { status: 403 })
    }
    
    if (!subscription) {
        return NextResponse.json({ error: 'Missing subscription object' }, { status: 400 })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .match({ user_id: user.id })
      .contains('subscription', subscription)

    if (error) {
        console.error('Error al borrar suscripcion:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Suscripcion eliminada' }, { status: 200 })
  } catch (error) {
    console.error('Excepcion al borrar:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}