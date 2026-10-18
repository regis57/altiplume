import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { WORLD } from '../src/world/index.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
  return { ...t, cookie, state: async () => (await t.json('GET', '/v1/company', undefined, cookie)).json() };
}

describe('restaurer et décorer', () => {
  it('monte la piste niveau par niveau, au prix du monde, et refuse au-delà', async () => {
    const t = await company();
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', { level: 2 }, t.cookie)).json().error).toBe('not_enough_francs'); // 900 > 300
    t.ctx.db.prepare('UPDATE companies SET francs = 5000').run();
    const r = await t.json('POST', '/v1/company/zones/runway/upgrade', { level: 2 }, t.cookie);
    expect(r.statusCode).toBe(200);
    expect(r.json().zones.runway).toBe(2);
    expect(r.json().francs).toBe(5000 - 900);
    expect(r.json().logbook[0]).toMatchObject({ kind: 'build.zone', francs: -900, ref: 'runway:2' });
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', { level: 3 }, t.cookie)).json().zones.runway).toBe(3);
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', { level: 4 }, t.cookie)).json().error).toBe('zone_max');
    // La tour existe depuis le 12/10 ; le café, pas encore.
    expect((await t.json('POST', '/v1/company/zones/cafe/upgrade', { level: 2 }, t.cookie)).statusCode).toBe(404);
    expect((await t.state()).francs).toBe(5000 - 900 - 2400);
    await t.app.close();
  });

  it('une restauration rejouée ne monte pas un niveau de plus que le bouton', async () => {
    const t = await company();
    t.ctx.db.prepare('UPDATE companies SET francs = 5000').run(); // de quoi payer aussi le niveau 3
    // « Restaurer · 900 F » (niveau 2), envoyé deux fois : la première réponse s'est perdue.
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', { level: 2 }, t.cookie)).statusCode).toBe(200);
    const replay = await t.json('POST', '/v1/company/zones/runway/upgrade', { level: 2 }, t.cookie);
    expect(replay.statusCode).toBe(409);
    expect(replay.json().error).toBe('zone_changed');
    const s = await t.state();
    expect(s.zones.runway).toBe(2);
    expect(s.francs).toBe(5000 - 900);
    // Sans niveau dit, rien ne monte.
    expect((await t.json('POST', '/v1/company/zones/runway/upgrade', {}, t.cookie)).statusCode).toBe(400);
    expect((await t.state()).zones.runway).toBe(2);
    await t.app.close();
  });

  it('le hangar agrandi permet un avion de plus', async () => {
    const t = await company();
    t.ctx.db.prepare('UPDATE companies SET francs = 5000').run();
    t.ctx.db.prepare("INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) SELECT id, 'o-martinet', 0 FROM companies").run();
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().error).toBe('hangar_full');
    expect((await t.json('POST', '/v1/company/zones/hangar/upgrade', { level: 2 }, t.cookie)).json().zones.hangar).toBe(2);
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().planes).toHaveLength(2);
    await t.app.close();
  });

  it('pose chaque décoration une fois, et remonte un peu le moral', async () => {
    const t = await company();
    const r0 = await t.json('POST', '/v1/company/decorations/d-fleurs', {}, t.cookie); // 20 F sur 300
    expect(r0.statusCode).toBe(200);
    expect(r0.json().decorations).toEqual(['d-fleurs']);
    expect(r0.json().francs).toBe(280);
    expect(r0.json().pilots[0].morale).toBe(11);
    expect((await t.json('POST', '/v1/company/decorations/d-fleurs', {}, t.cookie)).json().error).toBe('decoration_owned');
    t.ctx.db.prepare('UPDATE companies SET francs = 10').run();
    expect((await t.json('POST', '/v1/company/decorations/d-peinture', {}, t.cookie)).json().error).toBe('not_enough_francs');
    expect((await t.json('POST', '/v1/company/decorations/d-licorne', {}, t.cookie)).statusCode).toBe(404);
    t.ctx.db.prepare('UPDATE companies SET francs = 9999').run();
    for (const d of WORLD.decorations) await t.json('POST', `/v1/company/decorations/${d.id}`, {}, t.cookie);
    const s = await t.state();
    expect(s.decorations).toHaveLength(WORLD.decorations.length);
    expect(s.pilots[0].morale).toBeLessThanOrEqual(20);
    expect((await t.json('GET', '/v1/account/export', undefined, t.cookie)).json().game.decorations).toHaveLength(WORLD.decorations.length);
    await t.app.close();
  });
});

describe('la tour', () => {
  it('se restaure en vigie puis en tour à feu, et rend le temps et la nuit moins risqués', async () => {
    const { incidentRisk } = await import('../src/game/sim.ts');
    const { findDestination, findPilot, findPlane } = await import('../src/world/index.ts');
    const tour = WORLD.zones.find((z) => z.id === 'tour')!;
    expect(tour.levels.map((l) => [l.level, l.cost, l.weather ?? 1, l.night ?? 1])).toEqual([[1, 0, 1, 1], [2, 1200, 0.75, 1], [3, 3000, 0.75, 0.7]]);
    // Le feu de la tour : la nuit aux lanternes, le risque baisse d'un tiers ; le jour, rien ne change.
    const base = {
      model: findPlane('grive')!, template: findPilot('prosper')!, plane: { id: 'p', model: 'grive', wear: 0 },
      pilot: { id: 'x', pilot: 'prosper', affinity: 0, morale: 10, fatigue: 0, fatigue_at: 0, scenes_seen: 0 },
      destination: findDestination('lanterne-du-val')!,
    };
    const nuit = Date.UTC(2026, 9, 12, 22); const midi = Date.UTC(2026, 9, 12, 12);
    expect(incidentRisk({ ...base, tower: { weather: 0.75, night: 0.7 } }, nuit)).toBeCloseTo(0.7 * incidentRisk(base, nuit), 10);
    expect(incidentRisk({ ...base, tower: { weather: 0.75, night: 0.7 } }, midi)).toBeCloseTo(incidentRisk(base, midi), 10);
  });

  it('monte au prix du monde, pour chaque compagnie, même fondée avant elle', async () => {
    const t = await company();
    t.ctx.db.prepare('UPDATE companies SET francs = 5000').run();
    let r = await t.json('POST', '/v1/company/zones/tour/upgrade', { level: 2 }, t.cookie);
    expect(r.statusCode).toBe(200);
    expect(r.json().zones.tour).toBe(2);
    r = await t.json('POST', '/v1/company/zones/tour/upgrade', { level: 3 }, t.cookie);
    expect(r.json().zones.tour).toBe(3);
    expect(r.json().francs).toBe(5000 - 1200 - 3000);
    expect((await t.json('POST', '/v1/company/zones/tour/upgrade', { level: 4 }, t.cookie)).json().error).toBe('zone_max');
    await t.app.close();
  });
});
