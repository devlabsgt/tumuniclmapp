'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { urlBase64ToUint8Array } from '@/app/utils/vapid'
import { Bell, BellOff, Check, Loader2 } from 'lucide-react'

export default function SubscribeButton({ userId }: { userId: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => reg.update())
        .catch(() => {})

      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) setIsSubscribed(true)
        })
      })
    }
  }, [])

  const subscribe = async () => {
    if (!userId) return

    setLoading(true)

    try {
      if (!('serviceWorker' in navigator)) return

      const registration = await navigator.serviceWorker.ready

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        )
      })

      const subscriptionJson = JSON.parse(JSON.stringify(sub))

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        subscription: subscriptionJson
      }, { onConflict: 'user_id' })

      if (error) throw error

      setIsSubscribed(true)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading || isSubscribed}
      className={`h-14 w-full flex items-center justify-center rounded-md border transition-all duration-200 ${
        isSubscribed 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-gray-100 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700'
      }`}
      title={isSubscribed ? 'Notificaciones activadas' : 'Activar notificaciones'}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      ) : isSubscribed ? (
        <div className="relative">
          <Bell className="h-7 w-7 text-yellow-500 fill-yellow-500" />
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
            <Check className="h-2.5 w-2.5 text-white stroke-[4]" />
          </div>
        </div>
      ) : (
        <BellOff className="h-7 w-7 text-gray-400" />
      )}
    </button>
  )
}