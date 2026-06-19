/* Firebase Cloud Messaging service worker — handles background web push.
   Firebase web config is public by design. Keep in sync with .env.local. */
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCKTIwMyYKumjXN1go7M84d2sRB15-1iHQ",
  authDomain: "vff-tournament.firebaseapp.com",
  projectId: "vff-tournament",
  storageBucket: "vff-tournament.firebasestorage.app",
  messagingSenderId: "825006049882",
  appId: "1:825006049882:web:4be465c386ce6fe2aee663",
});

const messaging = firebase.messaging();

// We send DATA-ONLY messages (see src/server/notify.ts), so onBackgroundMessage
// is the ONLY thing that displays the push — exactly once, no duplicates.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const title = d.title || "VFFT";
  const options = {
    body: d.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: d.tag || undefined, // collapse same-tag notifications
    data: { href: d.href || "/" },
  };
  if (d.image) options.image = d.image;
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(href);
          return client.focus();
        }
      }
      return self.clients.openWindow(href);
    }),
  );
});
