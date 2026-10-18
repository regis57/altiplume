/**
 * Web Push sans dépendance : VAPID (RFC 8292) et chiffrement aes128gcm (RFC 8291,
 * RFC 8188), avec node:crypto seulement.
 *
 * Pourquoi l'écrire plutôt que l'installer : c'est deux cents lignes de standard,
 * chacune lisible, et un secret (la clé VAPID) passe par ici. On préfère savoir
 * exactement ce qui est fait de ce secret.
 *
 * Ce que reçoit le service de push (Google, Mozilla, Apple) : une URL, un corps
 * chiffré qu'il ne peut pas lire, et une signature qui prouve que c'est bien
 * Altiplume qui envoie. Ce que nous gardons : l'adresse de l'abonnement et les
 * deux clés que le navigateur nous a confiées.
 */
import { createCipheriv, createECDH, createPrivateKey, createPublicKey, hkdfSync, randomBytes, sign, type KeyObject } from 'node:crypto';

export interface VapidKeys {
  /** Clé publique P-256 non compressée (65 octets), en base64url. */
  readonly publicKey: string;
  /** Scalaire privé (32 octets), en base64url. */
  readonly privateKey: string;
  /** `mailto:` ou URL : à qui le service de push peut s'adresser. */
  readonly subject: string;
}

export interface PushSubscription {
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
}

export interface PushMessage {
  readonly title: string;
  readonly body: string;
  readonly url?: string;
  readonly tag?: string;
}

/** Génère une paire de clés VAPID. À lancer une fois ; la privée va dans .env. */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey().toString('base64url'),
    privateKey: ecdh.getPrivateKey().toString('base64url'),
  };
}

function b64url(data: Buffer | string): string {
  return Buffer.from(data).toString('base64url');
}

/** Reconstruit la clé de signature à partir du scalaire privé et de la clé publique. */
function signingKey(keys: VapidKeys): KeyObject {
  const pub = Buffer.from(keys.publicKey, 'base64url');
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('clé publique VAPID invalide');
  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: b64url(pub.subarray(1, 33)),
    y: b64url(pub.subarray(33, 65)),
    d: keys.privateKey,
  };
  return createPrivateKey({ key: jwk, format: 'jwk' });
}

/** Jeton VAPID : un JWT ES256 valable douze heures pour l'origine du service de push. */
export function vapidAuthorization(keys: VapidKeys, endpoint: string, now: number): string {
  const audience = new URL(endpoint).origin;
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const claims = b64url(JSON.stringify({ aud: audience, exp: Math.floor(now / 1000) + 12 * 3600, sub: keys.subject }));
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), { key: signingKey(keys), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${header}.${claims}.${b64url(signature)}, k=${keys.publicKey}`;
}

/**
 * Chiffre un message pour un abonnement (aes128gcm). Rend le corps à envoyer tel
 * quel : en-tête (sel, taille d'enregistrement, clé publique éphémère) puis le
 * texte chiffré et son étiquette d'authenticité.
 */
export function encryptPayload(subscription: PushSubscription, plaintext: Buffer): Buffer {
  const uaPublic = Buffer.from(subscription.p256dh, 'base64url');
  const authSecret = Buffer.from(subscription.auth, 'base64url');
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error('abonnement invalide');

  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(uaPublic);

  // RFC 8291 §3.3-3.4 : IKM = HKDF(auth, ecdh_secret, "WebPush: info" || ua_public || as_public, 32)
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync('sha256', sharedSecret, authSecret, keyInfo, 32));

  // RFC 8188 §2.2 : clé et nonce dérivés du sel.
  const salt = randomBytes(16);
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));

  // Un seul enregistrement : texte, délimiteur 0x02 (dernier), pas de rembourrage.
  const record = Buffer.concat([plaintext, Buffer.from([2])]);
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(record), cipher.final(), cipher.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  const header = Buffer.concat([salt, recordSize, Buffer.from([asPublic.length]), asPublic]);
  return Buffer.concat([header, ciphertext]);
}

/**
 * Les services de notification des navigateurs : Chrome et ses cousins (Google),
 * Firefox (Mozilla), Safari (Apple), Edge (Microsoft). Le serveur n'envoie qu'à eux.
 * Une adresse quelconque ferait partir du serveur une requête vers une machine
 * choisie par un joueur, qui y lirait d'où elle vient.
 */
const PUSH_HOSTS: ReadonlySet<string> = new Set(['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']);
const PUSH_HOST_SUFFIXES: readonly string[] = ['.notify.windows.com'];

export function isPushServiceEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port !== '' || url.username !== '' || url.password !== '') return false;
  const host = url.hostname;
  return PUSH_HOSTS.has(host) || PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length);
}

/** Un service qui ne répond pas ne doit pas retenir les notifications des autres joueurs. */
export const PUSH_TIMEOUT_MS = 10_000;

export type PushOutcome = 'sent' | 'gone' | 'failed';

export interface PushSender {
  send(subscription: PushSubscription, message: PushMessage, now: number): Promise<PushOutcome>;
}

/** Envoi réel, par fetch. `gone` signale un abonnement mort, à supprimer. */
export class WebPushSender implements PushSender {
  private readonly keys: VapidKeys;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  constructor(keys: VapidKeys, fetchImpl: typeof fetch = fetch, timeoutMs = PUSH_TIMEOUT_MS) {
    this.keys = keys;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }
  async send(subscription: PushSubscription, message: PushMessage, now: number): Promise<PushOutcome> {
    // Un abonnement enregistré vers autre chose qu'un service de notification n'est
    // jamais contacté : il est retiré comme un abonnement mort.
    if (!isPushServiceEndpoint(subscription.endpoint)) return 'gone';
    try {
      // Dans le try : une clé mal formée échoue pour cet abonnement seulement.
      const body = encryptPayload(subscription, Buffer.from(JSON.stringify(message)));
      const response = await this.fetchImpl(subscription.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/octet-stream',
          'content-encoding': 'aes128gcm',
          'content-length': String(body.length),
          ttl: '86400',
          urgency: 'normal',
          authorization: vapidAuthorization(this.keys, subscription.endpoint, now),
        },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (response.status === 404 || response.status === 410) return 'gone';
      return response.ok ? 'sent' : 'failed';
    } catch {
      return 'failed';
    }
  }
}

/** Pour les tests : vérifie qu'une signature VAPID est bien celle de la clé publique. */
export function vapidPublicKeyObject(publicKey: string): KeyObject {
  const pub = Buffer.from(publicKey, 'base64url');
  return createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33, 65)) }, format: 'jwk' });
}
