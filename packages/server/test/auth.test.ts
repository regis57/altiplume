import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { validateNickname } from '../src/auth/validation.ts';

const signup = { email: 'Regis@Example.TEST', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

describe('inscription', () => {
  it('envoie un lien, puis crée le compte et ouvre une session au clic', async () => {
    const t = await testApp();
    const r1 = await t.json('POST', '/v1/auth/register', signup);
    expect(r1.statusCode).toBe(202);
    expect(t.mailer.sent).toHaveLength(1);
    expect(t.mailer.sent[0]?.to).toBe('regis@example.test');
    expect(t.mailer.sent[0]?.subject).toMatch(/inscription/i);

    const r2 = await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    expect(r2.statusCode).toBe(201);
    expect(r2.json()).toEqual({ status: 'registered', nickname: 'Régis' });
    const cookie = sessionCookie(r2);
    expect(r2.headers['set-cookie']).toMatch(/HttpOnly/);
    expect(r2.headers['set-cookie']).toMatch(/SameSite=Lax/);

    const me = await t.json('GET', '/v1/account', undefined, cookie);
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe('regis@example.test');
    await t.app.close();
  });

  it('refuse les entrées invalides avec des codes précis', async () => {
    const t = await testApp();
    const r = await t.json('POST', '/v1/auth/register', { ...signup, email: 'pas-une-adresse', nickname: 'ab', ageConfirmed: false, acceptTerms: false });
    expect(r.statusCode).toBe(400);
    expect(r.json().fields).toEqual(expect.arrayContaining(['email_invalid', 'nickname_too_short', 'age_not_confirmed', 'terms_not_accepted']));
    expect(t.mailer.sent).toHaveLength(0);
    await t.app.close();
  });

  it('refuse un pseudonyme réservé ou offensant, et un pseudonyme déjà pris', async () => {
    const t = await testApp();
    expect((await t.json('POST', '/v1/auth/register', { ...signup, nickname: 'Admin' })).json().fields).toContain('nickname_reserved');
    expect((await t.json('POST', '/v1/auth/register', { ...signup, nickname: 'xXnaziXx' })).json().fields).toContain('nickname_offensive');
    await t.json('POST', '/v1/auth/register', signup);
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    const r = await t.json('POST', '/v1/auth/register', { ...signup, email: 'autre@example.test', nickname: 'REGIS' });
    expect(r.statusCode).toBe(409);
    expect(r.json().fields).toContain('nickname_taken');
    await t.app.close();
  });

  it('laisse passer les prénoms et les mots où un mot interdit se cache', async () => {
    // Autant de prénoms de femmes que d'hommes.
    for (const n of ['Violette', 'Violaine', 'Viola', 'Eugène Viollet', 'Marco Rapetti', 'Basile de Pornic']) {
      expect(validateNickname(n), n).toBeNull();
    }
    for (const n of ['Drapeau', 'Parapente', 'Computer', 'Retardataire']) expect(validateNickname(n), n).toBeNull();
    // Les mots eux-mêmes restent refusés : seuls, dans un nom composé, ou déguisés.
    for (const n of ['Viol', 'V1ol', 'Jean-Pute', 'Le Porn', 'xXnaziXx', 'Hitler2']) {
      expect(validateNickname(n), n).toBe('nickname_offensive');
    }
    const t = await testApp();
    expect((await t.json('POST', '/v1/auth/register', { ...signup, nickname: 'Violette' })).statusCode).toBe(202);
    await t.app.close();
  });

  it('distingue les pseudonymes de toutes les écritures', async () => {
    const t = await testApp();
    for (const [i, nickname] of ['Олег', 'Мария', 'さくら', 'Ægir'].entries()) {
      const r = await t.json('POST', '/v1/auth/register', { ...signup, email: `joueur${i}@example.test`, nickname });
      expect(r.statusCode, nickname).toBe(202);
      expect((await t.json('POST', '/v1/auth/verify', { token: t.lastToken() })).statusCode, nickname).toBe(201);
    }
    // Le même nom, lui, reste pris, quelle que soit la casse.
    expect((await t.json('POST', '/v1/auth/register', { ...signup, email: 'autre@example.test', nickname: 'МАРИЯ' })).statusCode).toBe(409);
    expect((await t.json('POST', '/v1/auth/register', { ...signup, email: 'gir@example.test', nickname: 'Gir' })).statusCode).toBe(202);
    await t.app.close();
  });

  it('ne révèle pas qu\'une adresse est déjà inscrite', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup);
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    const r = await t.json('POST', '/v1/auth/register', { ...signup, nickname: 'Quelqu\'un' });
    expect(r.statusCode).toBe(202);
    expect(r.json()).toEqual({ status: 'link_sent' });
    // ... mais le lien envoyé est un lien de connexion, pas une seconde inscription.
    expect(t.mailer.sent.at(-1)?.subject).toMatch(/connexion/i);
    await t.app.close();
  });

  it('un lien ne sert qu\'une fois et expire', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup);
    const token = t.lastToken();
    expect((await t.json('POST', '/v1/auth/verify', { token })).statusCode).toBe(201);
    expect((await t.json('POST', '/v1/auth/verify', { token })).json().error).toBe('link_used');

    await t.json('POST', '/v1/auth/login', { email: signup.email });
    const token2 = t.lastToken();
    t.advance(11 * 60_000);
    expect((await t.json('POST', '/v1/auth/verify', { token: token2 })).json().error).toBe('link_expired');
    await t.app.close();
  });

  it('limite à trois liens par adresse par quart d\'heure', async () => {
    const t = await testApp();
    for (let i = 0; i < 5; i += 1) await t.json('POST', '/v1/auth/register', signup);
    expect(t.mailer.sent).toHaveLength(3);
    t.advance(16 * 60_000);
    await t.json('POST', '/v1/auth/register', signup);
    expect(t.mailer.sent).toHaveLength(4);
    await t.app.close();
  });

  it('revérifie le pseudonyme au clic : pris entre-temps → refus propre', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup);
    const first = t.lastToken();
    await t.json('POST', '/v1/auth/register', { ...signup, email: 'b@example.test' });
    const second = t.lastToken();
    expect((await t.json('POST', '/v1/auth/verify', { token: second })).statusCode).toBe(201);
    const r = await t.json('POST', '/v1/auth/verify', { token: first });
    expect(r.statusCode).toBe(409);
    expect(r.json().error).toBe('nickname_taken');
    await t.app.close();
  });
});

describe('connexion', () => {
  it('répond toujours 202, et n\'envoie un lien qu\'aux inscrits', async () => {
    const t = await testApp();
    const r = await t.json('POST', '/v1/auth/login', { email: 'inconnu@example.test' });
    expect(r.statusCode).toBe(202);
    expect(t.mailer.sent).toHaveLength(0);
    await t.app.close();
  });

  it('ouvre une session, puis la ferme', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', signup);
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    await t.json('POST', '/v1/auth/login', { email: signup.email });
    const r = await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    expect(r.statusCode).toBe(200);
    const cookie = sessionCookie(r);
    expect((await t.json('GET', '/v1/account', undefined, cookie)).statusCode).toBe(200);
    const out = await t.json('POST', '/v1/auth/logout', {}, cookie);
    expect(out.statusCode).toBe(204);
    expect((await t.json('GET', '/v1/account', undefined, cookie)).statusCode).toBe(401);
    await t.app.close();
  });

  it('refuse un jeton forgé ou mal formé sans distinguer les cas', async () => {
    const t = await testApp();
    const forged = 'A'.repeat(43);
    expect((await t.json('POST', '/v1/auth/verify', { token: forged })).json().error).toBe('link_unknown');
    expect((await t.json('POST', '/v1/auth/verify', { token: 'court' })).statusCode).toBe(400);
    await t.app.close();
  });
});

describe('protections', () => {
  it('exige du JSON sur les écritures (anti-CSRF)', async () => {
    const t = await testApp();
    const r = await t.app.inject({ method: 'POST', url: '/v1/auth/login', headers: { 'content-type': 'application/x-www-form-urlencoded' }, payload: 'email=a%40b.c' });
    expect(r.statusCode).toBe(415);
    await t.app.close();
  });

  it('pose une CSP stricte et les autres en-têtes', async () => {
    const t = await testApp();
    const r = await t.app.inject({ method: 'GET', url: '/healthz' });
    expect(r.headers['content-security-policy']).toContain("script-src 'self'");
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    await t.app.close();
  });

  it('refuse un corps avec des champs inattendus', async () => {
    const t = await testApp();
    const r = await t.json('POST', '/v1/auth/login', { email: 'a@b.cd', isAdmin: true });
    expect(r.statusCode).toBe(400);
    await t.app.close();
  });
});
