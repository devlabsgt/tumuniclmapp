import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webPush from 'web-push'

const subject = process.env.NEXT_PUBLIC_VAPID_SUBJECT?.startsWith('mailto:')
  ? process.env.NEXT_PUBLIC_VAPID_SUBJECT
  : `mailto:${process.env.NEXT_PUBLIC_VAPID_SUBJECT}`

webPush.setVapidDetails(
  subject,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Usuario sin dispositivos' }, { status: 200 })
    }

    const notificationTitle = title || 'Notificación'
    const notificationBody = body || 'Tienes un nuevo mensaje'
    const targetUrl = url || '/'

    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: '/icon-192x192.png',
      data: {
        url: targetUrl,
        swal: {
          title: notificationTitle,
          text: notificationBody,
          icon: 'info'
        }
      }
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

    return NextResponse.json({ success: true, results }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}