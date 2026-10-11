/**
 * « Ton courrier est arrivé » : la notification à l'atterrissage, et l'installation
 * sur l'écran d'accueil.
 *
 * Tout est à l'initiative de la personne : rien n'est demandé au chargement. Le
 * bouton cloche demande la permission, enregistre le service worker, s'abonne, et
 * confie l'abonnement au serveur. Un second clic retire tout.
 */
import { t } from './i18n.ts';

type Json = Record<string, unknown>;
type Api = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: Json) => Promise<{ status: number; body: Json }>;
type SetMessage = (id: string, keys: string | string[], kind?: 'ok' | 'error') => void;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function isIosSafariOutsideApp(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

/** Le bouton cloche de l'aérodrome. */
export async function setupNotifications(api: Api, setMessage: SetMessage): Promise<void> {
  const button = document.querySelector<HTMLButtonElement>('[data-action=toggle-push]');
  const hint = document.getElementById('push-aide');
  if (!button || button.dataset['ready']) return;
  button.dataset['ready'] = '1';

  const key = await api('GET', '/v1/push/key');
  if (key.status !== 200) return; // non configuré côté serveur : le bouton n'existe pas

  // iPhone hors application installée : impossible, on l'explique au lieu de cacher.
  if (!pushSupported()) {
    if (isIosSafariOutsideApp() && hint) { hint.dataset['i18n'] = 'push.iosHint'; hint.textContent = t('push.iosHint'); hint.classList.remove('cache'); }
    return;
  }
  const publicKey = String(key.body['publicKey']);
  button.classList.remove('cache');

  async function current(): Promise<PushSubscription | null> {
    try { return await (await registration()).pushManager.getSubscription(); } catch { return null; }
  }
  const paint = (on: boolean) => {
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.dataset['i18n'] = on ? 'push.off' : 'push.on';
    button.textContent = t(on ? 'push.off' : 'push.on');
  };
  paint((await current()) !== null && Notification.permission === 'granted');

  button.addEventListener('click', async () => {
    button.disabled = true;
    setMessage('jeu-message', '');
    try {
      const sub = await current();
      if (sub && Notification.permission === 'granted') {
        await api('DELETE', '/v1/push/subscriptions', { endpoint: sub.endpoint }).catch(() => undefined);
        await sub.unsubscribe();
        paint(false);
        setMessage('jeu-message', 'push.disabled', 'ok');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setMessage('jeu-message', 'push.denied'); paint(false); return; }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const fresh = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const json = fresh.toJSON();
      const r = await api('POST', '/v1/push/subscriptions', { endpoint: json.endpoint, keys: json.keys } as Json);
      if (r.status === 201 || r.status === 200) { paint(true); setMessage('jeu-message', 'push.enabled', 'ok'); }
      else { await fresh.unsubscribe(); paint(false); setMessage('jeu-message', r.status === 409 ? 'error.push_limit' : 'error.server_error'); }
    } catch {
      paint(false);
      setMessage('jeu-message', 'error.push_failed');
    } finally {
      button.disabled = false;
    }
  });
}

/** Le bouton « Installer », seulement quand le navigateur propose l'installation. */
export function setupInstall(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-action=install]');
  if (!button) return;
  let deferred: BeforeInstallPromptEvent | null = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    button.classList.remove('cache');
  });
  window.addEventListener('appinstalled', () => { button.classList.add('cache'); deferred = null; });
  button.addEventListener('click', async () => {
    if (!deferred) return;
    button.disabled = true;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    deferred = null;
    button.classList.add('cache');
    button.disabled = false;
  });
}
