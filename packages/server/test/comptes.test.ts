import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import type { AppContext } from '../src/context.ts';
import { openDatabase } from '../src/db/database.ts';
import { ConsoleMailer } from '../src/mail/mailer.ts';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * Ce que le compte promet au joueur, et que la revue du 18 octobre 2026 a trouvé
 * en défaut : l'effacement efface vraiment, l'export emporte tout, un refus
 * n'enregistre rien, et une session prolongée l'est aussi dans le navigateur.
 */

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const DAY = 86_400_000;

async function signedIn(t: Awaited<ReturnType<typeof testApp>>) {
  await t.json('POST', '/v1/auth/register', signup);
  return sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
}

describe('un compte effacé ne reste pas dans le fichier', () => {
  it('l\'adresse ne se lit plus dans la base après l\'effacement', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'altiplume-effacement-')), 'jeu.db');
    let clock = Date.UTC(2026, 9, 18, 9);
    const mailer = new ConsoleMailer(() => undefined);
    const ctx: AppContext = {
      db: openDatabase({ path }),
      config: loadConfig({ NODE_ENV: 'test', PORT: '3000', PUBLIC_ORIGIN: 'http://localhost:3000' }),
      mailer, push: null, now: () => clock,
    };
    const app = await buildApp(ctx, { clientDir: '/nonexistent' });
    const json = (method: 'POST' | 'DELETE', url: string, body: unknown, cookie?: string) =>
      app.inject({ method, url, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, payload: JSON.stringify(body) });
    const email = 'adresse-a-effacer@example.test';
    await json('POST', '/v1/auth/register', { ...signup, email, nickname: 'Effacée' });
    const token = decodeURIComponent(/jeton=([A-Za-z0-9_%-]+)/.exec(mailer.sent.at(-1)!.text)![1]!);
    const cookie = sessionCookie(await json('POST', '/v1/auth/verify', { token }));
    await json('POST', '/v1/company', { name: 'Compagnie Effacée' }, cookie);
    ctx.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    expect(readFileSync(path).includes(email)).toBe(true);
    clock += 60_000;
    expect((await json('DELETE', '/v1/account', { confirmNickname: 'Effacée' }, cookie)).statusCode).toBe(204);
    ctx.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    const file = readFileSync(path);
    expect(file.includes(email)).toBe(false);
    expect(file.includes('Compagnie Effacée')).toBe(false);
    await app.close();
  });
});

describe('« Télécharger mes données » emporte tout', () => {
  it('le fuseau, les routes, la main, les vols, le livre de bord et les compteurs', async () => {
    const t = await testApp();
    const cookie = await signedIn(t);
    await t.json('PATCH', '/v1/account', { timezone: 'Europe/Paris' }, cookie);
    await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
    const company = t.ctx.db.prepare('SELECT id, founded_at FROM companies').get() as { id: string; founded_at: number };
    t.ctx.db.prepare('DELETE FROM company_hand WHERE company_id = ?').run(company.id);
    t.ctx.db.prepare("INSERT INTO company_hand (company_id, card, drawn_at) VALUES (?, 'c-journal', ?)").run(company.id, company.founded_at);
    const state = (await t.json('GET', '/v1/company', undefined, cookie)).json();
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: state.planes[0].id, pilot: state.pilots[0].id }, cookie)).statusCode).toBe(201);
    const exported = (await t.json('GET', '/v1/account/export', undefined, cookie)).json();
    expect(exported.player.timezone).toBe('Europe/Paris');
    expect(exported.game.regions.map((r: { region: string }) => r.region)).toContain('brume');
    expect(Array.isArray(exported.game.hand)).toBe(true);
    expect(exported.game.flights).toHaveLength(1);
    expect(exported.game.ledger.length).toBeGreaterThan(0);
    expect(exported.game.counters).toEqual(expect.objectContaining({ flights: expect.any(Number), deadlinesMet: expect.any(Number) }));
    await t.app.close();
  });
});

describe('modifier son compte : tout ou rien', () => {
  it('un pseudonyme pris n\'enregistre pas la langue envoyée avec lui', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', { ...signup, email: 'autre@example.test', nickname: 'Pris' });
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    const cookie = await signedIn(t);
    const r = await t.json('PATCH', '/v1/account', { locale: 'en', nickname: 'Pris' }, cookie);
    expect(r.statusCode).toBe(409);
    expect((await t.json('GET', '/v1/account', undefined, cookie)).json().locale).toBe('fr');
    await t.app.close();
  });
});

describe('la session prolongée l\'est aussi dans le navigateur', () => {
  it('un passage au vingtième jour repose le cookie pour trente jours', async () => {
    const t = await testApp();
    const cookie = await signedIn(t);
    t.advance(20 * DAY);
    const r = await t.json('GET', '/v1/account', undefined, cookie);
    expect(r.statusCode).toBe(200);
    const set = r.cookies.find((c) => c.name === 'altiplume_session');
    expect(set).toBeDefined();
    expect(set!.maxAge).toBe(30 * 24 * 3600);
    // Dans les dix minutes qui suivent, pas besoin de le reposer.
    const again = await t.json('GET', '/v1/account', undefined, cookie);
    expect(again.cookies.find((c) => c.name === 'altiplume_session')).toBeUndefined();
    await t.app.close();
  });
});
