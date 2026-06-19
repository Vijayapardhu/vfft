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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "VFFT";
  self.registration.showNotification(title, {
    body: payload.notification?.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/notifications";
  event.waitUntil(self.clients.openWindow(href));
});
