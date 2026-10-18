import { createECDH, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import type { AppContext } from '../src/context.ts';
import { openDatabase } from '../src/db/database.ts';
import { ConsoleMailer, type Mailer } from '../src/mail/mailer.ts';
import { generateVapidKeys, isPushServiceEndpoint, WebPushSender, type PushSubscription } from '../src/push/webpush.ts';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * Ce que la revue du 18 octobre 2026 a trouvé côté serveur, et qui ne doit pas revenir :
 * une notification envoyée n'importe où, une limite de débit qu'un en-tête inventé
 * contourne, un jeton de connexion écrit dans le journal, et des réponses qui disent
 * si une adresse est inscrite.
 */

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

function subscription(endpoint: string): PushSubscription {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { endpoint, p256dh: ecdh.getPublicKey().toString('base64url'), auth: randomBytes(16).toString('base64url') };
}

/** Une application configurée comme en production, courrier capturé. */
async function productionApp(mailer: Mailer = new ConsoleMailer(() => undefined), logStream?: { write(line: string): void }) {
  const keys = generateVapidKeys();
  const ctx: AppContext = {
    db: openDatabase({ path: ':memory:' }),
    config: loadConfig({ NODE_ENV: 'production', PORT: '3000', PUBLIC_ORIGIN: 'https://altiplume.test', MAIL_API_KEY: 'cle-de-test', VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey }),
    mailer, push: null, now: () => Date.UTC(2026, 9, 18, 9, 0, 0),
  };
  const app = await buildApp(ctx, { clientDir: '/nonexistent', ...(logStream ? { logger: true, logStream } : {}) });
  return { app, ctx };
}

describe('notifications : seulement vers les services des navigateurs', () => {
  it('accepte Google, Mozilla, Apple et Microsoft, refuse tout le reste', () => {
    for (const ok of [
      'https://fcm.googleapis.com/fcm/send/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/abc',
      'https://web.push.apple.com/QAbc',
      'https://wns2-par02p.notify.windows.com/w/?token=abc',
    ]) expect(isPushServiceEndpoint(ok), ok).toBe(true);
    for (const ko of [
      'https://exemple.org/x',
      'https://192.168.1.10:5001/webapi/entry.cgi',
      'https://localhost:3000/v1/health',
      'https://169.254.169.254/x',
      'https://fcm.googleapis.com:8443/fcm/send/abc',
      'https://fcm.googleapis.com.exemple.org/x',
      'https://notify.windows.com/x',
      'https://user:pass@fcm.googleapis.com/x',
      'http://fcm.googleapis.com/fcm/send/abc',
      'pas une adresse',
    ]) expect(isPushServiceEndpoint(ko), ko).toBe(false);
  });

  it('refuse à l\'abonnement une adresse qui n\'est pas un service de notification', async () => {
    const keys = generateVapidKeys();
    const t = await testApp(undefined, { VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey });
    await t.json('POST', '/v1/auth/register', signup);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    const sub = subscription('https://exemple.org/abonnement');
    const r = await t.json('POST', '/v1/push/subscriptions', { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, cookie);
    expect(r.statusCode).toBe(400);
    expect(r.json().fields).toEqual(['endpoint_invalid']);
    await t.app.close();
  });

  it('ne contacte jamais une adresse étrangère déjà enregistrée : l\'abonnement est retiré', async () => {
    let calls = 0;
    const sender = new WebPushSender({ ...generateVapidKeys(), subject: 'mailto:courrier@altiplume.com' }, (async () => { calls += 1; return new Response(null, { status: 201 }); }) as typeof fetch);
    expect(await sender.send(subscription('https://exemple.org/x'), { title: 'A', body: 'B' }, Date.now())).toBe('gone');
    expect(calls).toBe(0);
  });

  it('abandonne un service qui ne répond pas, et ne suit pas une redirection', async () => {
    let init: RequestInit | undefined;
    const silent = (async (_url: string | URL | Request, i?: RequestInit) => {
      init = i;
      return new Promise<Response>((_resolve, reject) => { i?.signal?.addEventListener('abort', () => reject(new Error('abandon'))); });
    }) as typeof fetch;
    const sender = new WebPushSender({ ...generateVapidKeys(), subject: 'mailto:courrier@altiplume.com' }, silent, 50);
    const started = Date.now();
    expect(await sender.send(subscription('https://fcm.googleapis.com/fcm/send/abc'), { title: 'A', body: 'B' }, Date.now())).toBe('failed');
    expect(Date.now() - started).toBeLessThan(2000);
    expect(init?.redirect).toBe('error');
  });

  it('une clé mal formée échoue pour cet abonnement seulement, sans lever d\'erreur', async () => {
    const sender = new WebPushSender({ ...generateVapidKeys(), subject: 'mailto:courrier@altiplume.com' }, (async () => new Response(null, { status: 201 })) as typeof fetch);
    const bad = { ...subscription('https://fcm.googleapis.com/fcm/send/abc'), p256dh: 'A'.repeat(80) };
    expect(await sender.send(bad, { title: 'A', body: 'B' }, Date.now())).toBe('failed');
  });
});

describe('limite de débit : l\'adresse donnée par Cloudflare, pas celle que le visiteur écrit', () => {
  it('un X-Forwarded-For différent à chaque requête ne remet pas le compteur à zéro', async () => {
    const t = await productionApp();
    const codes: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const r = await t.app.inject({
        method: 'POST', url: '/v1/auth/login',
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': `10.0.0.${i}, 203.0.113.7` },
        payload: JSON.stringify({ email: `inconnu${i}@example.test` }),
      });
      codes.push(r.statusCode);
    }
    expect(codes.slice(0, 10).every((c) => c === 202)).toBe(true);
    expect(codes.at(-1)).toBe(429);
    await t.app.close();
  });
});

describe('journal : jamais le jeton du lien de connexion', () => {
  it('écrit le chemin de la page, sans ce qui suit le point d\'interrogation', async () => {
    const lines: string[] = [];
    const t = await productionApp(undefined, { write: (line) => { lines.push(line); } });
    await t.app.inject({ method: 'GET', url: '/verifier?jeton=JETON-SECRET-0123456789', headers: { 'cf-connecting-ip': '203.0.113.7' } });
    const journal = lines.join('');
    expect(journal).toContain('/verifier');
    expect(journal).not.toContain('JETON-SECRET');
    expect(journal).not.toContain('jeton=');
    await t.app.close();
  });
});

describe('inscription et connexion : rien ne dit si une adresse est inscrite', () => {
  it('avec un pseudonyme pris, la réponse est la même pour une adresse inscrite ou inconnue', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup);
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    const sent = t.mailer.sent.length;
    const inscrite = await t.json('POST', '/v1/auth/register', { ...signup });
    const inconnue = await t.json('POST', '/v1/auth/register', { ...signup, email: 'personne@example.test' });
    expect(inscrite.statusCode).toBe(409);
    expect(inscrite.json()).toEqual(inconnue.json());
    expect(inconnue.statusCode).toBe(409);
    // Et la personne visée ne reçoit pas un lien qu'elle n'a pas demandé.
    expect(t.mailer.sent.length).toBe(sent);
    await t.app.close();
  });

  it('un courrier lent ou en panne ne change ni le délai ni la réponse', async () => {
    let wait = 0;
    let fail = false;
    const slow: Mailer = { send: () => new Promise((resolve, reject) => setTimeout(() => (fail ? reject(new Error('refusé')) : resolve()), wait)) };
    const t = await productionApp(new ConsoleMailer(() => undefined));
    await t.app.inject({ method: 'POST', url: '/v1/auth/register', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.1' }, payload: JSON.stringify(signup) });
    const token = decodeURIComponent(/jeton=([A-Za-z0-9_%-]+)/.exec((t.ctx.mailer as ConsoleMailer).sent.at(-1)!.text)![1]!);
    await t.app.inject({ method: 'POST', url: '/v1/auth/verify', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.1' }, payload: JSON.stringify({ token }) });
    (t.ctx as { mailer: Mailer }).mailer = slow;
    const login = async (email: string, ip: string) => {
      const started = Date.now();
      const r = await t.app.inject({ method: 'POST', url: '/v1/auth/login', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, payload: JSON.stringify({ email }) });
      return { code: r.statusCode, ms: Date.now() - started };
    };
    wait = 400;
    const inscrite = await login('regis@example.test', '198.51.100.2');
    const inconnue = await login('personne@example.test', '198.51.100.3');
    expect(inscrite.code).toBe(202);
    expect(inconnue.code).toBe(202);
    expect(inscrite.ms).toBeLessThan(200);
    fail = true;
    wait = 0;
    expect((await login('regis@example.test', '198.51.100.4')).code).toBe(202);
    await new Promise((r) => setTimeout(r, 450));
    await t.app.close();
  });
});
