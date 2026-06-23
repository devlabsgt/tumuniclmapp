self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Nueva Notificación'
  const message = data.body || ''
  const icon = '/icon-192x192.png'
  const path = data.data?.url || data.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const focusedClient = clientList.find((client) => client.focused)

      if (focusedClient) {
        return focusedClient.postMessage({
          type: 'NAVIGATE',
          url: path,
        })
      }

      return self.registration.showNotification(title, {
        body: message,
        icon: icon,
        badge: icon,
        data: {
          url: path,
          swal: data.data?.swal || null,
        },
      })
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/'
  const targetUrl = new URL(path, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        const client = windowClients[0]
        if ('focus' in client) {
          return client.focus().then((focusedClient) => {
            focusedClient.postMessage({
              type: 'NAVIGATE',
              url: path,
            })
          })
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
