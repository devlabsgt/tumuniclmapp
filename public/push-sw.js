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
      swal: data.data?.swal || null,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

function navegarCliente(client, path) {
  return client.focus().then((focusedClient) => {
    focusedClient.postMessage({
      type: 'NAVIGATE',
      url: path,
    })
    return focusedClient
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const notificationData = event.notification.data || {}
  const path = notificationData.url || '/'
  const targetUrl = new URL(path, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        return navegarCliente(windowClients[0], path)
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
