import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webPush from 'web-push'

webPush.setVapidDetails(
  `mailto:${process.env.NEXT_PUBLIC_VAPID_SUBJECT}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { title, body, message } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No hay dispositivos registrados' }, { status: 200 })
    }

    const payload = JSON.stringify({
      title: title || '📢 Comunicado Oficial',
      body: body || message || 'Nueva notificación del sistema',
      url: '/',
      icon: '/icon-192x192.png'
    })

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(sub.subscription as webPush.PushSubscription, payload)
          return { status: 'fulfilled', id: sub.id }
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            return { status: 'rejected', id: sub.id, error: 'Eliminado por inactivo' }
          }
          return { status: 'rejected', id: sub.id, error: err.message }
        }
      })
    )

    return NextResponse.json({ success: true, total: subscriptions.length, results }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}