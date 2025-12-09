self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Nueva Notificación'
  const message = data.body || ''
  const icon = '/icon-192x192.png'
  const url = data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const focusedClient = clientList.find((client) => client.focused)

      if (focusedClient) {
        return focusedClient.postMessage({
          type: 'SHOW_SWAL',
          payload: {
            title: title,
            text: message,
            url: url
          }
        })
      }

      return self.registration.showNotification(title, {
        body: message,
        icon: icon,
        badge: icon,
        data: { url: url }
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if ('focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})