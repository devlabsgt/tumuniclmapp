'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { urlBase64ToUint8Array } from '@/app/utils/vapid'
import { Bell, BellOff, Loader2, Check } from 'lucide-react'

export default function SubscribeButton({ userId }: { userId: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkStatus = async () => {
      if ('serviceWorker' in navigator && userId) {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg) {
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
              const subJson = JSON.parse(JSON.stringify(sub))
              
              const { data } = await supabase
                .from('push_subscriptions')
                .select('id')
                .match({ user_id: userId })
                .contains('subscription', subJson)
                .maybeSingle()

              if (data) {
                setIsSubscribed(true)
              } else {
                await sub.unsubscribe()
                setIsSubscribed(false)
              }
            }
          }
        } catch (e) {}
      }
    }
    checkStatus()
  }, [userId])

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (!('serviceWorker' in navigator)) return

      const reg = await navigator.serviceWorker.register('/push-sw.js')
      await reg.update()
      
      const registration = await navigator.serviceWorker.ready

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const subscriptionJson = JSON.parse(JSON.stringify(subscription))
          
          await supabase.from('push_subscriptions')
            .delete()
            .match({ user_id: userId })
            .contains('subscription', subscriptionJson)

          await subscription.unsubscribe()
        }
        setIsSubscribed(false)
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) throw new Error()
        
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })

        const subscriptionJson = JSON.parse(JSON.stringify(sub))

        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: subscriptionJson,
          device_agent: navigator.userAgent
        }, { onConflict: 'user_id, subscription' })

        if (error) throw error

        setIsSubscribed(true)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`h-14 w-full flex items-center justify-center rounded-md border transition-all duration-200 ${
        isSubscribed 
          ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700' 
          : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
      }`}
      title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
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