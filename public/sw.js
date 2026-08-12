// Service Worker for Desafoga Web Push Notifications
// Version bumped on each deploy to force cache invalidation
const SW_VERSION = '2026-08-12-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting() // Force immediate activation
})

self.addEventListener('activate', (event) => {
  // Claim all clients and clear any old caches immediately
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

// Listen for incoming Push Notifications from backend
self.addEventListener('push', (event) => {
  let data = {
    title: '📌 Desafoga: Lembrete de Vencimento',
    body: 'Uma de suas faturas/contas vence amanhã! Toque para visualizar.',
    url: '/plano',
    tag: 'desafoga-vencimento'
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || '/plano' },
    tag: data.tag || 'desafoga-notification',
    renotify: true,
    actions: [
      { action: 'open', title: '💳 Ver Fatura' },
      { action: 'close', title: 'Fechar' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler -> Open or focus Desafoga App
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const targetUrl = event.notification.data?.url || '/plano'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
