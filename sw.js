/* SEEK NETWORK — Service Worker mínimo para Web Push.
   Só cuida de exibir a notificação recebida e abrir o app ao clicar.
   Registro/assinatura ficam em index.html (registerPushDevice). O envio
   real (que preenche o evento 'push' abaixo) só existe depois que a Edge
   Function 'send-push' estiver implantada no Supabase — até lá, este
   arquivo já pode ficar publicado sem efeito nenhum. */

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'SEEK Network', body: event.data ? event.data.text() : '' }; }
  const title = payload.title || 'SEEK Network';
  const options = {
    body: payload.body || '',
    icon: payload.icon || 'icone-app-180.png',
    badge: 'icone-app-180.png',
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
