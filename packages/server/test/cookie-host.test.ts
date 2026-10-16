import { describe, expect, it } from 'vitest';
import { testApp } from './helpers.ts';

/**
 * Depuis le 16 octobre, un autre site vit sous `*.altiplume.com`. En production, le
 * cookie de session porte le préfixe `__Host-` : le navigateur refuse qu'un
 * sous-domaine en dépose un, et ne l'accepte que posé en HTTPS, sans `Domain`, avec `Path=/`.
 */
const PROD = { NODE_ENV: 'production', PUBLIC_ORIGIN: 'https://altiplume.test', MAIL_API_KEY: 'x' };
const signup = { email: 'hote@example.test', nickname: 'Hote', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const https = { 'content-type': 'application/json', 'x-forwarded-proto': 'https' };

async function signedIn(env: Record<string, string>) {
  const t = await testApp(undefined, env);
  await t.app.inject({ method: 'POST', url: '/v1/auth/register', headers: https, payload: JSON.stringify(signup) });
  const r = await t.app.inject({ method: 'POST', url: '/v1/auth/verify', headers: https, payload: JSON.stringify({ token: t.lastToken() }) });
  return { t, r };
}

describe('le cookie de session ne peut pas venir d\'un sous-domaine', () => {
  it('en production : `__Host-`, Secure, Path=/, sans Domain', async () => {
    const { r } = await signedIn(PROD);
    expect(r.statusCode).toBe(201);
    const c = r.cookies.find((x) => x.name === '__Host-altiplume_session');
    expect(c).toBeDefined();
    expect(c!.secure).toBe(true);
    expect(c!.path).toBe('/');
    expect(c!.domain).toBeUndefined();
    expect(c!.httpOnly).toBe(true);
    expect(r.cookies.find((x) => x.name === 'altiplume_session')).toBeUndefined();
  });

  it("en production, l'ancien nom n'ouvre plus de session, et il est effacé au passage", async () => {
    const { t, r } = await signedIn(PROD);
    const value = r.cookies.find((x) => x.name === '__Host-altiplume_session')!.value;
    const avecAncien = await t.app.inject({ method: 'GET', url: '/v1/account', headers: { ...https, cookie: `altiplume_session=${value}` } });
    expect(avecAncien.statusCode).toBe(401);
    const efface = avecAncien.cookies.find((x) => x.name === 'altiplume_session');
    expect(efface?.value).toBe('');
    const avecNouveau = await t.app.inject({ method: 'GET', url: '/v1/account', headers: { ...https, cookie: `__Host-altiplume_session=${value}` } });
    expect(avecNouveau.statusCode).toBe(200);
  });

  it('la déconnexion efface le cookie `__Host-` avec ses attributs (sinon le navigateur l\'ignore)', async () => {
    const { t, r } = await signedIn(PROD);
    const value = r.cookies.find((x) => x.name === '__Host-altiplume_session')!.value;
    const out = await t.app.inject({ method: 'POST', url: '/v1/auth/logout', headers: { ...https, cookie: `__Host-altiplume_session=${value}` }, payload: '{}' });
    const c = out.cookies.find((x) => x.name === '__Host-altiplume_session');
    expect(c?.value).toBe('');
    expect(c?.secure).toBe(true);
    expect(c?.path).toBe('/');
  });

  it('hors production (http://localhost), le nom reste `altiplume_session` : le préfixe exige HTTPS', async () => {
    const { r } = await signedIn({});
    expect(r.cookies.find((x) => x.name === 'altiplume_session')).toBeDefined();
    expect(r.cookies.find((x) => x.name.startsWith('__Host-'))).toBeUndefined();
  });
});
