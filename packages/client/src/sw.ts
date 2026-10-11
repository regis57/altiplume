/**
 * Service worker d'Altiplume. Volontairement minuscule :
 *  - il reçoit les notifications « ton courrier est arrivé » et les affiche ;
 *  - un clic sur la notification ouvre (ou ramène) la page de l'aérodrome ;
 *  - il ne met rien en cache : le serveur fait autorité, et les bundles portent
 *    déjà leur empreinte. Un jeu en temps réel n'a rien à gagner à vivre hors ligne.
 */
/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

interface Payload { title?: string; body?: string; url?: string; tag?: string }

self.addEventListener('install', () => { void self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data: Payload;
  try { data = (event.data?.json() ?? {}) as Payload; } catch { data = {}; }
  const title = data.title ?? 'Altiplume';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body ?? '',
    tag: data.tag ?? 'altiplume',
    icon: '/icone-192.png',
    badge: '/icone-192.png',
    data: { url: data.url ?? '/aerodrome' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data as { url?: string } | undefined)?.url ?? '/aerodrome', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((w) => w.url.startsWith(self.location.origin));
    if (existing) { await existing.focus(); await existing.navigate(url); return; }
    await self.clients.openWindow(url);
  })());
});

// Si le service de push renouvelle l'abonnement, on prévient le serveur.
self.addEventListener('pushsubscriptionchange', (event) => {
  const e = event as ExtendableEvent & { newSubscription?: PushSubscription | null };
  const sub = e.newSubscription;
  if (!sub) return;
  e.waitUntil(fetch('/v1/push/subscriptions', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  }).then(() => undefined, () => undefined));
});
