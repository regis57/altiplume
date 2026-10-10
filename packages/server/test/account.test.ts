import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

async function signedIn() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const r = await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
  return { ...t, cookie: sessionCookie(r) };
}

describe('compte', () => {
  it('exige une session', async () => {
    const t = await testApp();
    expect((await t.json('GET', '/v1/account')).statusCode).toBe(401);
    expect((await t.json('GET', '/v1/account/export')).statusCode).toBe(401);
    expect((await t.json('DELETE', '/v1/account', { confirmNickname: 'x' })).statusCode).toBe(401);
    await t.app.close();
  });

  it('change le pseudonyme et la langue, avec les mêmes règles qu\'à l\'inscription', async () => {
    const t = await signedIn();
    expect((await t.json('PATCH', '/v1/account', { nickname: 'Admin' }, t.cookie)).json().fields).toContain('nickname_reserved');
    expect((await t.json('PATCH', '/v1/account', { nickname: 'RÉGIS' }, t.cookie)).statusCode).toBe(204); // son propre nom, casse changée
    expect((await t.json('PATCH', '/v1/account', { locale: 'en' }, t.cookie)).statusCode).toBe(204);
    const me = (await t.json('GET', '/v1/account', undefined, t.cookie)).json();
    expect(me.nickname).toBe('RÉGIS');
    expect(me.locale).toBe('en');
    await t.app.close();
  });

  it('exporte tout en JSON, sans empreinte de session', async () => {
    const t = await signedIn();
    const r = await t.json('GET', '/v1/account/export', undefined, t.cookie);
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-disposition']).toContain('attachment');
    const data = r.json();
    expect(data.player.email).toBe('regis@example.test');
    expect(data.events.map((e: { event: string }) => e.event)).toContain('player.registered');
    expect(JSON.stringify(data)).not.toMatch(/"id":"[a-f0-9]{64}"/); // pas d'empreinte de session
    await t.app.close();
  });

  it('refuse la suppression sans le bon pseudonyme, puis efface tout', async () => {
    const t = await signedIn();
    expect((await t.json('DELETE', '/v1/account', { confirmNickname: 'Autre' }, t.cookie)).statusCode).toBe(400);
    const r = await t.json('DELETE', '/v1/account', { confirmNickname: 'régis ' }, t.cookie);
    expect(r.statusCode).toBe(400); // la casse compte : on retape exactement
    const ok = await t.json('DELETE', '/v1/account', { confirmNickname: 'Régis' }, t.cookie);
    expect(ok.statusCode).toBe(204);
    expect((await t.json('GET', '/v1/account', undefined, t.cookie)).statusCode).toBe(401);
    // L'adresse est de nouveau libre, et le pseudonyme aussi.
    await t.json('POST', '/v1/auth/register', signup);
    expect(t.mailer.sent.at(-1)?.subject).toMatch(/inscription/i);
    await t.app.close();
  });
});
