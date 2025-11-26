import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import webPush from 'web-push'

webPush.setVapidDetails(
  `mailto:${process.env.NEXT_PUBLIC_VAPID_SUBJECT}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Faltan parametros' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Usuario sin dispositivos registrados' }, { status: 200 })
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192x192.png'
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub.subscription as webPush.PushSubscription, payload)
        return { success: true, id: sub.id }
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          return { success: false, id: sub.id, status: 'deleted' }
        }
        return { success: false, id: sub.id, error: err }
      }
    })

    const results = await Promise.all(sendPromises)

    return NextResponse.json({ success: true, results }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}