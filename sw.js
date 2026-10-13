// PWA install and notification display. FCM background push is NOT configured yet.
const CACHE='lineagew-pwa-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'])));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.openWindow('./'))});
