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
    const { userId, title, body, url } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Faltan parametros' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Usuario sin dispositivos' }, { status: 200 })
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
        return { success: true }
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { success: false }
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}