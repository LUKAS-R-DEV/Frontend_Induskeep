// Service Worker para Web Push Notifications
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push notification received.');

  let notificationData = {
    title: 'Notificação',
    body: 'Você tem uma nova notificação.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: '/notificacoes'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || notificationData.data,
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false,
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notificacoes';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Verifica se já existe uma janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existe, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed.');
});


