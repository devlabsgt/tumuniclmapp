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
    const check = async () => {
      if ('serviceWorker' in navigator && userId) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          if (sub) setIsSubscribed(true)
        }
      }
    }
    check()
  }, [userId])

  const handleToggle = async () => {
    setLoading(true)
    try {
      alert("PASO 1: Inicio...")

      if (!('serviceWorker' in navigator)) {
        alert("ERROR: Sin soporte SW")
        return
      }

      // 1. REGISTRO EXPLÍCITO
      const reg = await navigator.serviceWorker.register('/sw.js')
      
      // 2. DIAGNÓSTICO DE ESTADO (Para ver dónde se atora)
      if (reg.installing) alert("ESTADO SW: Instalando...")
      else if (reg.waiting) alert("ESTADO SW: Esperando (Waiting)...")
      else if (reg.active) alert("ESTADO SW: Activo!")

      // 3. INTENTO DE FORZAR ESPERA (Con Timeout por si se cuelga)
      alert("PASO 3: Esperando activación (Máx 5 seg)...")
      
      const readyPromise = navigator.serviceWorker.ready
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout: El SW tardó mucho en activar")), 5000)
      )

      let activeReg: ServiceWorkerRegistration | any = null
      
      try {
        // Corremos una carrera: o se activa o da error a los 5 segundos
        activeReg = await Promise.race([readyPromise, timeoutPromise])
      } catch (e) {
        alert("ALERTA: Se agotó el tiempo de espera. Intentando usar el registro directo...")
        // Si falla el ready, usamos el 'reg' que nos dio el register() arriba
        activeReg = reg
      }
      
      if (!activeReg) throw new Error("No hay registro de SW utilizable")

      alert("PASO 4: Obteniendo PushManager...")

      if (isSubscribed) {
        // DESUSCRIBIR
        const sub = await activeReg.pushManager.getSubscription()
        if (sub) {
          const subJson = JSON.parse(JSON.stringify(sub))
          await supabase.from('push_subscriptions').delete().match({ user_id: userId }).contains('subscription', subJson)
          await sub.unsubscribe()
        }
        setIsSubscribed(false)
        alert("EXITO: Desactivado")

      } else {
        // SUSCRIBIR
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) throw new Error("Falta VAPID KEY")
        
        alert("PASO 5: Suscribiendo...")
        const sub = await activeReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })

        alert("PASO 6: Guardando...")
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          subscription: JSON.parse(JSON.stringify(sub)),
          device_agent: navigator.userAgent
        }, { onConflict: 'user_id, subscription' })

        if (error) throw error

        setIsSubscribed(true)
        alert("EXITO FINAL: Notificaciones Activadas 🔔")
      }

    } catch (error: any) {
      alert("ERROR: " + error.message)
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
          ? 'bg-yellow-50 border-yellow-200 text-yellow-700' 
          : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800'
      }`}
    >
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : isSubscribed ? <div className="relative"><Bell className="h-7 w-7 text-yellow-500 fill-yellow-500" /><div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white"><Check className="h-2.5 w-2.5 text-white stroke-[4]" /></div></div> : <BellOff className="h-7 w-7" />}
    </button>
  )
}