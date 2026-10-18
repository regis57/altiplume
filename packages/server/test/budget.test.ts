import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { addressBlock, LINKS_PER_DAY, SIGNUPS_PER_DAY } from '../src/auth/budget.ts';
import { loadConfig } from '../src/config.ts';
import { openDatabase } from '../src/db/database.ts';
import { audit } from '../src/db/repos/audit.ts';
import { ConsoleMailer } from '../src/mail/mailer.ts';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * Brevo envoie 300 courriels par jour pour tout le jeu. Le 18/10, la revue a montré
 * qu'une seule source pouvait les épuiser : plus aucun lien de connexion jusqu'au
 * lendemain. Plafond du jour, réserve pour les joueurs inscrits, IPv6 compté par /64.
 */
const signup = (email: string, nickname: string) => ({ email, nickname, locale: 'fr', ageConfirmed: true, acceptTerms: true });

/** Fait comme si `n` liens de ce motif étaient déjà partis aujourd'hui. */
function alreadySent(t: Awaited<ReturnType<typeof testApp>>, n: number, purpose: 'signup' | 'login') {
  for (let i = 0; i < n; i += 1) audit(t.ctx.db, 'magic_link.sent', null, { purpose }, t.ctx.now());
}

describe('le budget de courrier du jour', () => {
  it('ferme les inscriptions à 150 liens, et garde la connexion ouverte aux joueurs inscrits', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup('ancienne@example.test', 'Ancienne'));
    sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    alreadySent(t, SIGNUPS_PER_DAY, 'signup');
    const before = t.mailer.sent.length;

    const nouvelle = await t.json('POST', '/v1/auth/register', signup('nouvelle@example.test', 'Nouvelle'));
    expect(nouvelle.statusCode).toBe(503);
    expect(nouvelle.json()).toEqual({ error: 'invalid', fields: ['signups_full'] });
    // Une adresse déjà inscrite reçoit la même réponse : rien ne dit qui est inscrit.
    const connue = await t.json('POST', '/v1/auth/register', signup('ancienne@example.test', 'Autrement'));
    expect(connue.statusCode).toBe(503);
    expect(connue.json()).toEqual(nouvelle.json());
    expect(t.mailer.sent.length).toBe(before);

    // La connexion, elle, passe encore.
    expect((await t.json('POST', '/v1/auth/login', { email: 'ancienne@example.test' })).statusCode).toBe(202);
    await new Promise((r) => setImmediate(r));
    expect(t.mailer.sent.length).toBe(before + 1);
    await t.app.close();
  });

  it('arrête tout envoi à 250, pour une adresse connue comme inconnue, et rouvre à minuit UTC', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup('ancienne@example.test', 'Ancienne'));
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    alreadySent(t, LINKS_PER_DAY - 1, 'login'); // + le lien d'inscription ci-dessus = 250
    const before = t.mailer.sent.length;

    const connue = await t.json('POST', '/v1/auth/login', { email: 'ancienne@example.test' });
    const inconnue = await t.json('POST', '/v1/auth/login', { email: 'personne@example.test' });
    expect(connue.statusCode).toBe(503);
    expect(connue.json()).toEqual({ error: 'invalid', fields: ['mail_quota'] });
    expect(inconnue.json()).toEqual(connue.json());
    expect(t.mailer.sent.length).toBe(before);
    const refus = t.ctx.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE event = 'magic_link.rejected' AND meta LIKE '%mail_quota%'").get() as { n: number };
    expect(refus.n).toBe(2);

    // Le jour du jeu change à minuit UTC (le test part le 11/10 à 9 h UTC).
    t.advance(15 * 3_600_000);
    expect((await t.json('POST', '/v1/auth/login', { email: 'ancienne@example.test' })).statusCode).toBe(202);
    await t.app.close();
  });

  it('compte aussi les envois en cours, pour qu\'une rafale ne passe pas avant le journal', async () => {
    const t = await testApp();
    alreadySent(t, SIGNUPS_PER_DAY - 1, 'signup');
    // Un courrier qui ne répond jamais : l'envoi reste « en cours ».
    (t.ctx as { mailer: typeof t.ctx.mailer }).mailer = { send: () => new Promise(() => undefined) };
    expect((await t.json('POST', '/v1/auth/register', signup('a@example.test', 'Aline'))).statusCode).toBe(202);
    expect((await t.json('POST', '/v1/auth/register', signup('b@example.test', 'Basile'))).statusCode).toBe(503);
    await t.app.close();
  });
});

describe('la limite de débit compte un abonné IPv6 par bloc /64', () => {
  it('regroupe les adresses d\'un même /64, sépare les autres', () => {
    expect(addressBlock('2001:db8:1:2:aaaa::1')).toBe(addressBlock('2001:db8:1:2:bbbb:cccc:dddd:eeee'));
    expect(addressBlock('2001:0db8:0001:0002::')).toBe('2001:db8:1:2::/64');
    expect(addressBlock('2001:db8:1:3::1')).not.toBe(addressBlock('2001:db8:1:2::1'));
    expect(addressBlock('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(addressBlock('::1')).toBe('0:0:0:0::/64');
    expect(addressBlock('203.0.113.7')).toBe('203.0.113.7');
    expect(addressBlock('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('refuse la onzième demande de lien d\'un même /64, même d\'une adresse neuve à chaque fois', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'altiplume-budget-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title>');
    const app = await buildApp({
      db: openDatabase({ path: ':memory:' }),
      config: loadConfig({ NODE_ENV: 'production', PORT: '3000', PUBLIC_ORIGIN: 'https://altiplume.test', MAIL_API_KEY: 'x' }),
      mailer: new ConsoleMailer(() => undefined), push: null, now: () => Date.now(),
    }, { clientDir: dir });
    const ask = (ip: string) => app.inject({
      method: 'POST', url: '/v1/auth/login',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
      payload: JSON.stringify({ email: 'x@example.test' }),
    });
    for (let i = 1; i <= 10; i += 1) expect((await ask(`2001:db8:1:2::${i.toString(16)}`)).statusCode, `demande ${i}`).toBe(202);
    expect((await ask('2001:db8:1:2:ffff::99')).statusCode).toBe(429);
    // Un autre abonné n'est pas touché.
    expect((await ask('2001:db8:9:9::1')).statusCode).toBe(202);
    await app.close();
  });
});
