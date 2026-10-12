import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { drawCards } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { cardRegion, findCard } from '../src/world/index.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

/** Une compagnie riche, la main vide, et de quoi forcer le jeu sans tirage. */
async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Les Ailes de Saline' }, cookie);
  t.ctx.db.prepare('DELETE FROM company_hand').run();
  t.ctx.db.prepare('UPDATE companies SET francs = 20000').run();
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  const clearEvents = () => t.ctx.db.prepare("DELETE FROM company_hand WHERE card LIKE 'e-%'").run();
  /** Colle la page « Toute la vallée » et met des cachets en caisse, sans voler six fois. */
  const wholeValley = (stamps: number) => {
    t.ctx.db.prepare("INSERT OR IGNORE INTO company_stamps (company_id, stamp, earned_at) VALUES ((SELECT id FROM companies), 's-vallee', ?)").run(t.ctx.now());
    t.ctx.db.prepare('UPDATE companies SET stamps = ?').run(stamps);
  };
  const open = () => t.json('POST', '/v1/company/regions/saline/open', {}, cookie);
  const fly = async (card: string, plane: string, pilot: string) => {
    clearEvents(); give(card);
    return t.json('POST', '/v1/company/flights', { card, plane, pilot }, cookie);
  };
  return { ...t, cookie, state, give, clearEvents, wholeValley, open, fly };
}

describe('la Côte de Saline — la route', () => {
  it('ne tire jamais une carte de la Côte tant que la route est fermée, et en tire une fois ouverte', () => {
    let saline = 0;
    for (let seed = 0; seed < 500; seed += 1) {
      for (const id of drawCards(makeRng(seed), [], 1)) expect(cardRegion(findCard(id)!)).toBe('brume');
      saline += drawCards(makeRng(seed), [], 1, 3, ['brume', 'saline']).filter((id) => cardRegion(findCard(id)!) === 'saline').length;
    }
    expect(saline).toBeGreaterThan(100);
  });

  it("s'ouvre contre dix cachets, seulement après « Toute la vallée », et une seule fois", async () => {
    const t = await company();
    expect((await t.state()).regions).toEqual(['brume']);
    // Pas la page : refusé, même avec des cachets.
    t.ctx.db.prepare('UPDATE companies SET stamps = 30').run();
    let r = await t.open();
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('route_requires');
    // La page mais pas les cachets.
    t.wholeValley(9);
    r = await t.open();
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('not_enough_stamps');
    // Les deux : la route s'ouvre, les cachets partent, la page de la route arrive.
    t.wholeValley(10);
    r = await t.open();
    expect(r.statusCode).toBe(200);
    const s = r.json();
    expect(s.regions).toEqual(['brume', 'saline']);
    expect(s.stamps).toBe(1); // 10 − 10, plus la page « La route de la Côte »
    expect(s.album.map((a: { id: string }) => a.id)).toContain('s-route-saline');
    expect(s.logbook.some((l: { kind: string; ref: string }) => l.kind === 'route.opened' && l.ref === 'saline')).toBe(true);
    // Une route ne s'ouvre qu'une fois.
    r = await t.open();
    expect(r.statusCode).toBe(409);
    expect((await t.json('POST', '/v1/company/regions/ocre/open', {}, t.cookie)).statusCode).toBe(404);
    await t.app.close();
  });

  it('refuse un vol vers la Côte tant que la route est fermée', async () => {
    const t = await company();
    const s = await t.state();
    const r = await t.fly('c-capitainerie', s.planes[0].id, s.pilots[0].id);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('region_locked');
    await t.app.close();
  });
});

describe('la Côte de Saline — l\'hydravion', () => {
  it("laisse la Grive porter jusqu'à Port-Sel, mais pas se poser sur l'eau", async () => {
    const t = await company();
    t.wholeValley(10);
    await t.open();
    const s = await t.state();
    const grive = s.planes[0].id; const prosper = s.pilots[0].id;
    let r = await t.fly('c-coquillages', grive, prosper);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('needs_seaplane');
    r = await t.fly('c-capitainerie', grive, prosper);
    expect(r.statusCode).toBe(201);
    await t.app.close();
  });

  it("exige un ponton pour acheter la Sterne, qui ne compte pas dans le hangar, puis amerrit à l'Anse", async () => {
    const t = await company();
    t.wholeValley(10);
    await t.open();
    // Pas de ponton : la Sterne reste à Port-Sel.
    t.give('o-sterne');
    let r = await t.json('POST', '/v1/company/cards/o-sterne/play', {}, t.cookie);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('no_pontoon');
    // Le ponton se construit ; le hangar, lui, est encore plein (une Grive, niveau 1).
    r = await t.json('POST', '/v1/company/zones/ponton/upgrade', {}, t.cookie);
    expect(r.statusCode).toBe(200);
    expect(r.json().zones.ponton).toBe(2);
    expect(r.json().zones.hangar).toBe(1);
    r = await t.json('POST', '/v1/company/cards/o-sterne/play', {}, t.cookie);
    expect(r.statusCode).toBe(200);
    const s = r.json();
    expect(s.planes.map((p: { model: string }) => p.model)).toEqual(['grive', 'sterne']);
    // Un second hydravion n'a pas de place ; un avion de terre non plus (hangar plein).
    t.give('o-sterne');
    expect((await t.json('POST', '/v1/company/cards/o-sterne/play', {}, t.cookie)).json().error).toBe('no_pontoon');
    t.give('o-martinet');
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().error).toBe('hangar_full');

    const sterne = s.planes[1].id; const prosper = s.pilots[0].id;
    // La Sterne ne se pose pas sur une digue.
    r = await t.fly('c-sauniers', sterne, prosper);
    expect(r.json().error).toBe('needs_water');
    // Mais sur l'eau, oui : 10,5 lieues à 14 l/h, trois quarts d'heure.
    r = await t.fly('c-coquillages', sterne, prosper);
    expect(r.statusCode).toBe(201);
    const flight = r.json().flights.find((f: { destination: string }) => f.destination === 'anse-aux-goemons');
    expect(flight.arrivesAt - flight.departedAt).toBeGreaterThanOrEqual(45 * 60_000);
    t.advance(3 * 60 * 60_000);
    const after = await t.state();
    const album = after.album.map((a: { id: string }) => a.id);
    expect(album).toContain('s-hydravion');
    expect(album).toContain('s-anse-aux-goemons');
    expect(after.francs).toBeGreaterThan(20000 - 1500 - 4400); // le contrat a payé
    await t.app.close();
  });

  it('exporte et efface la route avec le compte', async () => {
    const t = await company();
    t.wholeValley(10);
    await t.open();
    expect(t.ctx.db.prepare('SELECT COUNT(*) AS n FROM company_regions').get()).toEqual({ n: 2 });
    const r = await t.json('DELETE', '/v1/account', { confirmNickname: 'Régis' }, t.cookie);
    expect([200, 204]).toContain(r.statusCode);
    expect(t.ctx.db.prepare('SELECT COUNT(*) AS n FROM company_regions').get()).toEqual({ n: 0 });
    await t.app.close();
  });
});
