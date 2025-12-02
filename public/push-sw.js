self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    console.error(e)
  }

  const title = data.title || 'Nueva Notificación'
  
  const options = {
    body: data.body || 'Tienes un nuevo mensaje',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: data.data?.url || '/',
      swal: data.data?.swal || null
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const notificationData = event.notification.data
  const urlToOpen = notificationData.url

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const client = windowClients.find((c) => c.url === urlToOpen && 'focus' in c)
      
      if (client) {
        return client.focus().then((focusedClient) => {
          if (notificationData.swal) {
            focusedClient.postMessage({
              type: 'SHOW_SWAL',
              payload: notificationData.swal
            })
          }
        })
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).then((newClient) => {
          if (newClient && notificationData.swal) {
            setTimeout(() => {
              newClient.postMessage({
                type: 'SHOW_SWAL',
                payload: notificationData.swal
              })
            }, 1000)
          }
        })
      }
    })
  )
})