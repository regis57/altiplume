import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { drawCards, incidentRisk } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { cardRegion, findCard, findDestination, findPilot, findPlane, regionDestinations } from '../src/world/index.ts';

const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

/** Une compagnie riche, la main vide, la vallée livrée en papier, et de quoi forcer le jeu sans tirage. */
async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  await t.json('POST', '/v1/company', { name: 'Les Ailes du Cuivre' }, cookie);
  t.ctx.db.prepare('DELETE FROM company_hand').run();
  t.ctx.db.prepare('UPDATE companies SET francs = 20000').run();
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  const clearEvents = () => t.ctx.db.prepare("DELETE FROM company_hand WHERE card LIKE 'e-%'").run();
  const wholeValley = (stamps: number) => {
    t.ctx.db.prepare("INSERT OR IGNORE INTO company_stamps (company_id, stamp, earned_at) VALUES ((SELECT id FROM companies), 's-vallee', ?)").run(t.ctx.now());
    t.ctx.db.prepare('UPDATE companies SET stamps = ?').run(stamps);
  };
  const open = (region = 'cuivre') => t.json('POST', `/v1/company/regions/${region}/open`, {}, cookie);
  const fly = async (card: string, plane: string, pilot: string) => {
    clearEvents(); give(card);
    return t.json('POST', '/v1/company/flights', { card, plane, pilot }, cookie);
  };
  /** Rentre au sol, frais et dispos : on ne teste pas la fatigue ici. */
  const home = async () => {
    t.advance(3 * 60 * 60_000);
    t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
    return state();
  };
  return { ...t, cookie, state, give, clearEvents, wholeValley, open, fly, home };
}

describe('la Forêt de Cuivre — la route', () => {
  it('ne tire jamais une carte de la forêt tant que la route est fermée', () => {
    let foret = 0;
    for (let seed = 0; seed < 500; seed += 1) {
      for (const id of drawCards(makeRng(seed), [], 1, 3, ['brume', 'saline'])) expect(cardRegion(findCard(id)!)).not.toBe('cuivre');
      foret += drawCards(makeRng(seed), [], 1, 3, ['brume', 'cuivre']).filter((id) => cardRegion(findCard(id)!) === 'cuivre').length;
    }
    expect(foret).toBeGreaterThan(100);
  });

  it("s'ouvre contre douze cachets après « Toute la vallée », sans attendre la Côte — et la Côte reste ouverte au choix", async () => {
    const t = await company();
    t.wholeValley(11);
    let r = await t.open();
    expect(r.json().error).toBe('not_enough_stamps');
    t.wholeValley(22);
    r = await t.open();
    expect(r.statusCode).toBe(200);
    expect(r.json().regions).toEqual(['brume', 'cuivre']);
    expect(r.json().stamps).toBe(11); // 22 − 12, plus la page « La route de la forêt »
    expect(r.json().album.map((a: { id: string }) => a.id)).toContain('s-route-cuivre');
    // La mer, maintenant : les deux routes partent de la vallée.
    r = await t.open('saline');
    expect(r.statusCode).toBe(200);
    expect(r.json().regions).toEqual(['brume', 'cuivre', 'saline']);
    expect((await t.open()).statusCode).toBe(409);
    await t.app.close();
  });

  it('refuse un vol vers la forêt tant que la route est fermée', async () => {
    const t = await company();
    const s = await t.state();
    expect((await t.fly('c-charbonniers', s.planes[0].id, s.pilots[0].id)).json().error).toBe('region_locked');
    await t.app.close();
  });
});

describe('la Forêt de Cuivre — les clairières', () => {
  it('laisse la Grive aux Charbonnières, mais pas dans une clairière', async () => {
    const t = await company();
    t.wholeValley(12);
    await t.open();
    const s = await t.state();
    const grive = s.planes[0].id; const prosper = s.pilots[0].id;
    let r = await t.fly('c-simples', grive, prosper);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('needs_clearing_plane');
    r = await t.fly('c-charbonniers', grive, prosper);
    expect(r.statusCode).toBe(201);
    await t.app.close();
  });

  it("vend le Pic du receveur, qui dort au hangar, se pose dans les clairières et colle « Dans la clairière »", async () => {
    const t = await company();
    t.wholeValley(12);
    await t.open();
    // Le hangar de départ n'a qu'une place, et la Grive l'occupe.
    t.give('o-pic');
    let r = await t.json('POST', '/v1/company/cards/o-pic/play', {}, t.cookie);
    expect(r.json().error).toBe('hangar_full');
    await t.json('POST', '/v1/company/zones/hangar/upgrade', { level: 2 }, t.cookie);
    r = await t.json('POST', '/v1/company/cards/o-pic/play', {}, t.cookie);
    expect(r.statusCode).toBe(200);
    const s = r.json();
    expect(s.planes.map((p: { model: string }) => p.model)).toEqual(['grive', 'pic']);
    expect(s.francs).toBe(20000 - 700 - 3150);
    const pic = s.planes[1].id; const prosper = s.pilots[0].id;
    // Sonnefeuille : 10 lieues à 13 lieues/h, trois quarts d'heure ; le Pic décolle de la Croisette sans piste roulée.
    r = await t.fly('c-simples', pic, prosper);
    expect(r.statusCode).toBe(201);
    const flight = r.json().flights.find((f: { destination: string }) => f.destination === 'sonnefeuille');
    expect(flight.arrivesAt - flight.departedAt).toBeGreaterThanOrEqual(46 * 60_000);
    const after = await t.home();
    const album = after.album.map((a: { id: string }) => a.id);
    expect(album).toContain('s-clairiere');
    expect(album).toContain('s-sonnefeuille');
    await t.app.close();
  });

  it('colle « Toute la forêt » quand les six escales ont reçu leur courrier', async () => {
    const t = await company();
    t.wholeValley(12);
    await t.open();
    await t.json('POST', '/v1/company/zones/hangar/upgrade', { level: 2 }, t.cookie);
    t.give('o-pic');
    const s = (await t.json('POST', '/v1/company/cards/o-pic/play', {}, t.cookie)).json();
    const pic = s.planes[1].id; const prosper = s.pilots[0].id;
    const one = { 'les-charbonnieres': 'c-charbonniers', villechaudron: 'c-cuivre-mine', 'les-scieries': 'c-scieurs', sonnefeuille: 'c-simples', 'vert-de-gris': 'c-lampes-mine', 'le-hetre-roi': 'c-garde' } as const;
    expect(Object.keys(one).sort()).toEqual(regionDestinations('cuivre').map((d) => d.id).sort());
    for (const [dest, card] of Object.entries(one)) {
      expect((await t.fly(card, pic, prosper)).statusCode, dest).toBe(201);
      await t.home();
    }
    const album = (await t.state()).album.map((a: { id: string }) => a.id);
    expect(album).toContain('s-foret');
    expect(album).not.toContain('s-cote');
    await t.app.close();
  });
});

describe("la Forêt de Cuivre — l'humidité des sous-bois", () => {
  it("multiplie le risque d'incident par 1,5 sous les arbres, et seulement là", () => {
    const pic = findPlane('pic')!;
    const prosper = findPilot('prosper')!;
    const base = { model: pic, template: prosper, plane: { id: 'p', model: 'pic', wear: 0 }, pilot: { id: 'x', pilot: 'prosper', affinity: 0, morale: 10, fatigue: 0, fatigue_at: 0, scenes_seen: 0 } };
    const midi = Date.UTC(2026, 9, 12, 12);
    const clair = incidentRisk({ ...base, destination: findDestination('villechaudron')! }, midi);
    const sousBois = incidentRisk({ ...base, destination: findDestination('sonnefeuille')! }, midi);
    expect(clair).toBeCloseTo(1 - pic.reliability, 10);
    expect(sousBois).toBeCloseTo(1.5 * clair, 10);
    // Mains d'or (Rosalie) rend sa fiabilité à l'avion : le risque baisse, même sous les hêtres.
    const rosalie = incidentRisk({ ...base, template: findPilot('rosalie')!, destination: findDestination('sonnefeuille')! }, midi);
    expect(rosalie).toBeLessThan(sousBois);
  });
});
