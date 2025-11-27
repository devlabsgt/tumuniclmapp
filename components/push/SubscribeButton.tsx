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
    const sync = async () => {
      if ('serviceWorker' in navigator && userId) {
        try {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg) {
            const sub = await reg.pushManager.getSubscription()
            if (sub) setIsSubscribed(true)
          }
        } catch (e) {}
      }
    }
    sync()
  }, [userId])

  const handleToggle = async () => {
    setLoading(true)
    try {
      alert("PASO 1: Iniciando...")

      if (!('serviceWorker' in navigator)) {
        alert("ERROR: Navegador no soporta SW")
        return
      }

      alert("PASO 2: Buscando registro existente...")
      
      let registration = await navigator.serviceWorker.getRegistration()

      if (!registration) {
        alert("PASO 2.5: No existe. Registrando /sw.js ...")
        await navigator.serviceWorker.register('/sw.js')
      }

      alert("PASO 3: Esperando activación (Ready)...")
      
      registration = await navigator.serviceWorker.ready
      
      if (!registration) {
        throw new Error("No se pudo obtener el Service Worker activo.")
      }
      
      alert("PASO 4: SW Activo. Verificando estado...")

      if (isSubscribed) {
        alert("PASO 5A: Desuscribiendo...")
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
        alert("EXITO: Desuscrito correctamente")
      } else {
        alert("PASO 5B: Suscribiendo...")
        
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) throw new Error("Falta la VAPID KEY")
        
        const convertedKey = urlBase64ToUint8Array(vapidKey)
        
        alert("PASO 6: Solicitando permiso PushManager...")
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        })
        
        alert("PASO 7: Guardando en Supabase...")

        const subscriptionJson = JSON.parse(JSON.stringify(sub))

        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: subscriptionJson,
          device_agent: navigator.userAgent
        }, { onConflict: 'user_id, subscription' })

        if (error) {
           alert("ERROR SUPABASE: " + error.message)
           throw error
        }

        setIsSubscribed(true)
        alert("EXITO FINAL: Guardado")
      }
    } catch (error: any) {
      alert("ERROR FATAL: " + (error.message || error.toString()))
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