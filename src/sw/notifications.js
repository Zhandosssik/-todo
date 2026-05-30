self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🎯 GoalAlarm', {
      body: data.body || 'Время двигаться к цели!',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200],
      tag: 'goalnotif',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/');
    })
  );
});
