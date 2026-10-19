// Service worker de la web app : affiche les notifications Web Push envoyées par le serveur.
// Le `tag` remplace la notif précédente du même chat (seule la dernière reste affichée).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || 'Paws Peace', {
        body: data.body,
        tag: data.tag,
        renotify: true,
        icon: '/icon-192.png',
        badge: '/badge-96.png',
        data,
      });
      // app ouverte : lui dire de rafraîchir l'état des chats
      const windows = await self.clients.matchAll({ type: 'window' });
      windows.forEach((w) => w.postMessage({ type: 'push', data }));
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (windows.length) return windows[0].focus();
      return self.clients.openWindow('/');
    })()
  );
});
