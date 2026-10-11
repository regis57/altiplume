import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { EXPIRY_MS, FIRST_WARNING_MS, SECOND_WARNING_MS, sweepInactive } from '../src/account/inactivite.ts';
import { TRAITS } from '../src/world/traits.ts';
import { ZONES } from '../src/world/aerodrome.ts';
import { readFileSync } from 'node:fs';

const DAY = 86_400_000;

async function player(locale = 'fr') {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', { email: 'dormeur@example.test', nickname: 'Dormeur', locale, ageConfirmed: true, acceptTerms: true });
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
  const mails = () => t.mailer.sent.length;
  const warned = () => (t.ctx.db.prepare('SELECT inactivity_warned AS w FROM players').get() as { w: number } | undefined)?.w;
  const exists = () => Boolean(t.ctx.db.prepare('SELECT 1 FROM players').get());
  return { ...t, cookie, mails, warned, exists };
}

describe('la suppression après 24 mois sans connexion', () => {
  it('avertit à 22 mois, encore à 23, efface à 24 — et tout suit par cascade', async () => {
    const t = await player();
    const base = t.mails();
    const sweep = () => sweepInactive(t.ctx, t.ctx.now());
    t.advance(FIRST_WARNING_MS - DAY);
    expect(await sweep()).toEqual({ warned: 0, expired: 0 });
    t.advance(2 * DAY);
    expect(await sweep()).toEqual({ warned: 1, expired: 0 });
    expect(t.mails()).toBe(base + 1);
    expect(t.mailer.sent.at(-1)!.subject).toContain('votre aérodrome attend');
    expect(t.mailer.sent.at(-1)!.text).toContain('/connexion');
    expect(t.warned()).toBe(1);
    // Un second passage le même jour n'envoie rien de plus.
    expect(await sweep()).toEqual({ warned: 0, expired: 0 });
    t.advance(SECOND_WARNING_MS - FIRST_WARNING_MS);
    expect(await sweep()).toEqual({ warned: 1, expired: 0 });
    expect(t.mailer.sent.at(-1)!.subject).toContain('dernier rappel');
    expect(t.warned()).toBe(2);
    // Pas encore 24 mois : rien.
    t.advance(EXPIRY_MS - SECOND_WARNING_MS - DAY);
    expect(await sweep()).toEqual({ warned: 0, expired: 0 });
    expect(t.exists()).toBe(true);
    t.advance(2 * DAY);
    expect(await sweep()).toEqual({ warned: 0, expired: 1 });
    expect(t.exists()).toBe(false);
    for (const table of ['sessions', 'companies', 'company_pilots', 'company_stamps']) {
      expect((t.ctx.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n, table).toBe(0);
    }
    expect((t.ctx.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE event = 'player.expired'").get() as { n: number }).n).toBe(1);
    await t.app.close();
  });

  it('remet le compteur à zéro quand la personne revient, même après un avertissement', async () => {
    const t = await player('en');
    t.advance(FIRST_WARNING_MS + DAY);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 1, expired: 0 });
    expect(t.mailer.sent.at(-1)!.subject).toContain('your aerodrome is waiting');
    // La personne se reconnecte (la session de l'époque est expirée depuis longtemps).
    expect((await t.json('POST', '/v1/auth/login', { email: 'dormeur@example.test' })).statusCode).toBe(202);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    expect((await t.json('GET', '/v1/account', undefined, cookie)).statusCode).toBe(200);
    expect(t.warned()).toBe(0);
    // Le cycle repart de cette connexion : vingt mois plus tard, toujours rien.
    t.advance(FIRST_WARNING_MS - 60 * DAY);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 0, expired: 0 });
    // Et à vingt-deux mois après le retour, un premier avertissement — pas un effacement.
    t.advance(61 * DAY);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 1, expired: 0 });
    expect(t.exists()).toBe(true);
    await t.app.close();
  });

  it('n\'efface jamais sans avoir envoyé les deux avertissements', async () => {
    const t = await player();
    t.advance(EXPIRY_MS + 10 * DAY); // le serveur a dormi deux ans d'un coup
    const first = await sweepInactive(t.ctx, t.ctx.now());
    expect(first).toEqual({ warned: 1, expired: 0 }); // le second d'abord ? non : 0 → 1 seulement
    const second = await sweepInactive(t.ctx, t.ctx.now());
    expect(second).toEqual({ warned: 1, expired: 0 });
    expect(t.exists()).toBe(true);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 0, expired: 1 });
    await t.app.close();
  });
});

describe('ce que le jeu affiche, la simulation le fait', () => {
  const sim = readFileSync(new URL('../src/game/sim.ts', import.meta.url), 'utf8');
  it('utilise chaque effet de trait quelque part', () => {
    const effects = new Set(TRAITS.flatMap((t) => Object.keys(t.effects)));
    for (const e of effects) expect(sim, `effet « ${e} » jamais lu par la simulation`).toContain(`'${e}'`);
  });
  it('utilise chaque propriété de niveau de zone', () => {
    const keys = new Set(ZONES.flatMap((z) => z.levels.flatMap((l) => Object.keys(l).filter((k) => !['level', 'cost', 'name', 'description'].includes(k)))));
    for (const k of keys) expect(sim, `propriété de zone « ${k} » jamais lue`).toContain(k);
  });
  it('fait compter le moral', () => {
    expect(sim).toContain('plan.pilot.morale');
  });
});
