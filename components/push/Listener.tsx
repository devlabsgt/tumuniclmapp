'use client'

import { useEffect } from 'react'
import Swal from 'sweetalert2'

export default function NotificationListener() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHOW_SWAL') {
        const { title, text } = event.data.payload
        
        Swal.fire({
          title: title || 'Notificación',
          text: text || '',
          imageUrl: '/images/logo-muni.png',
          imageWidth: 360,
          imageHeight: 'auto',
          imageAlt: 'Logo Municipalidad',
          confirmButtonText: 'Estoy enterado de la información',
          confirmButtonColor: '#d97706',
          backdrop: true,
          allowOutsideClick: false
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