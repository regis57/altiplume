import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { DEVICE_CODE_TTL_MS, purgeExpiredDeviceCodes } from '../src/db/repos/deviceCodes.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

/** Un joueur connecté sur son « téléphone », et un « PC » anonyme qui demande un code. */
async function scene() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const phone = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  const start = await t.json('POST', '/v1/auth/device/start', {});
  expect(start.statusCode).toBe(201);
  const pc = start.json() as { deviceCode: string; pollToken: string; userCode: string; expiresAt: number; approveUrl: string };
  return { ...t, phone, pc };
}

describe('connexion par QR (appareil)', () => {
  it('démarre avec trois secrets distincts et un code à six chiffres', async () => {
    const t = await scene();
    expect(t.pc.userCode).toMatch(/^\d{6}$/);
    expect(t.pc.deviceCode).not.toBe(t.pc.pollToken);
    expect(t.pc.approveUrl).toBe(`http://localhost:3000/approuver#code=${t.pc.deviceCode}`);
    expect(t.pc.approveUrl).not.toContain(t.pc.pollToken);
    expect(t.pc.expiresAt).toBe(t.ctx.now() + DEVICE_CODE_TTL_MS);
    expect((await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.pollToken })).json()).toEqual({ status: 'pending' });
    await t.app.close();
  });

  it('le téléphone voit le même code, approuve, et le PC reçoit une session — une seule fois', async () => {
    const t = await scene();
    const peek = await t.json('POST', '/v1/auth/device/peek', { deviceCode: t.pc.deviceCode }, t.phone);
    expect(peek.statusCode).toBe(200);
    expect(peek.json()).toEqual({ userCode: t.pc.userCode });

    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.deviceCode, approve: true }, t.phone)).statusCode).toBe(204);
    // Une seconde décision n'est plus possible.
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.deviceCode, approve: false }, t.phone)).statusCode).toBe(404);
    expect((await t.json('POST', '/v1/auth/device/peek', { deviceCode: t.pc.deviceCode }, t.phone)).statusCode).toBe(409);

    const poll = await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.pollToken });
    expect(poll.json()).toEqual({ status: 'approved' });
    const pcCookie = sessionCookie(poll);
    expect((await t.json('GET', '/v1/account', undefined, pcCookie)).json().nickname).toBe('Régis');
    // Le PC et le téléphone ont des sessions différentes.
    expect(pcCookie).not.toBe(t.phone);
    // Rejouer l'interrogation ne donne pas une seconde session.
    const again = await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.pollToken });
    expect(again.json()).toEqual({ status: 'expired' });
    expect(again.cookies.find((c) => c.name === 'altiplume_session')).toBeUndefined();
    await t.app.close();
  });

  it('un refus est transmis au PC, sans session', async () => {
    const t = await scene();
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.deviceCode, approve: false }, t.phone)).statusCode).toBe(204);
    const poll = await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.pollToken });
    expect(poll.json()).toEqual({ status: 'denied' });
    expect(poll.cookies.find((c) => c.name === 'altiplume_session')).toBeUndefined();
    await t.app.close();
  });

  it('exige d\'être connecté sur le téléphone', async () => {
    const t = await scene();
    expect((await t.json('POST', '/v1/auth/device/peek', { deviceCode: t.pc.deviceCode })).statusCode).toBe(401);
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.deviceCode, approve: true })).statusCode).toBe(401);
    expect((await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.pollToken })).json()).toEqual({ status: 'pending' });
    await t.app.close();
  });

  it('le jeton d\'interrogation ne sert pas à approuver, ni le code d\'appareil à interroger', async () => {
    const t = await scene();
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.pollToken, approve: true }, t.phone)).statusCode).toBe(404);
    expect((await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.deviceCode })).json()).toEqual({ status: 'expired' });
    expect((await t.json('POST', '/v1/auth/device/peek', { deviceCode: 'x'.repeat(43) }, t.phone)).statusCode).toBe(404);
    await t.app.close();
  });

  it('expire après quatre-vingt-dix secondes, même déjà approuvé', async () => {
    const t = await scene();
    t.advance(DEVICE_CODE_TTL_MS + 1);
    expect((await t.json('POST', '/v1/auth/device/peek', { deviceCode: t.pc.deviceCode }, t.phone)).statusCode).toBe(404);
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.deviceCode, approve: true }, t.phone)).statusCode).toBe(404);
    expect((await t.json('POST', '/v1/auth/device/poll', { pollToken: t.pc.pollToken })).json()).toEqual({ status: 'expired' });

    // Approuvé à temps mais récupéré trop tard : pas de session.
    const late = await t.json('POST', '/v1/auth/device/start', {});
    const pc2 = late.json() as { deviceCode: string; pollToken: string };
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: pc2.deviceCode, approve: true }, t.phone)).statusCode).toBe(204);
    t.advance(DEVICE_CODE_TTL_MS + 1);
    const poll = await t.json('POST', '/v1/auth/device/poll', { pollToken: pc2.pollToken });
    expect(poll.json()).toEqual({ status: 'expired' });
    expect(poll.cookies.find((c) => c.name === 'altiplume_session')).toBeUndefined();

    // Le ménage efface les demandes mortes depuis plus de dix minutes.
    expect(purgeExpiredDeviceCodes(t.ctx.db, t.ctx.now())).toBe(0);
    t.advance(600_000);
    expect(purgeExpiredDeviceCodes(t.ctx.db, t.ctx.now())).toBe(2);
    await t.app.close();
  });

  it('refuse un corps mal formé', async () => {
    const t = await scene();
    expect((await t.json('POST', '/v1/auth/device/start', { extra: 1 })).statusCode).toBe(400);
    expect((await t.json('POST', '/v1/auth/device/poll', { pollToken: 'court' })).statusCode).toBe(400);
    expect((await t.json('POST', '/v1/auth/device/approve', { deviceCode: t.pc.deviceCode, approve: 'oui' }, t.phone)).statusCode).toBe(400);
    await t.app.close();
  });
});
