'use client'

import { useEffect } from 'react'
import Swal from 'sweetalert2'

export default function NotificationListener() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHOW_SWAL') {
        const { title, text, url } = event.data.payload
        
        Swal.fire({
          title: title || 'Notificación',
          text: text || '',
          imageUrl: '/images/logo-muni.png',
          imageWidth: 360,
          imageHeight: 'auto',
          imageAlt: 'Logo Municipalidad',
          confirmButtonText: url ? 'Ir a ver' : 'Entendido',
          confirmButtonColor: '#d97706',
          showCancelButton: !!url,
          cancelButtonText: 'Cerrar',
          backdrop: true,
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed && url) {
            window.location.href = url
          }
        })
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  return null
}