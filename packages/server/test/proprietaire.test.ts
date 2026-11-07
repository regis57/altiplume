import { describe, expect, it } from 'vitest';
import { loadConfig, ConfigError } from '../src/config.ts';
import { sessionCookie, testApp } from './helpers.ts';

const OWNER = 'editeur@example.test';

/** Inscrit et connecte une personne ; rend son cookie de session. */
async function signUp(t: Awaited<ReturnType<typeof testApp>>, email: string, nickname: string): Promise<string> {
  await t.json('POST', '/v1/auth/register', { email, nickname, locale: 'fr', ageConfirmed: true, acceptTerms: true });
  const r = await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
  return sessionCookie(r);
}

describe("le compteur de l'éditeur", () => {
  it("l'éditeur voit les nombres exacts, sans cache", async () => {
    const t = await testApp(undefined, { OWNER_EMAIL: OWNER });
    const cookie = await signUp(t, OWNER, 'Editeur');
    await signUp(t, 'alice@example.test', 'Alice');
    await signUp(t, 'bruno@example.test', 'Bruno');
    await t.json('POST', '/v1/company', { name: 'Messageries Rosée' }, cookie);
    const r = await t.json('GET', '/v1/owner/counts', undefined, cookie);
    expect(r.statusCode).toBe(200);
    expect(r.headers['cache-control']).toBe('no-store');
    const body = r.json();
    expect(body).toMatchObject({ players: 3, companies: 1, registeredLast7Days: 3, registeredLast30Days: 3 });
    // Que des nombres : ni nom, ni adresse, ni liste.
    expect(JSON.stringify(body)).not.toMatch(/example\.test|Alice|Bruno/);
    await t.app.close();
  });

  it('compte les inscriptions récentes et laisse de côté les anciennes', async () => {
    const t = await testApp(undefined, { OWNER_EMAIL: OWNER });
    await signUp(t, OWNER, 'Editeur');
    t.advance(10 * 24 * 3_600_000);
    await signUp(t, 'alice@example.test', 'Alice');
    t.advance(40 * 24 * 3_600_000);
    await signUp(t, 'bruno@example.test', 'Bruno');
    const owner = await t.json('POST', '/v1/auth/login', { email: OWNER }).then(() => t.json('POST', '/v1/auth/verify', { token: t.lastToken() })).then(sessionCookie);
    const body = (await t.json('GET', '/v1/owner/counts', undefined, owner)).json();
    expect(body.players).toBe(3);
    expect(body.registeredLast7Days).toBe(1);
    expect(body.registeredLast30Days).toBe(1);
    await t.app.close();
  });

  it("reconnaît l'adresse sans tenir compte des majuscules", async () => {
    const t = await testApp(undefined, { OWNER_EMAIL: '  Editeur@Example.TEST ' });
    const cookie = await signUp(t, OWNER, 'Editeur');
    expect((await t.json('GET', '/v1/owner/counts', undefined, cookie)).statusCode).toBe(200);
    await t.app.close();
  });

  it("ne signale « owner » dans le compte que pour l'éditeur", async () => {
    const t = await testApp(undefined, { OWNER_EMAIL: OWNER });
    const editeur = await signUp(t, OWNER, 'Editeur');
    const alice = await signUp(t, 'alice@example.test', 'Alice');
    expect((await t.json('GET', '/v1/account', undefined, editeur)).json().owner).toBe(true);
    expect('owner' in (await t.json('GET', '/v1/account', undefined, alice)).json()).toBe(false);
    await t.app.close();
    const sans = await testApp();
    const cookie = await signUp(sans, OWNER, 'Editeur');
    expect('owner' in (await sans.json('GET', '/v1/account', undefined, cookie)).json()).toBe(false);
    await sans.app.close();
  });

  it("répond « introuvable » à tout autre : une personne inscrite, un visiteur", async () => {
    const t = await testApp(undefined, { OWNER_EMAIL: OWNER });
    const alice = await signUp(t, 'alice@example.test', 'Alice');
    const joueur = await t.json('GET', '/v1/owner/counts', undefined, alice);
    const visiteur = await t.json('GET', '/v1/owner/counts');
    for (const r of [joueur, visiteur]) {
      expect(r.statusCode).toBe(404);
      expect(r.json()).toEqual({ error: 'not_found' });
    }
    await t.app.close();
  });

  it("n'existe pas sans OWNER_EMAIL, même pour une personne connectée", async () => {
    const t = await testApp();
    const cookie = await signUp(t, OWNER, 'Editeur');
    expect((await t.json('GET', '/v1/owner/counts', undefined, cookie)).statusCode).toBe(404);
    await t.app.close();
  });

  it("refuse de démarrer si OWNER_EMAIL n'est pas une adresse", () => {
    expect(() => loadConfig({ NODE_ENV: 'test', OWNER_EMAIL: 'pas-une-adresse' })).toThrow(ConfigError);
    expect(loadConfig({ NODE_ENV: 'test' }).ownerEmail).toBeNull();
    expect(loadConfig({ NODE_ENV: 'test', OWNER_EMAIL: '   ' }).ownerEmail).toBeNull();
  });
});
