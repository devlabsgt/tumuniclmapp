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
            
            await fetch('/api/push/save-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userId,
                subscription: subscriptionJson,
                userAgent: navigator.userAgent
              })
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
    if (!userId) return
    setLoading(true)

    try {
      if (!('serviceWorker' in navigator)) return
      const registration = await navigator.serviceWorker.ready

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const subscriptionJson = JSON.parse(JSON.stringify(subscription))
          
          await fetch('/api/push/save-subscription', {
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              subscription: subscriptionJson,
            })
          })

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

        const response = await fetch('/api/push/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            subscription: subscriptionJson,
            userAgent: navigator.userAgent
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error al guardar via API:', errorData)
          throw new Error('API Save Failed')
        }

        setIsSubscribed(true)
      }
    } catch (error) {
      console.error(error)
      alert("Error crítico. Revisa la consola.")
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