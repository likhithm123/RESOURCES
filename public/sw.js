// Service Worker for Resources Portal: Daily Study Streak Reminders & Android Integration
const CACHE_NAME = "rp-cache-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
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
