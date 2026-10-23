// Lightweight PWA service worker, no caching (always use latest Boss data).
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
