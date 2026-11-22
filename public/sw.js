// Service Worker for Resources Portal: PWA Installability, Daily Study Streak Reminders & Android Integration
const CACHE_NAME = "rp-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/favicon.svg",
  "/favicon-32x32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/site.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Required by Chromium/Chrome for PWA "Install app" & "Add to Home screen" eligibility
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Bypasses APIs to always fetch live streak and progress data
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const indexCached = await caches.match("/");
        if (indexCached) return indexCached;
      }
      return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
    })
  );
});

// Handle notification click on Android device
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(c => c.navigate(urlToOpen));
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle scheduled reminder messages from frontend client
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SCHEDULE_REMINDER") {
    const { title, body, delayMs, url, tag } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/favicon-32x32.png",
        tag: tag || "study-reminder",
        renotify: true,
        data: { url: url || "/" },
        actions: [
          { action: "study", title: "Study Now" },
          { action: "dismiss", title: "Dismiss" }
        ]
      });
    }, delayMs || 1000);
  }
});
