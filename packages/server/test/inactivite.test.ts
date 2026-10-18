import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { afterMonths, EXPIRY_MONTHS, FIRST_WARNING_MONTHS, SECOND_WARNING_MONTHS, sweepInactive } from '../src/account/inactivite.ts';
import { TRAITS } from '../src/world/traits.ts';
import { ZONES } from '../src/world/aerodrome.ts';
import { readFileSync } from 'node:fs';

const DAY = 86_400_000;

/** Le temps qu'il faut, depuis `from`, pour atteindre `months` mois du calendrier. */
const until = (from: number, months: number) => afterMonths(from, months) - from;

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
    const seen = t.ctx.now();
    const FIRST_WARNING_MS = until(seen, FIRST_WARNING_MONTHS);
    const SECOND_WARNING_MS = until(seen, SECOND_WARNING_MONTHS);
    const EXPIRY_MS = until(seen, EXPIRY_MONTHS);
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
    t.advance(until(t.ctx.now(), FIRST_WARNING_MONTHS) + DAY);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 1, expired: 0 });
    expect(t.mailer.sent.at(-1)!.subject).toContain('your aerodrome is waiting');
    // La personne se reconnecte (la session de l'époque est expirée depuis longtemps).
    expect((await t.json('POST', '/v1/auth/login', { email: 'dormeur@example.test' })).statusCode).toBe(202);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    expect((await t.json('GET', '/v1/account', undefined, cookie)).statusCode).toBe(200);
    expect(t.warned()).toBe(0);
    // Le cycle repart de cette connexion : vingt mois plus tard, toujours rien.
    const back = t.ctx.now();
    t.advance(until(back, FIRST_WARNING_MONTHS) - 60 * DAY);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 0, expired: 0 });
    // Et à vingt-deux mois après le retour, un premier avertissement — pas un effacement.
    t.advance(61 * DAY);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 1, expired: 0 });
    expect(t.exists()).toBe(true);
    await t.app.close();
  });

  it('n\'efface jamais sans avoir envoyé les deux avertissements', async () => {
    const t = await player();
    t.advance(until(t.ctx.now(), EXPIRY_MONTHS) + 10 * DAY); // le serveur a dormi deux ans d'un coup
    const first = await sweepInactive(t.ctx, t.ctx.now());
    expect(first).toEqual({ warned: 1, expired: 0 }); // le second d'abord ? non : 0 → 1 seulement
    const second = await sweepInactive(t.ctx, t.ctx.now());
    expect(second).toEqual({ warned: 1, expired: 0 });
    expect(t.exists()).toBe(true);
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 0, expired: 1 });
    await t.app.close();
  });
});

describe('24 mois du calendrier, et une connexion pendant l\'envoi compte (revue du 18/10)', () => {
  it('rien n\'est effacé à 721 jours : le 11 octobre 2026 donne le 11 octobre 2028', async () => {
    const t = await player();
    const seen = t.ctx.now();
    expect(new Date(afterMonths(seen, EXPIRY_MONTHS)).toISOString().slice(0, 10)).toBe('2028-10-11');
    // Les deux avertissements, puis 721 jours : l'ancien calcul (720) effaçait déjà ; pas encore 24 mois.
    t.advance(until(seen, SECOND_WARNING_MONTHS) + DAY);
    await sweepInactive(t.ctx, t.ctx.now());
    await sweepInactive(t.ctx, t.ctx.now());
    expect(t.warned()).toBe(2);
    t.advance(seen + 721 * DAY - t.ctx.now());
    expect(await sweepInactive(t.ctx, t.ctx.now())).toEqual({ warned: 0, expired: 0 });
    expect(t.exists()).toBe(true);
    t.advance(until(seen, EXPIRY_MONTHS) - 721 * DAY + 60_000);
    expect((await sweepInactive(t.ctx, t.ctx.now())).expired).toBe(1);
    await t.app.close();
  });

  it('un joueur qui revient pendant que les courriels partent n\'est pas marqué averti', async () => {
    const t = await player();
    // Un second compte, au même âge, à prévenir dans le même passage.
    await t.json('POST', '/v1/auth/register', { email: 'autre@example.test', nickname: 'Autre', locale: 'fr', ageConfirmed: true, acceptTerms: true });
    await t.json('POST', '/v1/auth/verify', { token: t.lastToken() });
    t.ctx.db.prepare('UPDATE players SET last_seen_at = ?').run(t.ctx.now());
    t.advance(until(t.ctx.now(), FIRST_WARNING_MONTHS) + DAY);
    // Le courrier est lent : pendant le premier envoi, l'autre joueur se reconnecte.
    const real = t.ctx.mailer;
    let first = true;
    (t.ctx as { mailer: typeof real }).mailer = {
      send: async (m) => {
        if (first) { first = false; t.ctx.db.prepare('UPDATE players SET last_seen_at = ?, inactivity_warned = 0 WHERE nickname = ?').run(t.ctx.now(), m.to === 'autre@example.test' ? 'Dormeur' : 'Autre'); }
        return real.send(m);
      },
    };
    const r = await sweepInactive(t.ctx, t.ctx.now());
    expect(r.warned).toBe(1);
    const rows = t.ctx.db.prepare('SELECT nickname, inactivity_warned AS w FROM players ORDER BY nickname').all() as { nickname: string; w: number }[];
    expect(rows.map((x) => x.w).sort()).toEqual([0, 1]);
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
