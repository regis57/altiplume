import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';

/**
 * La ligne régulière : « Pas de contrat, pas de prime », et aucun délai affiché.
 * Jusqu'au 18 octobre 2026, elle comptait pourtant comme un délai tenu : +1 de moral,
 * un pas vers la page « À l'heure », et « délai tenu » dans les nouvelles. Trente
 * sauts à Pont-de-Brume suffisaient à remplir le moral et à coller la page.
 */
const signup = { email: 'ligne@example.test', nickname: 'Ligne', locale: 'fr', ageConfirmed: true, acceptTerms: true };

interface State {
  planes: { id: string }[];
  pilots: { id: string; morale: number }[];
  album: { id: string }[];
  news: { kind: string; bonus?: boolean; incident?: boolean; stamp?: string }[];
}

async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Ligne' }, cookie);
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json() as Promise<State>;
  const counter = () => (t.ctx.db.prepare('SELECT deadlines_met AS n FROM companies').get() as { n: number }).n;
  /** Envoie une carte, attend le retour au sol, et rend l'état d'après. */
  const fly = async (card: string) => {
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    if (card !== 'c-ligne-reguliere') t.ctx.db.prepare('INSERT INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
    const s = await state();
    const r = await t.json('POST', '/v1/company/flights', { card, plane: s.planes[0]!.id, pilot: s.pilots[0]!.id }, cookie);
    expect(r.statusCode, JSON.stringify(r.json())).toBe(201);
    t.advance(6 * 3_600_000);
    t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
    return state();
  };
  return { ...t, state, counter, fly };
}

describe('la ligne régulière ne tient pas de délai', () => {
  it('ni moral, ni compteur de délais, ni « délai tenu » dans les nouvelles', async () => {
    const t = await company();
    t.ctx.db.prepare('UPDATE company_pilots SET morale = 10').run();
    const s = await t.fly('c-ligne-reguliere');
    const arrived = s.news.find((n) => n.kind === 'flight.arrived');
    expect(arrived?.bonus).toBe(false);
    // Un incident coûte toujours son point de moral ; l'heure n'en rapporte plus.
    expect(s.pilots[0]!.morale).toBe(10 - (arrived?.incident ? 1 : 0));
    expect(t.counter()).toBe(0);
  });

  it('« À l’heure » reste au bout des contrats, et seulement d’eux', async () => {
    const t = await company();
    t.ctx.db.prepare('UPDATE company_pilots SET morale = 10').run();
    t.ctx.db.prepare('UPDATE companies SET deadlines_met = 9').run();
    // La ligne régulière ne fait pas le dixième.
    const s1 = await t.fly('c-ligne-reguliere');
    expect(t.counter()).toBe(9);
    expect(s1.album.some((a) => a.id === 's-delai')).toBe(false);
    // Un contrat livré dans son délai, si : moral +1 et la page.
    const s2 = await t.fly('c-journal');
    const arrived = s2.news.find((n) => n.kind === 'flight.arrived');
    expect(arrived?.bonus).toBe(true);
    const before = 10 - (s1.news.find((n) => n.kind === 'flight.arrived')?.incident ? 1 : 0);
    expect(s2.pilots[0]!.morale).toBe(before + 1 - (arrived?.incident ? 1 : 0));
    expect(t.counter()).toBe(10);
    expect(s2.album.some((a) => a.id === 's-delai')).toBe(true);
  });
});
