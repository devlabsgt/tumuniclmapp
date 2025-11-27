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
    const syncSubscription = async () => {
      if ('serviceWorker' in navigator && userId) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js')
          await reg.update()

          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()

          if (subscription) {
            setIsSubscribed(true)
            
            const subscriptionJson = JSON.parse(JSON.stringify(subscription))
            
            // Intenta guardar, si falla, es un error de red o de cliente
            await supabase.from('push_subscriptions').upsert({
              user_id: userId,
              subscription: subscriptionJson,
              device_agent: navigator.userAgent
            }, { 
              onConflict: 'user_id, subscription' 
            })
          }
        } catch (err) {
          console.error(err)
        }
      }
    }

    syncSubscription()
  }, [userId])

  const handleToggle = async () => {
    if (!userId) {
        alert("Error: ID de usuario no disponible.")
        return
    }
    setLoading(true)

    try {
      if (!('serviceWorker' in navigator)) return
      const registration = await navigator.serviceWorker.ready

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const subscriptionJson = JSON.parse(JSON.stringify(subscription))
          
          const { error } = await supabase.from('push_subscriptions')
            .delete()
            .match({ user_id: userId })
            .contains('subscription', subscriptionJson)
            
          if (error) throw new Error(error.message)

          await subscription.unsubscribe()
          setIsSubscribed(false)
        }
      } else {
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          )
        })

        const subscriptionJson = JSON.parse(JSON.stringify(sub))

        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: subscriptionJson,
          device_agent: navigator.userAgent
        }, { onConflict: 'user_id, subscription' })

        if (error) throw new Error(error.message)

        setIsSubscribed(true)
      }
    } catch (error: any) {
      console.error(error)
      alert(`Fallo Crítico de Conexión. Error: ${error.message || error.toString()}. Verifique la URL de Supabase y el estado de la red.`)
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