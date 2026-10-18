import { createDecipheriv, createECDH, hkdfSync, randomBytes, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import { openDatabase } from '../src/db/database.ts';
import { ConsoleMailer } from '../src/mail/mailer.ts';
import type { AppContext } from '../src/context.ts';
import { aLieu, listSubscriptions, notifyArrivals } from '../src/push/routes.ts';
import {
  encryptPayload, generateVapidKeys, vapidAuthorization, vapidPublicKeyObject, WebPushSender,
  type PushMessage, type PushOutcome, type PushSender, type PushSubscription,
} from '../src/push/webpush.ts';

/** Le navigateur, côté test : ses clés, et le déchiffrement du standard (RFC 8291). */
function browser() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const auth = randomBytes(16);
  const subscription: PushSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/' + randomBytes(8).toString('hex'),
    p256dh: ecdh.getPublicKey().toString('base64url'),
    auth: auth.toString('base64url'),
  };
  function decrypt(body: Buffer): string {
    const salt = body.subarray(0, 16);
    const rs = body.readUInt32BE(16);
    const idlen = body[20]!;
    const asPublic = body.subarray(21, 21 + idlen);
    const ciphertext = body.subarray(21 + idlen);
    expect(rs).toBe(4096);
    const shared = ecdh.computeSecret(asPublic);
    const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), asPublic]);
    const ikm = Buffer.from(hkdfSync('sha256', shared, auth, keyInfo, 32));
    const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
    const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
    const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
    decipher.setAuthTag(ciphertext.subarray(-16));
    const record = Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()]);
    expect(record.at(-1)).toBe(2); // dernier enregistrement
    return record.subarray(0, -1).toString();
  }
  return { subscription, decrypt };
}

describe('web push — cryptographie', () => {
  it('chiffre pour l\'abonné et pour lui seul', () => {
    const me = browser();
    const other = browser();
    const body = encryptPayload(me.subscription, Buffer.from('{"title":"Votre courrier est arrivé"}'));
    expect(me.decrypt(body)).toBe('{"title":"Votre courrier est arrivé"}');
    expect(() => other.decrypt(body)).toThrow();
    // Deux envois du même texte ne se ressemblent pas (sel et clé éphémère).
    expect(encryptPayload(me.subscription, Buffer.from('x')).equals(encryptPayload(me.subscription, Buffer.from('x')))).toBe(false);
  });

  it('signe un jeton VAPID vérifiable avec la clé publique, pour la bonne origine', () => {
    const keys = { ...generateVapidKeys(), subject: 'mailto:courrier@altiplume.com' };
    const now = Date.UTC(2026, 9, 11, 12, 0, 0);
    const header = vapidAuthorization(keys, 'https://fcm.googleapis.com/fcm/send/abc', now);
    const m = /^vapid t=([^,]+), k=(.+)$/.exec(header)!;
    expect(m[2]).toBe(keys.publicKey);
    const [h, c, s] = m[1]!.split('.') as [string, string, string];
    expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toEqual({ typ: 'JWT', alg: 'ES256' });
    const claims = JSON.parse(Buffer.from(c, 'base64url').toString());
    expect(claims).toEqual({ aud: 'https://fcm.googleapis.com', exp: Math.floor(now / 1000) + 43200, sub: 'mailto:courrier@altiplume.com' });
    const ok = verify('sha256', Buffer.from(`${h}.${c}`), { key: vapidPublicKeyObject(keys.publicKey), dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
    expect(ok).toBe(true);
    expect(verify('sha256', Buffer.from(`${h}.${c}x`), { key: vapidPublicKeyObject(keys.publicKey), dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))).toBe(false);
  });

  it('envoie avec les bons en-têtes et reconnaît un abonnement mort', async () => {
    const keys = { ...generateVapidKeys(), subject: 'mailto:courrier@altiplume.com' };
    const calls: { url: string; init: RequestInit }[] = [];
    let status = 201;
    const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init! });
      return new Response(null, { status });
    }) as typeof fetch;
    const sender = new WebPushSender(keys, fakeFetch);
    const me = browser();
    expect(await sender.send(me.subscription, { title: 'A', body: 'B' }, Date.now())).toBe('sent');
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers['content-encoding']).toBe('aes128gcm');
    expect(headers['ttl']).toBe('86400');
    expect(headers['authorization']).toMatch(/^vapid t=.+, k=/);
    expect(me.decrypt(Buffer.from(calls[0]!.init.body as Buffer))).toBe('{"title":"A","body":"B"}');
    status = 410;
    expect(await sender.send(me.subscription, { title: 'A', body: 'B' }, Date.now())).toBe('gone');
    status = 500;
    expect(await sender.send(me.subscription, { title: 'A', body: 'B' }, Date.now())).toBe('failed');
  });
});

// ---- Routes et arrivée du courrier ----

class FakeSender implements PushSender {
  readonly sent: { endpoint: string; message: PushMessage }[] = [];
  outcome: PushOutcome = 'sent';
  async send(subscription: PushSubscription, message: PushMessage): Promise<PushOutcome> {
    this.sent.push({ endpoint: subscription.endpoint, message });
    return this.outcome;
  }
}

async function pushApp() {
  let clock = Date.UTC(2026, 9, 11, 9, 0, 0);
  const keys = generateVapidKeys();
  const push = new FakeSender();
  const ctx: AppContext = {
    db: openDatabase({ path: ':memory:' }),
    config: loadConfig({ NODE_ENV: 'test', PORT: '3000', PUBLIC_ORIGIN: 'http://localhost:3000', VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey }),
    mailer: new ConsoleMailer(() => undefined), push, now: () => clock,
  };
  const app = await buildApp(ctx, { clientDir: '/nonexistent' });
  const json = (method: 'POST' | 'DELETE' | 'GET', url: string, body?: unknown, cookie?: string) =>
    app.inject({ method, url, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body !== undefined ? { payload: JSON.stringify(body) } : {}) });
  await json('POST', '/v1/auth/register', { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true });
  const token = decodeURIComponent(/jeton=([A-Za-z0-9_%-]+)/.exec((ctx.mailer as ConsoleMailer).sent.at(-1)!.text)![1]!);
  const cookie = sessionCookie(await json('POST', '/v1/auth/verify', { token }));
  return { app, ctx, push, json, cookie, keys, advance: (ms: number) => { clock += ms; } };
}

describe('notifications — abonnements', () => {
  it('sans clés VAPID, tout est simplement indisponible', async () => {
    const t = await testApp();
    expect((await t.json('GET', '/v1/push/key')).statusCode).toBe(404);
    await t.app.close();
  });

  it('expose la clé publique, enregistre, exporte et retire un abonnement', async () => {
    const t = await pushApp();
    expect((await t.json('GET', '/v1/push/key')).json()).toEqual({ publicKey: t.keys.publicKey });
    const me = browser();
    const body = { endpoint: me.subscription.endpoint, keys: { p256dh: me.subscription.p256dh, auth: me.subscription.auth } };
    expect((await t.json('POST', '/v1/push/subscriptions', body)).statusCode).toBe(401);
    expect((await t.json('POST', '/v1/push/subscriptions', body, t.cookie)).statusCode).toBe(201);
    expect((await t.json('POST', '/v1/push/subscriptions', body, t.cookie)).statusCode).toBe(200); // idempotent
    expect((await t.json('POST', '/v1/push/subscriptions', { ...body, endpoint: 'http://pas-https.test/x' }, t.cookie)).statusCode).toBe(400);
    const player = t.ctx.db.prepare('SELECT id FROM players').get() as { id: string };
    expect(listSubscriptions(t.ctx.db, player.id)).toHaveLength(1);
    const exported = (await t.json('GET', '/v1/account/export', undefined, t.cookie)).json();
    expect(exported.notifications).toHaveLength(1);
    expect(JSON.stringify(exported.notifications)).not.toContain(me.subscription.auth);
    expect((await t.json('DELETE', '/v1/push/subscriptions', { endpoint: me.subscription.endpoint }, t.cookie)).statusCode).toBe(204);
    expect((await t.json('DELETE', '/v1/push/subscriptions', { endpoint: me.subscription.endpoint }, t.cookie)).statusCode).toBe(404);
    await t.app.close();
  });

  it('le renouvellement par le service worker envoie la forme acceptée (toJSON ajoute expirationTime, refusé)', async () => {
    const t = await pushApp();
    const me = browser();
    const toJSON = { endpoint: me.subscription.endpoint, expirationTime: null, keys: { p256dh: me.subscription.p256dh, auth: me.subscription.auth } };
    expect((await t.json('POST', '/v1/push/subscriptions', toJSON, t.cookie)).statusCode).toBe(400);
    // Ce qu'envoie désormais sw.ts : seulement l'adresse et les clés.
    expect((await t.json('POST', '/v1/push/subscriptions', { endpoint: toJSON.endpoint, keys: toJSON.keys }, t.cookie)).statusCode).toBe(201);
    await t.app.close();
  });

  it('plafonne à cinq appareils et disparaît avec le compte', async () => {
    const t = await pushApp();
    for (let i = 0; i < 5; i += 1) {
      const b = browser();
      expect((await t.json('POST', '/v1/push/subscriptions', { endpoint: b.subscription.endpoint, keys: { p256dh: b.subscription.p256dh, auth: b.subscription.auth } }, t.cookie)).statusCode).toBe(201);
    }
    const b = browser();
    expect((await t.json('POST', '/v1/push/subscriptions', { endpoint: b.subscription.endpoint, keys: { p256dh: b.subscription.p256dh, auth: b.subscription.auth } }, t.cookie)).statusCode).toBe(409);
    expect((await t.json('DELETE', '/v1/account', { confirmNickname: 'Régis' }, t.cookie)).statusCode).toBe(204);
    expect((t.ctx.db.prepare('SELECT count(*) AS n FROM push_subscriptions').get() as { n: number }).n).toBe(0);
    await t.app.close();
  });
});

describe('notifications — le courrier se pose', () => {
  async function flying(t: Awaited<ReturnType<typeof pushApp>>) {
    const me = browser();
    await t.json('POST', '/v1/push/subscriptions', { endpoint: me.subscription.endpoint, keys: { p256dh: me.subscription.p256dh, auth: me.subscription.auth } }, t.cookie);
    await t.json('POST', '/v1/company', { name: 'Messageries de la Croisette' }, t.cookie);
    const company = t.ctx.db.prepare('SELECT id, founded_at FROM companies').get() as { id: string; founded_at: number };
    t.ctx.db.prepare('DELETE FROM company_hand WHERE company_id = ?').run(company.id);
    t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES (?, ?, ?)').run(company.id, 'c-journal', company.founded_at);
    const state = (await t.json('GET', '/v1/company', undefined, t.cookie)).json();
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: state.planes[0].id, pilot: state.pilots[0].id }, t.cookie);
    expect(r.statusCode).toBe(201);
    const flight = r.json().flights[0] as { arrivesAt: number; departedAt: number };
    return { me, flight };
  }

  it('prévient une fois, à l\'arrivée, dans la langue du joueur', async () => {
    const t = await pushApp();
    const { flight } = await flying(t);
    expect(await notifyArrivals(t.ctx)).toBe(0); // en vol
    t.advance(flight.arrivesAt - flight.departedAt + 1);
    expect(await notifyArrivals(t.ctx)).toBe(1);
    expect(t.push.sent[0]!.message).toEqual({ title: 'Votre courrier est arrivé', body: "Prosper Chickenman s'est posé à Pont-de-Brume. +41 F · délai tenu.", url: '/aerodrome', tag: 'courrier' });
    expect(await notifyArrivals(t.ctx)).toBe(0); // jamais deux fois
    expect(t.push.sent).toHaveLength(1);
    await t.app.close();
  });

  it('en anglais pour un joueur anglophone', async () => {
    const t = await pushApp();
    await t.app.inject({ method: 'PATCH', url: '/v1/account', headers: { 'content-type': 'application/json', cookie: t.cookie }, payload: JSON.stringify({ locale: 'en' }) });
    const { flight } = await flying(t);
    t.advance(flight.arrivesAt - flight.departedAt + 1);
    await notifyArrivals(t.ctx);
    expect(t.push.sent[0]!.message.title).toBe('Your mail has arrived');
    expect(t.push.sent[0]!.message.body).toMatch(/^Prosper Chickenman has landed at Mistbridge\. \+41 F · deadline met\.$/);
    await t.app.close();
  });

  it('retire un abonnement mort, et ne réveille pas pour un vol posé depuis longtemps', async () => {
    const t = await pushApp();
    const { flight } = await flying(t);
    t.push.outcome = 'gone';
    t.advance(flight.arrivesAt - flight.departedAt + 1);
    expect(await notifyArrivals(t.ctx)).toBe(0);
    expect((t.ctx.db.prepare('SELECT count(*) AS n FROM push_subscriptions').get() as { n: number }).n).toBe(0);

    const t2 = await pushApp();
    const second = await flying(t2);
    t2.advance(second.flight.arrivesAt - second.flight.departedAt + 2 * 3_600_000);
    expect(await notifyArrivals(t2.ctx)).toBe(0);
    expect((t2.ctx.db.prepare('SELECT notified_at FROM flights').get() as { notified_at: number | null }).notified_at).not.toBeNull();
    await t.app.close(); await t2.app.close();
  });

  it('un convoi prévient une fois, avec la récompense de la tête (revue du 18/10 : l\'ailier annonçait « +0 F »)', async () => {
    const t = await pushApp();
    const { flight } = await flying(t);
    const lead = t.ctx.db.prepare('SELECT * FROM flights').get() as Record<string, unknown>;
    t.ctx.db.prepare('UPDATE flights SET convoy = id').run();
    t.ctx.db.prepare(`INSERT INTO flights (id, company_id, card, plane_id, pilot_id, destination, departed_at, duration_ms, deadline_at, reward, bonus, incident, convoy)
      VALUES ('ailier', ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`).run(lead['company_id'] as string, lead['card'] as string, lead['plane_id'] as string, lead['pilot_id'] as string, lead['destination'] as string, lead['departed_at'] as number, lead['duration_ms'] as number, lead['deadline_at'] as number, lead['id'] as string);
    t.advance(flight.arrivesAt - flight.departedAt + 1);
    expect(await notifyArrivals(t.ctx)).toBe(1);
    expect(t.push.sent).toHaveLength(1);
    expect(t.push.sent[0]!.message.body).toContain('+41 F');
    expect((t.ctx.db.prepare('SELECT count(*) AS n FROM flights WHERE notified_at IS NULL').get() as { n: number }).n).toBe(0);
    expect(await notifyArrivals(t.ctx)).toBe(0);
    await t.app.close();
  });

  it('le journal ne note « notification envoyée » que pour qui l\'a reçue', async () => {
    const t = await pushApp();
    const { flight } = await flying(t);
    // Un second joueur, sans abonnement, dont le vol se pose dans le même passage.
    await t.json('POST', '/v1/auth/register', { email: 'bastien@example.test', nickname: 'Bastien', locale: 'fr', ageConfirmed: true, acceptTerms: true });
    const token = decodeURIComponent(/jeton=([A-Za-z0-9_%-]+)/.exec((t.ctx.mailer as ConsoleMailer).sent.at(-1)!.text)![1]!);
    const other = sessionCookie(await t.json('POST', '/v1/auth/verify', { token }));
    await t.json('POST', '/v1/company', { name: 'Ailes du Moulin' }, other);
    const c2 = t.ctx.db.prepare('SELECT c.id, c.founded_at FROM companies c JOIN players p ON p.id = c.player_id WHERE p.nickname = ?').get('Bastien') as { id: string; founded_at: number };
    t.ctx.db.prepare('DELETE FROM company_hand WHERE company_id = ?').run(c2.id);
    t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES (?, ?, ?)').run(c2.id, 'c-journal', c2.founded_at);
    const state = (await t.json('GET', '/v1/company', undefined, other)).json();
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: state.planes[0].id, pilot: state.pilots[0].id }, other)).statusCode).toBe(201);
    t.advance(flight.arrivesAt - flight.departedAt + 60_000);
    expect(await notifyArrivals(t.ctx)).toBe(1);
    const audits = t.ctx.db.prepare("SELECT count(*) AS n FROM audit WHERE event = 'push.sent'").get() as { n: number };
    expect(audits.n).toBe(1);
    await t.app.close();
  });
  it('dans la notification elle-même', async () => {
    const t = await pushApp();
    const { flight } = await flying(t);
    t.ctx.db.prepare("UPDATE flights SET destination = 'les-tilleuls'").run();
    t.advance(flight.arrivesAt - flight.departedAt + 1);
    await notifyArrivals(t.ctx);
    expect(t.push.sent[0]!.message.body).toMatch(/s'est posé aux Tilleuls\./);
    await t.app.close();
  });
});

describe('notifications — le français contracte', () => {
  it('« aux Tilleuls », « au Hêtre-Roi », « à l\'Île-du-Bout », « au Phare de Brisant »', () => {
    expect(aLieu('Les Tilleuls')).toBe('aux Tilleuls');
    expect(aLieu('Le Hêtre-Roi')).toBe('au Hêtre-Roi');
    expect(aLieu('Le Rocher-Noir')).toBe('au Rocher-Noir');
    expect(aLieu('Île-du-Bout')).toBe("à l'Île-du-Bout");
    expect(aLieu('Île Sainte-Ambre')).toBe("à l'Île Sainte-Ambre");
    expect(aLieu('Anse-des-Lanternes')).toBe("à l'Anse-des-Lanternes");
    expect(aLieu('Phare de Brisant')).toBe('au Phare de Brisant');
    expect(aLieu('Lanterne-du-Val')).toBe('à Lanterne-du-Val');
    expect(aLieu('Pont-de-Brume')).toBe('à Pont-de-Brume');
  });

});
