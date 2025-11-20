import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Usuario no tiene suscripciones activas' }, { status: 404 })
    }

    const payload = JSON.stringify({
      title: title || 'Nueva Notificación',
      body: body || 'Tienes un mensaje nuevo',
      url: url || '/',
    })

    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload)
          return { status: 'fulfilled', id: sub.id }
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            return { status: 'rejected', id: sub.id, reason: 'expired' }
          }
          return { status: 'rejected', id: sub.id, reason: err }
        }
      })
    )

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}