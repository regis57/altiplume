import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { fatigueFactor } from '../src/game/sim.ts';
import { findDestination, findPilot, findTrait } from '../src/world/index.ts';

/**
 * « Cœur de village » : « se fatigue un quart plus vite hors des Vallées de Brume ».
 * Jusqu'au 18 octobre 2026, le texte disait « loin de chez soi » et le code pesait
 * × 1,25 sur tous les vols, même le saut à Pont-de-Brume. Le code suit le texte.
 */
const signup = { email: 'coeur@example.test', nickname: 'Coeur', locale: 'fr', ageConfirmed: true, acceptTerms: true };

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Coeur' }, cookie);
  t.ctx.db.prepare("INSERT INTO company_regions (company_id, region, opened_at) VALUES ((SELECT id FROM companies), 'saline', 0)").run();
  /** Envoie Prosper (Cœur de village) avec la Grive ; rend la fatigue prise et la durée de l'aller. */
  const fly = async (card: string) => {
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0, fatigue_at = 0').run();
    t.ctx.db.prepare('INSERT INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
    const s = (await t.json('GET', '/v1/company', undefined, cookie)).json();
    const r = await t.json('POST', '/v1/company/flights', { card, plane: s.planes[0].id, pilot: s.pilots[0].id }, cookie);
    expect(r.statusCode, JSON.stringify(r.json())).toBe(201);
    const flight = t.ctx.db.prepare('SELECT duration_ms FROM flights ORDER BY departed_at DESC LIMIT 1').get() as { duration_ms: number };
    const pilot = t.ctx.db.prepare('SELECT fatigue FROM company_pilots').get() as { fatigue: number };
    t.advance(12 * 3_600_000);
    return { fatigue: pilot.fatigue, flightMinutes: (2 * flight.duration_ms) / 60_000 };
  };
  return { ...t, fly };
}

describe('Cœur de village', () => {
  it('le texte nomme la région, et le trait ne pèse plus partout', () => {
    const trait = findTrait('homeheart')!;
    expect(trait.description.fr).toContain('hors des Vallées de Brume');
    expect(trait.description.en).toContain('out of Mistvale');
    expect(trait.effects.fatigue).toBeUndefined();
    const prosper = findPilot('prosper')!;
    expect(prosper.traits).toContain('homeheart');
    expect(fatigueFactor(prosper, findDestination('pont-de-brume')!)).toBe(1);
    expect(fatigueFactor(prosper, findDestination('port-sel')!)).toBe(1.25);
  });

  it('dans la vallée, la fatigue est celle du vol ; hors de la vallée, un quart de plus', async () => {
    const t = await company();
    const home = await t.fly('c-journal');
    expect(home.fatigue).toBe(Math.round(home.flightMinutes));
    const away = await t.fly('c-capitainerie');
    expect(away.fatigue).toBe(Math.round(away.flightMinutes * 1.25));
  });
});
