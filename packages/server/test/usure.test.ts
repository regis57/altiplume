import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { DatabaseSync } from 'node:sqlite';
import { currentWear } from '../src/game/sim.ts';
import { MIGRATIONS } from '../src/db/migrations.ts';

/**
 * L'usure redescend au sol (règle du 18 octobre 2026). Avant, elle ne faisait que
 * monter : un avion usé le restait pour toujours, et le risque d'incident avec lui,
 * alors que la conception promettait « l'entretien au hangar » et une absence jamais
 * punie. Dix points par heure au sol, × 1,25 avec l'établi, × 1,5 avec l'atelier.
 */
const signup = { email: 'usure@example.test', nickname: 'Usure', locale: 'fr', ageConfirmed: true, acceptTerms: true };
const HOUR = 3_600_000;

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Usure' }, cookie);
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json() as Promise<{ planes: { id: string; wear: number }[]; pilots: { id: string }[] }>;
  /** Un avion usé jusqu'à `wear`, posé maintenant. */
  const worn = (wear: number) => t.ctx.db.prepare('UPDATE company_planes SET wear = ?, wear_at = ?').run(wear, t.ctx.now());
  const hangar = (level: number) => t.ctx.db.prepare("UPDATE company_zones SET level = ? WHERE zone = 'hangar'").run(level);
  return { ...t, cookie, state, worn, hangar };
}

describe("l'usure redescend au sol", () => {
  it('dix points par heure, multipliés par l’entretien, jamais sous zéro', () => {
    const t0 = Date.UTC(2026, 9, 18, 9);
    expect(currentWear({ wear: 100, wear_at: t0 }, t0 + 10 * HOUR, 1)).toBe(0);
    expect(currentWear({ wear: 100, wear_at: t0 }, t0 + 30 * HOUR, 1)).toBe(0);
    expect(currentWear({ wear: 100, wear_at: t0 }, t0 + HOUR, 1)).toBe(90);
    expect(currentWear({ wear: 100, wear_at: t0 }, t0 + HOUR, 1.25)).toBe(88); // 12,5 points : l'usure reste entière
    expect(currentWear({ wear: 100, wear_at: t0 }, t0 + HOUR, 1.5)).toBe(85);
    // Avant le retour au sol, rien ne bouge.
    expect(currentWear({ wear: 60, wear_at: t0 + HOUR }, t0, 1.5)).toBe(60);
  });

  it('un avion à 100, dix heures au sol : 0', async () => {
    const t = await company();
    t.worn(100);
    t.advance(10 * HOUR);
    expect((await t.state()).planes[0]!.wear).toBe(0);
  });

  it('une heure au sol avec l’atelier (le hangar au plus haut) : 85', async () => {
    const t = await company();
    t.hangar(3);
    t.worn(100);
    t.advance(HOUR);
    expect((await t.state()).planes[0]!.wear).toBe(85);
  });

  it('une page rechargée chaque minute ne perd rien à l’arrondi', async () => {
    const t = await company();
    t.worn(100);
    for (let i = 0; i < 60; i += 1) { t.advance(60_000); await t.state(); }
    expect((await t.state()).planes[0]!.wear).toBe(90);
  });

  it('la migration fait partir les avions déjà là de maintenant, ou de leur retour s’ils volent', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = OFF'); // un avion et un vol sans compagnie : seule la migration compte ici
    for (const m of MIGRATIONS.filter((x) => x.version < 17)) { db.exec(m.sql); m.run?.(db); }
    const later = Date.now() + 5 * HOUR;
    db.exec("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) VALUES ('sol', 'c', 'grive', 40, 0), ('air', 'c', 'grive', 40, 0)");
    db.prepare(`INSERT INTO flights (id, company_id, card, plane_id, pilot_id, destination, departed_at, duration_ms, deadline_at, reward, bonus)
      VALUES ('v', 'c', 'c-journal', 'air', 'p', 'pont-de-brume', ?, ?, 0, 0, 0)`).run(later - 2 * HOUR, HOUR);
    const before = Date.now();
    db.exec(MIGRATIONS.find((x) => x.version === 17)!.sql);
    const at = (id: string) => (db.prepare('SELECT wear, wear_at FROM company_planes WHERE id = ?').get(id) as { wear: number; wear_at: number });
    expect(at('sol').wear).toBe(40);
    expect(at('sol').wear_at).toBeGreaterThanOrEqual(Math.floor(before / 1000) * 1000);
    expect(at('sol').wear_at).toBeLessThanOrEqual(Date.now());
    expect(at('air').wear_at).toBe(later);
  });

  it('un avion en vol ne récupère pas pendant le vol ; au retour, si', async () => {
    const t = await company();
    t.worn(50);
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare("INSERT INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), 'c-medicaments', ?)").run(t.ctx.now());
    const s = await t.state();
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-medicaments', plane: s.planes[0]!.id, pilot: s.pilots[0]!.id }, t.cookie);
    expect(r.statusCode, JSON.stringify(r.json())).toBe(201);
    const flight = t.ctx.db.prepare('SELECT departed_at, duration_ms FROM flights').get() as { departed_at: number; duration_ms: number };
    const back = flight.departed_at + 2 * flight.duration_ms;
    const after = (await t.state()).planes[0]!.wear;
    expect(after).toBeGreaterThan(50); // le vol a usé l'avion
    // Juste avant le retour au sol : toujours la même usure.
    t.advance(back - t.ctx.now() - 1);
    expect((await t.state()).planes[0]!.wear).toBe(after);
    // Une heure après le retour : dix points de moins.
    t.advance(HOUR + 1);
    expect((await t.state()).planes[0]!.wear).toBe(after - 10);
  });
});
