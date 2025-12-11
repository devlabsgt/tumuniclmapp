'use client'

import { useEffect } from 'react'
import Swal from 'sweetalert2'

export default function NotificationListener() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHOW_SWAL') {
        const { title, text, url } = event.data.payload
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        const background = isDarkMode ? '#171717' : '#ffffff';
        const color = isDarkMode ? '#e5e7eb' : '#1f2937'; 

        Swal.fire({
          title: title || 'Notificación',
          text: text || '',
          imageUrl: '/images/logo-muni.png',
          imageWidth: 360,
          imageHeight: 'auto',
          imageAlt: 'Logo Municipalidad',
          confirmButtonText: 'Estoy enterado',
          confirmButtonColor: '#d97706',
          showCancelButton: !!url,
          cancelButtonText: 'Cerrar',
          backdrop: true,
          allowOutsideClick: false,
          background: background,
          color: color,
          customClass: {
            popup: isDarkMode ? 'dark:border dark:border-neutral-800' : '',
            confirmButton: 'font-medium',
            cancelButton: 'font-medium'
          }
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