import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { drawCards } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

/** Une compagnie riche, deux Grives, deux pilotes, un hangar à deux places. */
async function fleet() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Le Convoi & Cie' }, cookie);
  t.ctx.db.prepare('DELETE FROM company_hand').run();
  t.ctx.db.prepare('UPDATE companies SET francs = 20000').run();
  const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  await t.json('POST', '/v1/company/zones/hangar/upgrade', { level: 2 }, cookie);
  give('o-grive');
  expect((await t.json('POST', '/v1/company/cards/o-grive/play', {}, cookie)).statusCode).toBe(200);
  give('o-pilote');
  expect((await t.json('POST', '/v1/company/cards/o-pilote/play', {}, cookie)).statusCode).toBe(200);
  const s = await state();
  const [g1, g2] = s.planes.map((p: { id: string }) => p.id) as [string, string];
  const [prosper, second] = s.pilots.map((p: { id: string }) => p.id) as [string, string];
  const fly = (body: Record<string, string>) => {
    t.ctx.db.prepare("DELETE FROM company_hand WHERE card LIKE 'e-%'").run();
    give(body['card']!);
    return t.json('POST', '/v1/company/flights', body, cookie);
  };
  return { ...t, cookie, give, state, fly, g1, g2, prosper, second };
}

describe('le fret lourd — le convoi', () => {
  it('refuse un sac trop lourd pour un seul avion, et le fait partir à deux', async () => {
    const t = await fleet();
    // Le pressoir des Tilleuls : trois caisses, une Grive en porte deux.
    let r = await t.fly({ card: 'c-pressoir', plane: t.g1, pilot: t.prosper });
    expect(r.json().error).toBe('plane_too_small');
    const before = (await t.state()).francs;
    r = await t.fly({ card: 'c-pressoir', plane: t.g1, pilot: t.prosper, wingPlane: t.g2, wingPilot: t.second });
    expect(r.statusCode).toBe(201);
    const s = r.json();
    // Un seul vol à l'écran, qui porte son ailier ; mais deux avions et deux pilotes occupés.
    expect(s.flights).toHaveLength(1);
    expect(s.flights[0].wing).toEqual({ plane: t.g2, pilot: t.second });
    expect(s.planes.every((p: { busyUntil: number | null }) => p.busyUntil === s.flights[0].busyUntil)).toBe(true);
    expect(s.pilots.every((p: { busyUntil: number | null }) => p.busyUntil === s.flights[0].busyUntil)).toBe(true);
    // Deux salaires, deux entretiens.
    expect(before - s.francs).toBeGreaterThan(20);
    const spent = before - s.francs;
    // Personne d'autre ne peut décoller pendant ce temps.
    expect((await t.fly({ card: 'c-journal', plane: t.g2, pilot: t.prosper })).json().error).toBe('plane_busy');

    t.advance(2 * 60 * 60_000);
    const after = await t.state();
    // Encaissé une seule fois : la récompense et la prime, pas deux fois.
    expect(after.francs).toBe(s.francs + 188 + 38);
    expect(after.francs - before).toBe(188 + 38 - spent);
    const arrived = after.news.filter((n: { kind: string }) => n.kind === 'flight.arrived');
    expect(arrived).toHaveLength(1);
    expect(arrived[0].wing.pilot).toBeTruthy();
    expect(after.album.map((a: { id: string }) => a.id)).toContain('s-convoi');
    // Les deux pilotes ont volé : affinité +1 chacun, et de la fatigue chacun.
    expect(after.pilots.map((p: { affinity: number }) => p.affinity)).toEqual([1, 1]);
    const fatigue = t.ctx.db.prepare('SELECT fatigue FROM company_pilots').all() as { fatigue: number }[];
    for (const f of fatigue) expect(f.fatigue).toBeGreaterThan(0);
    // Et une seule ligne au livre de bord pour l'arrivée.
    expect(after.logbook.filter((l: { kind: string }) => l.kind === 'flight.arrived')).toHaveLength(1);
    await t.app.close();
  });

  it("n'accepte un ailier que s'il en faut un, et jamais le même avion ni le même pilote", async () => {
    const t = await fleet();
    expect((await t.fly({ card: 'c-journal', plane: t.g1, pilot: t.prosper, wingPlane: t.g2, wingPilot: t.second })).json().error).toBe('convoy_not_needed');
    expect((await t.fly({ card: 'c-pressoir', plane: t.g1, pilot: t.prosper, wingPlane: t.g1, wingPilot: t.second })).json().error).toBe('convoy_same');
    expect((await t.fly({ card: 'c-pressoir', plane: t.g1, pilot: t.prosper, wingPlane: t.g2, wingPilot: t.prosper })).json().error).toBe('convoy_same');
    // Les deux champs vont ensemble.
    expect((await t.fly({ card: 'c-pressoir', plane: t.g1, pilot: t.prosper, wingPlane: t.g2 })).statusCode).toBe(400);
    // Six sacs pour la Combe : deux Grives n'en portent que quatre.
    expect((await t.fly({ card: 'c-chaudiere', plane: t.g1, pilot: t.prosper, wingPlane: t.g2, wingPilot: t.second })).json().error).toBe('plane_too_small');
    await t.app.close();
  });

  it("refuse le convoi quand l'ailier n'a pas de quoi partir, sans rien débiter", async () => {
    const t = await fleet();
    t.ctx.db.prepare('UPDATE companies SET francs = 20').run();
    expect((await t.fly({ card: 'c-pressoir', plane: t.g1, pilot: t.prosper, wingPlane: t.g2, wingPilot: t.second })).json().error).toBe('not_enough_francs');
    expect((await t.state()).francs).toBe(20);
    await t.app.close();
  });
});

describe('le fret lourd — la cloche de Sainte-Lueur', () => {
  it("ne tire le bronze qu'après Sonnefeuille, et la cloche qu'après la coulée", () => {
    const regions = ['brume', 'saline', 'archipel', 'cuivre'] as const;
    const seen = (album: string[]) => {
      const s = new Set<string>();
      for (let seed = 0; seed < 3000; seed += 1) for (const id of drawCards(makeRng(seed), [], 1, 3, regions, album)) s.add(id);
      return s;
    };
    const none = seen([]);
    expect(none.has('c-bronze')).toBe(false);
    expect(none.has('c-cloche')).toBe(false);
    const sonne = seen(['s-sonnefeuille']);
    expect(sonne.has('c-bronze')).toBe(true);
    expect(sonne.has('c-cloche')).toBe(false);
    expect(seen(['s-sonnefeuille', 's-fonderie']).has('c-cloche')).toBe(true);
  });
});
