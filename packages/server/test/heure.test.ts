import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { isNight, isTimezone, localHour } from '../src/sim/heure.ts';

/**
 * La nuit du jeu tombe à l'heure du joueur (décision du 14/10) : 21 h à 6 h, là où il
 * est. Avant, c'était 20 h à 6 h UTC pour tout le monde — 22 h à 8 h à Paris l'été.
 */
const at = (iso: string) => Date.parse(iso);

describe("l'heure du joueur", () => {
  it('lit l\'heure locale dans le fuseau donné', () => {
    expect(localHour(at('2026-10-14T19:30:00Z'), 'Europe/Paris')).toBe(21); // heure d'été : UTC+2
    expect(localHour(at('2026-12-14T19:30:00Z'), 'Europe/Paris')).toBe(20); // hiver : UTC+1
    expect(localHour(at('2026-10-14T19:30:00Z'), 'America/Montreal')).toBe(15);
  });

  it('la nuit est de 21 h à 6 h, chez le joueur', () => {
    expect(isNight(at('2026-10-14T19:30:00Z'), 'Europe/Paris')).toBe(true);   // 21 h 30 à Paris
    expect(isNight(at('2026-10-14T19:30:00Z'), 'America/Montreal')).toBe(false); // 15 h 30 à Montréal
    expect(isNight(at('2026-10-14T06:30:00Z'), 'Europe/Paris')).toBe(false);  // 8 h 30 : le matin
    expect(isNight(at('2026-10-14T03:30:00Z'), 'Europe/Paris')).toBe(true);   // 5 h 30
  });

  it("n'accepte que de vrais fuseaux", () => {
    expect(isTimezone('Europe/Paris')).toBe(true);
    expect(isTimezone('Pas/Un_Fuseau')).toBe(false);
    expect(isTimezone('<script>')).toBe(false);
    expect(isTimezone('')).toBe(false);
  });

  it('le compte garde le fuseau du navigateur, Paris par défaut', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/auth/register', { email: 'tz@example.test', nickname: 'Fuseau', locale: 'fr', ageConfirmed: true, acceptTerms: true });
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    expect((await t.json('GET', '/v1/account', undefined, cookie)).json().timezone).toBe('Europe/Paris');
    expect((await t.json('PATCH', '/v1/account', { timezone: 'America/Montreal' }, cookie)).statusCode).toBe(204);
    expect((await t.json('GET', '/v1/account', undefined, cookie)).json().timezone).toBe('America/Montreal');
    expect((await t.json('PATCH', '/v1/account', { timezone: 'Mars/Olympus' }, cookie)).json().fields).toEqual(['timezone_unsupported']);
    await t.app.close();
  });
});
