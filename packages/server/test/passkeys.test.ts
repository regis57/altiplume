import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { FakeAuthenticator } from './fakeAuthenticator.ts';
import { CHALLENGE_TTL_MS } from '../src/db/repos/passkeys.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const ORIGIN = 'http://localhost:3000';

async function signedIn() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const r = await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
  return { ...t, cookie: sessionCookie(r) };
}

/** Ajoute une passkey au joueur connecté et rend l'authenticateur qui la détient. */
async function enroll(t: Awaited<ReturnType<typeof signedIn>>, name?: string, backedUp = true) {
  const auth = new FakeAuthenticator({ origin: ORIGIN, rpId: 'localhost', backedUp });
  const opts = await t.json('POST', '/v1/passkeys/options', {}, t.cookie);
  expect(opts.statusCode).toBe(200);
  const { options, challengeToken } = opts.json();
  const r = await t.json('POST', '/v1/passkeys/register', { challengeToken, response: auth.create(options.challenge), ...(name ? { name } : {}) }, t.cookie);
  return { auth, response: r };
}

describe('passkeys — ajout', () => {
  it('exige une session pour les options comme pour l\'enregistrement', async () => {
    const t = await testApp();
    expect((await t.json('POST', '/v1/passkeys/options', {})).statusCode).toBe(401);
    expect((await t.json('GET', '/v1/passkeys')).statusCode).toBe(401);
    await t.app.close();
  });

  it('ne confie à l\'appareil que le pseudonyme, jamais l\'adresse', async () => {
    const t = await signedIn();
    const { options } = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    expect(options.rp).toEqual({ name: 'Altiplume', id: 'localhost' });
    expect(options.user.name).toBe('Régis');
    expect(JSON.stringify(options)).not.toContain('example.test');
    expect(options.authenticatorSelection.residentKey).toBe('required');
    expect(options.attestation).toBe('none');
    await t.app.close();
  });

  it('enregistre une passkey et la liste avec un nom par défaut lisible', async () => {
    const t = await signedIn();
    const { auth, response } = await enroll(t);
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: auth.id, name: 'Passkey synchronisée', backedUp: true });
    const list = (await t.json('GET', '/v1/passkeys', undefined, t.cookie)).json();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: auth.id, lastUsedAt: null });
    expect(JSON.stringify(list)).not.toContain('publicKey');
    await t.app.close();
  });

  it('accepte un nom choisi, nettoyé et borné', async () => {
    const t = await signedIn();
    const { response } = await enroll(t, '  Mon   téléphone  ' + 'x'.repeat(60));
    expect(response.json().name).toBe(('Mon téléphone ' + 'x'.repeat(60)).slice(0, 40));
    await t.app.close();
  });

  it('refuse un défi réutilisé, périmé, ou d\'un autre joueur', async () => {
    const t = await signedIn();
    const auth = new FakeAuthenticator({ origin: ORIGIN, rpId: 'localhost' });
    const { options, challengeToken } = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    const payload = { challengeToken, response: auth.create(options.challenge) };
    expect((await t.json('POST', '/v1/passkeys/register', payload, t.cookie)).statusCode).toBe(201);
    // Rejoué : le défi a été consommé.
    const replay = await t.json('POST', '/v1/passkeys/register', payload, t.cookie);
    expect(replay.statusCode).toBe(400);
    expect(replay.json().error).toBe('challenge_unknown');
    // Périmé.
    const second = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    t.advance(CHALLENGE_TTL_MS + 1);
    const late = await t.json('POST', '/v1/passkeys/register', { challengeToken: second.challengeToken, response: auth.create(second.options.challenge) }, t.cookie);
    expect(late.json().error).toBe('challenge_unknown');
    // D'un autre joueur : le défi est lié à celui qui l'a demandé.
    const third = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    await t.json('POST', '/v1/auth/register', { ...signup, email: 'autre@example.test', nickname: 'Autre' });
    const other = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    const stolen = await t.json('POST', '/v1/passkeys/register', { challengeToken: third.challengeToken, response: auth.create(third.options.challenge) }, other);
    expect(stolen.json().error).toBe('challenge_unknown');
    await t.app.close();
  });

  it('refuse une réponse signée pour une autre origine ou un autre défi', async () => {
    const t = await signedIn();
    const evil = new FakeAuthenticator({ origin: 'https://altiplume.evil', rpId: 'altiplume.evil' });
    const { options, challengeToken } = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    const r = await t.json('POST', '/v1/passkeys/register', { challengeToken, response: evil.create(options.challenge) }, t.cookie);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('passkey_rejected');

    const auth = new FakeAuthenticator({ origin: ORIGIN, rpId: 'localhost' });
    const again = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    const wrong = await t.json('POST', '/v1/passkeys/register', { challengeToken: again.challengeToken, response: auth.create('pas-le-bon-defi') }, t.cookie);
    expect(wrong.json().error).toBe('passkey_rejected');
    await t.app.close();
  });

  it('refuse un corps qui n\'est pas une réponse WebAuthn, sans planter', async () => {
    const t = await signedIn();
    const { challengeToken } = (await t.json('POST', '/v1/passkeys/options', {}, t.cookie)).json();
    const r = await t.json('POST', '/v1/passkeys/register', { challengeToken, response: { id: 'x', response: {} } }, t.cookie);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('passkey_rejected');
    expect((await t.json('POST', '/v1/passkeys/register', { challengeToken, response: 'texte' }, t.cookie)).statusCode).toBe(400);
    await t.app.close();
  });

  it('plafonne à dix passkeys par joueur', async () => {
    const t = await signedIn();
    for (let i = 0; i < 10; i += 1) expect((await enroll(t)).response.statusCode).toBe(201);
    const r = await t.json('POST', '/v1/passkeys/options', {}, t.cookie);
    expect(r.statusCode).toBe(409);
    expect(r.json().error).toBe('passkey_limit');
    await t.app.close();
  });
});

describe('passkeys — connexion', () => {
  it('connecte sans email : le navigateur choisit la clé', async () => {
    const t = await signedIn();
    const { auth } = await enroll(t);
    const opts = await t.json('POST', '/v1/auth/passkey/options', {});
    expect(opts.statusCode).toBe(200);
    const { options, challengeToken } = opts.json();
    expect(options.rpId).toBe('localhost');
    expect(options.allowCredentials ?? []).toHaveLength(0);
    const r = await t.json('POST', '/v1/auth/passkey/verify', { challengeToken, response: auth.get(options.challenge) });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ status: 'signed_in', nickname: 'Régis' });
    const cookie = sessionCookie(r);
    expect((await t.json('GET', '/v1/account', undefined, cookie)).json().nickname).toBe('Régis');
    // La clé garde la trace de son dernier usage et du compteur.
    const list = (await t.json('GET', '/v1/passkeys', undefined, cookie)).json();
    expect(list[0].lastUsedAt).toBe(t.ctx.now());
    const events = (await t.json('GET', '/v1/account/export', undefined, cookie)).json().events;
    expect(events.at(-1)).toMatchObject({ event: 'player.login', meta: JSON.stringify({ method: 'passkey' }) });
    await t.app.close();
  });

  it('refuse une clé inconnue, un défi réutilisé et une signature d\'une autre clé', async () => {
    const t = await signedIn();
    const { auth } = await enroll(t);
    const stranger = new FakeAuthenticator({ origin: ORIGIN, rpId: 'localhost' });

    let o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    let r = await t.json('POST', '/v1/auth/passkey/verify', { challengeToken: o.challengeToken, response: stranger.get(o.options.challenge) });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('passkey_unknown');
    expect(r.cookies.find((c) => c.name === 'altiplume_session')).toBeUndefined();

    // Même identifiant de clé, mais signé par une autre clé privée.
    o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    const forged = { ...stranger.get(o.options.challenge), id: auth.id, rawId: auth.id };
    r = await t.json('POST', '/v1/auth/passkey/verify', { challengeToken: o.challengeToken, response: forged });
    expect(r.json().error).toBe('passkey_rejected');

    // Défi rejoué.
    o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    const good = { challengeToken: o.challengeToken, response: auth.get(o.options.challenge) };
    expect((await t.json('POST', '/v1/auth/passkey/verify', good)).statusCode).toBe(200);
    expect((await t.json('POST', '/v1/auth/passkey/verify', good)).json().error).toBe('challenge_unknown');
    await t.app.close();
  });

  it('refuse une signature dont le compteur recule (clé clonée)', async () => {
    const t = await signedIn();
    const { auth } = await enroll(t);
    let o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    auth.counter = 5;
    expect((await t.json('POST', '/v1/auth/passkey/verify', { challengeToken: o.challengeToken, response: auth.get(o.options.challenge) })).statusCode).toBe(200);
    o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    auth.counter = 1; // la prochaine signature portera 2 < 6
    const r = await t.json('POST', '/v1/auth/passkey/verify', { challengeToken: o.challengeToken, response: auth.get(o.options.challenge) });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('passkey_rejected');
    await t.app.close();
  });

  it('une passkey supprimée ou dont le compte est effacé ne connecte plus', async () => {
    const t = await signedIn();
    const { auth } = await enroll(t);
    const { auth: second } = await enroll(t);
    expect((await t.json('DELETE', `/v1/passkeys/${encodeURIComponent(auth.id)}`, {}, t.cookie)).statusCode).toBe(204);
    expect((await t.json('DELETE', `/v1/passkeys/${encodeURIComponent(auth.id)}`, {}, t.cookie)).statusCode).toBe(404);
    let o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    expect((await t.json('POST', '/v1/auth/passkey/verify', { challengeToken: o.challengeToken, response: auth.get(o.options.challenge) })).json().error).toBe('passkey_unknown');

    expect((await t.json('DELETE', '/v1/account', { confirmNickname: 'Régis' }, t.cookie)).statusCode).toBe(204);
    o = (await t.json('POST', '/v1/auth/passkey/options', {})).json();
    expect((await t.json('POST', '/v1/auth/passkey/verify', { challengeToken: o.challengeToken, response: second.get(o.options.challenge) })).json().error).toBe('passkey_unknown');
    await t.app.close();
  });
});

describe('passkeys — gestion', () => {
  it('renomme sa propre clé, pas celle d\'un autre', async () => {
    const t = await signedIn();
    const { auth } = await enroll(t);
    const url = `/v1/passkeys/${encodeURIComponent(auth.id)}`;
    expect((await t.json('PATCH', url, { name: ' Pixel de Régis ' }, t.cookie)).statusCode).toBe(204);
    expect((await t.json('GET', '/v1/passkeys', undefined, t.cookie)).json()[0].name).toBe('Pixel de Régis');
    expect((await t.json('PATCH', url, { name: '   ' }, t.cookie)).statusCode).toBe(400);

    await t.json('POST', '/v1/auth/register', { ...signup, email: 'autre@example.test', nickname: 'Autre' });
    const other = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    expect((await t.json('PATCH', url, { name: 'Volée' }, other)).statusCode).toBe(404);
    expect((await t.json('DELETE', url, {}, other)).statusCode).toBe(404);
    expect((await t.json('GET', '/v1/passkeys', undefined, other)).json()).toEqual([]);
    await t.app.close();
  });

  it('figure dans l\'export, sans la clé publique', async () => {
    const t = await signedIn();
    await enroll(t, 'Mon téléphone', false);
    const data = (await t.json('GET', '/v1/account/export', undefined, t.cookie)).json();
    expect(data.passkeys).toHaveLength(1);
    expect(data.passkeys[0]).toMatchObject({ name: 'Mon téléphone', device_type: 'singleDevice', backed_up: 0 });
    expect(data.passkeys[0].public_key).toBeUndefined();
    expect(data.events.map((e: { event: string }) => e.event)).toContain('passkey.added');
    await t.app.close();
  });
});
