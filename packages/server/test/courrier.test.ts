import { describe, expect, it } from 'vitest';
import { sessionCookie, testApp } from './helpers.ts';
import { drawCards, FATIGUE_RECOVERY_MS, HAND_SIZE } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { findCard, findDestination, findPlane, regionDestinations } from '../src/world/index.ts';

const DAY = 86_400_000;
const signup = { email: 'regis@example.test', nickname: 'Régis', locale: 'fr', ageConfirmed: true, acceptTerms: true };

/** Un joueur avec une compagnie, et l'état courant. */
async function company() {
  const t = await testApp();
  await t.json('POST', '/v1/auth/register', signup);
  const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
  const founded = (await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie)).json();
  const state = async () => (await t.json('GET', '/v1/company', undefined, cookie)).json();
  /** Met une carte précise en main (le tirage est aléatoire, les tests ne le sont pas). */
  const give = (card: string) => t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
  const clearHand = () => t.ctx.db.prepare('DELETE FROM company_hand').run();
  return { ...t, cookie, founded, state, give, clearHand };
}

describe('le courrier — les cartes du jour', () => {
  it('tire trois cartes le jour de la fondation, puis trois par jour, jamais plus que la main', async () => {
    const t = await company();
    expect(t.founded.hand).toHaveLength(3);
    expect(t.founded.news).toContainEqual({ kind: 'cards.drawn', count: 3 });
    const again = await t.state();
    expect(again.hand).toHaveLength(3);
    expect(again.news).toEqual([]);
    t.advance(DAY);
    const tomorrow = await t.state();
    expect(tomorrow.hand).toHaveLength(HAND_SIZE);
    expect(tomorrow.news).toContainEqual({ kind: 'cards.drawn', count: 2 });
    t.advance(DAY);
    expect((await t.state()).hand).toHaveLength(HAND_SIZE);
    await t.app.close();
  });

  it('tire de façon reproductible, pondérée par la rareté, sans doublon', () => {
    const a = drawCards(makeRng(1), [], 1);
    const b = drawCards(makeRng(1), [], 1);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
    const counts = new Map<string, number>();
    for (let seed = 0; seed < 2000; seed += 1) for (const id of drawCards(makeRng(seed), [], 1)) counts.set(id, (counts.get(id) ?? 0) + 1);
    const common = counts.get('c-journal') ?? 0;   // poids 1
    const rare = counts.get('c-urgent-combe') ?? 0; // poids 3
    expect(common).toBeGreaterThan(rare * 1.8);
    // Les cartes exclues ne sortent pas.
    for (let seed = 0; seed < 200; seed += 1) expect(drawCards(makeRng(seed), ['c-journal'], 1)).not.toContain('c-journal');
    // La chance favorise les opportunités.
    let lucky = 0; let plain = 0;
    for (let seed = 0; seed < 2000; seed += 1) {
      lucky += drawCards(makeRng(seed), [], 3).filter((id) => findCard(id)?.kind === 'opportunity').length;
      plain += drawCards(makeRng(seed), [], 1).filter((id) => findCard(id)?.kind === 'opportunity').length;
    }
    expect(lucky).toBeGreaterThan(plain);
  });

  it('se défausse, et une carte défaussée ne revient pas le jour même', async () => {
    const t = await company();
    // Une carte précise, pas « la première du tirage » : le tirage dépend de l'identifiant
    // du joueur, aléatoire dans les tests ; dans 5 % des cas il ne contient aucun contrat,
    // la première carte est alors un imprévu — qui ne se défausse pas. C'était l'échec
    // intermittent du 11 octobre.
    t.clearHand(); t.give('c-journal');
    const card = 'c-journal';
    expect((await t.json('DELETE', `/v1/company/cards/${card}`, {}, t.cookie)).statusCode).toBe(204);
    expect((await t.json('DELETE', `/v1/company/cards/${card}`, {}, t.cookie)).statusCode).toBe(404);
    expect((await t.state()).hand.map((h: { card: string }) => h.card)).not.toContain(card);
    await t.app.close();
  });
});

describe('le courrier — expédier', () => {
  it('refuse ce qui ne tient pas debout, avec un code précis', async () => {
    const t = await company();
    t.clearHand(); t.give('c-journal'); t.give('c-farine'); t.give('c-medicaments'); t.give('e-brume');
    const s = await t.state();
    const grive = s.planes[0].id; const marthe = s.pilots[0].id;
    const send = (card: string, plane = grive, pilot = marthe) => t.json('POST', '/v1/company/flights', { card, plane, pilot }, t.cookie);
    expect((await send('c-inconnue')).json().error).toBe('card_unknown');
    expect((await send('e-brume')).json().error).toBe('card_not_contract');
    // L'imprévu en main bloque tout le reste : on le retire pour tester les autres refus.
    t.ctx.db.prepare("DELETE FROM company_hand WHERE card = 'e-brume'").run();
    expect((await send('c-journal', 'xxx')).json().error).toBe('plane_unknown');
    expect((await send('c-journal', grive, 'xxx')).json().error).toBe('pilot_unknown');
    expect((await send('c-farine')).json().error).toBe('plane_too_small'); // 3 sacs, la Grive en porte 2
    // Le Héron ne se pose qu'à la Combe ; le Martinet ne se pose pas sur un pré.
    t.ctx.db.prepare("INSERT INTO company_planes (id, company_id, model, wear, acquired_at) VALUES ('mart', (SELECT id FROM companies), 'martinet', 0, 0)").run();
    t.give('c-miel');
    expect((await send('c-miel', 'mart')).json().error).toBe('runway_too_short');
    // Pas assez de francs.
    t.ctx.db.prepare('UPDATE companies SET francs = 3').run();
    expect((await send('c-journal')).json().error).toBe('not_enough_francs');
    await t.app.close();
  });

  it('expédie, débite, occupe l\'avion et le pilote, puis encaisse à l\'arrivée avec le bonus', async () => {
    const t = await company();
    t.clearHand(); t.give('c-journal');
    const s0 = await t.state();
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    expect(r.statusCode).toBe(201);
    const s1 = r.json();
    const card = findCard('c-journal')!;
    expect(card.kind).toBe('contract');
    // Coût : salaire de Marthe (8) + entretien de la Grive (6).
    expect(s1.francs).toBe(300 - 14);
    expect(s1.hand).toEqual([]);
    expect(s1.flights).toHaveLength(1);
    const f = s1.flights[0];
    expect(f.destination).toBe('pont-de-brume');
    expect(f.status).toBe('en_route');
    // 1 lieue à 12 lieues/h : 5 min — ou 6 min 30 si l'aléa du vol (6 %) a frappé. L'aléa
    // dépend de l'identifiant du joueur, aléatoire ici : le test accepte les deux issues.
    const duration = f.arrivesAt - f.departedAt;
    expect([5 * 60_000, 6.5 * 60_000]).toContain(duration);
    const incident = duration !== 5 * 60_000;
    expect(f.busyUntil - f.departedAt).toBe(2 * duration);
    expect(s1.planes[0].busyUntil).toBe(f.busyUntil);
    expect(s1.pilots[0].busyUntil).toBe(f.busyUntil);
    expect(s1.pilots[0].fatigue).toBe(1);
    expect(s1.logbook[0]).toMatchObject({ kind: 'flight.departed', francs: -14, ref: 'pont-de-brume' });

    // Occupé : on ne peut pas réexpédier.
    t.give('c-lettres-pont');
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-lettres-pont', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie)).json().error).toBe('plane_busy');

    // Quatre minutes : toujours en route, rien d'encaissé.
    t.advance(4 * 60_000);
    let s = await t.state();
    expect(s.flights[0].status).toBe('en_route');
    expect(s.francs).toBe(286);
    // À l'arrivée : encaissé une seule fois, avion sur le retour.
    t.advance(duration - 4 * 60_000 + 1);
    s = await t.state();
    expect(s.flights[0].status).toBe('returning');
    expect(s.flights[0].settled).toBe(true);
    expect(s.francs).toBe(286 + 24 + 6); // récompense + bonus de délai (4 h)
    expect(s.news).toContainEqual(expect.objectContaining({ kind: 'flight.arrived', destination: 'pont-de-brume', francs: 30, bonus: true, incident }));
    expect(s.news.map((n: { kind: string; stamp?: string }) => n.stamp).filter(Boolean)).toEqual(['s-premier-vol', 's-pont-de-brume']);
    expect(s.pilots[0].affinity).toBe(1);
    expect(s.pilots[0].morale).toBe(incident ? 10 : 11);
    expect(s.planes[0].wear).toBeGreaterThanOrEqual(5);
    expect(s.album.map((a: { id: string }) => a.id)).toEqual(['s-fondation', 's-premier-vol', 's-pont-de-brume']);
    expect((await t.state()).francs).toBe(316); // pas de double encaissement
    // Rentré, disponible.
    t.advance(duration);
    s = await t.state();
    expect(s.flights).toEqual([]);
    expect(s.planes[0].busyUntil).toBeNull();
    await t.app.close();
  });

  it('ne verse pas le bonus quand le délai souple est dépassé, et ne punit pas', async () => {
    const t = await company();
    t.clearHand(); t.give('c-urgent-pont'); // délai 2 h, bonus 18
    const s0 = await t.state();
    // Avec un avion déjà usé, l'aléa est plus probable, mais le délai de 2 h tient sur 5 min : forçons un retard par un imprévu.
    await t.json('POST', '/v1/company/flights', { card: 'c-urgent-pont', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    t.ctx.db.prepare('UPDATE flights SET duration_ms = ?').run(3 * 3_600_000); // 3 h : le délai de 2 h est dépassé
    t.advance(3 * 3_600_000 + 1);
    const s = await t.state();
    const arrived = s.news.find((n: { kind: string }) => n.kind === 'flight.arrived');
    expect(arrived).toMatchObject({ bonus: false, francs: 42 });
    expect(s.francs).toBe(300 - 14 + 42);
    await t.app.close();
  });

  it('fatigue le pilote et le repose avec le temps', async () => {
    const t = await company();
    t.clearHand();
    const s0 = await t.state();
    const grive = s0.planes[0].id; const marthe = s0.pilots[0].id;
    // Marthe a « Cœur de village » : fatigue ×1,25 ; Combe-aux-Rosées est loin (×2) → 3 par vol.
    t.ctx.db.prepare("UPDATE company_planes SET model = 'heron'").run(); // pour atteindre la Combe avec 1 sac... la Grive y va aussi (8 lieues)
    t.ctx.db.prepare("UPDATE company_planes SET model = 'grive'").run();
    for (let i = 0; i < 3; i += 1) {
      t.give('c-medicaments');
      const r = await t.json('POST', '/v1/company/flights', { card: 'c-medicaments', plane: grive, pilot: marthe }, t.cookie);
      expect(r.statusCode, `vol ${i}`).toBe(201);
      t.advance(2 * 30 * 60_000 * 1.5); // aller-retour, avec marge pour brume/aléa
      await t.state();
      t.ctx.db.prepare('UPDATE company_pilots SET fatigue_at = ?').run(t.ctx.now()); // pas de récupération entre deux pour le test
    }
    let s = await t.state();
    expect(s.pilots[0].fatigue).toBeGreaterThanOrEqual(8);
    t.give('c-medicaments');
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-medicaments', plane: grive, pilot: marthe }, t.cookie)).json().error).toBe('pilot_tired');
    t.advance(3 * FATIGUE_RECOVERY_MS);
    s = await t.state();
    expect(s.pilots[0].fatigue).toBeLessThanOrEqual(6);
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-medicaments', plane: grive, pilot: marthe }, t.cookie)).statusCode).toBe(201);
    await t.app.close();
  });

  it('colle « Toute la vallée » après les six villages, et « Vol de nuit » aux lanternes après le coucher du soleil', async () => {
    const t = await testApp(Date.UTC(2026, 9, 11, 21, 0, 0)); // 21 h UTC : nuit
    await t.json('POST', '/v1/auth/register', signup);
    const cookie = sessionCookie(await t.json('POST', '/v1/auth/verify', { token: t.lastToken() }));
    await t.json('POST', '/v1/company', { name: 'Brume & Cie' }, cookie);
    t.ctx.db.prepare('DELETE FROM company_hand').run();
    t.ctx.db.prepare('UPDATE companies SET francs = 10000').run();
    const s0 = (await t.json('GET', '/v1/company', undefined, cookie)).json();
    const one = { 'pont-de-brume': 'c-journal', 'les-tilleuls': 'c-miel', 'moulin-gris': 'c-tissu', 'haut-ferrand': 'c-pieces', 'lanterne-du-val': 'c-amour', 'combe-aux-rosees': 'c-medicaments' } as const;
    for (const [dest, card] of Object.entries(one)) {
      // Le tirage du jour a pu poser un imprévu : il bloquerait la piste, on le tranche d'office.
      t.ctx.db.prepare("DELETE FROM company_hand WHERE card LIKE 'e-%'").run();
      t.ctx.db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES ((SELECT id FROM companies), ?, ?)').run(card, t.ctx.now());
      const r = await t.json('POST', '/v1/company/flights', { card, plane: s0.planes[0].id, pilot: s0.pilots[0].id }, cookie);
      expect(r.statusCode, dest).toBe(201);
      t.advance(2 * 60 * 60_000); // large : aller-retour de tout vol de la vallée
      t.ctx.db.prepare('UPDATE company_pilots SET fatigue = 0').run();
      await t.json('GET', '/v1/company', undefined, cookie);
    }
    const s = (await t.json('GET', '/v1/company', undefined, cookie)).json();
    const album = s.album.map((a: { id: string }) => a.id);
    for (const d of regionDestinations('brume')) expect(album).toContain(`s-${d.id}`);
    expect(album).toContain('s-vallee');
    expect(album).not.toContain('s-cote');
    expect(album).toContain('s-nuit');
    expect(s.pilots[0].affinity).toBe(6);
    expect(findDestination('lanterne-du-val')!.hazard).toBe('night');
    await t.app.close();
  });
});

describe('le courrier — imprévus et opportunités', () => {
  it('résout un imprévu par un choix, avec ses effets', async () => {
    const t = await company();
    t.clearHand(); t.give('e-bougie');
    expect((await t.json('POST', '/v1/company/cards/e-bougie/play', {}, t.cookie)).json().error).toBe('choice_unknown');
    const r = await t.json('POST', '/v1/company/cards/e-bougie/play', { choice: 'fix' }, t.cookie);
    expect(r.statusCode).toBe(200);
    expect(r.json().effects).toEqual({ francs: -12 });
    expect(r.json().francs).toBe(288);
    expect(r.json().hand).toEqual([]);
    expect((await t.json('POST', '/v1/company/cards/e-bougie/play', { choice: 'fix' }, t.cookie)).json().error).toBe('card_unknown');
    t.give('e-lettre-perdue');
    const s = (await t.json('POST', '/v1/company/cards/e-lettre-perdue/play', { choice: 'ask' }, t.cookie)).json();
    expect(s.stamps).toBe(2);
    t.give('c-journal');
    expect((await t.json('POST', '/v1/company/cards/c-journal/play', {}, t.cookie)).json().error).toBe('card_is_contract');
    await t.app.close();
  });

  it('saisit une opportunité : avion si le hangar a la place, pilote de passage, fête', async () => {
    const t = await company();
    t.clearHand(); t.give('o-martinet');
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().error).toBe('hangar_full');
    t.ctx.db.prepare("UPDATE company_zones SET level = 2 WHERE zone = 'hangar'").run();
    expect((await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json().error).toBe('not_enough_francs');
    t.ctx.db.prepare('UPDATE companies SET francs = 3000').run();
    const bought = (await t.json('POST', '/v1/company/cards/o-martinet/play', {}, t.cookie)).json();
    expect(bought.planes.map((p: { model: string }) => p.model)).toEqual(['grive', 'martinet']);
    expect(bought.francs).toBe(3000 - 2600);
    expect(findPlane('martinet')).toBeDefined();

    t.give('o-pilote');
    const hired = (await t.json('POST', '/v1/company/cards/o-pilote/play', {}, t.cookie)).json();
    expect(hired.pilots.map((p: { pilot: string }) => p.pilot)).toEqual(['marthe', 'ilias']);
    expect(hired.ref).toBe('ilias');

    t.give('o-fete');
    const fete = (await t.json('POST', '/v1/company/cards/o-fete/play', {}, t.cookie)).json();
    expect(fete.pilots.every((p: { morale: number }) => p.morale === 16)).toBe(true);
    expect(fete.francs).toBe(400 - 15);
    await t.app.close();
  });
});

describe('la ligne régulière', () => {
  it('part la main vide, autant de fois qu\'on veut, et n\'est jamais tirée', async () => {
    const t = await company();
    t.clearHand();
    const s0 = await t.state();
    expect(s0.hand).toEqual([]);
    const r = await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    expect(r.statusCode).toBe(201);
    expect(r.json().flights[0].destination).toBe('pont-de-brume');
    expect(r.json().hand).toEqual([]);
    const f = r.json().flights[0];
    t.advance(2 * (f.arrivesAt - f.departedAt) + 1);
    const s1 = await t.state();
    expect(s1.francs).toBe(300 - 14 + 18); // 18 F, pas de bonus
    // Encore, dès que l'avion est rentré.
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie)).statusCode).toBe(201);
    // Jamais dans un tirage.
    const { drawCards } = await import('../src/game/sim.ts');
    const { makeRng } = await import('../src/sim/rng.ts');
    for (let i = 0; i < 200; i += 1) expect(drawCards(makeRng(i), [], 1)).not.toContain('c-ligne-reguliere');
    // Et on ne peut pas la défausser.
    expect((await t.json('DELETE', '/v1/company/cards/c-ligne-reguliere', {}, t.cookie)).statusCode).toBe(404);
    await t.app.close();
  });
});

describe('un imprévu bloque la piste', () => {
  it('rien ne décolle tant qu\'il n\'est pas tranché, et il ne se laisse pas passer', async () => {
    const t = await company();
    t.clearHand(); t.give('c-journal'); t.give('e-vache');
    const s0 = await t.state();
    expect(s0.pendingEvent).toBe('e-vache');
    const blocked = await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie);
    expect(blocked.statusCode).toBe(400);
    expect(blocked.json().error).toBe('event_pending');
    // La ligne régulière non plus.
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-ligne-reguliere', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie)).json().error).toBe('event_pending');
    // On ne peut pas l'ignorer.
    const discard = await t.json('DELETE', '/v1/company/cards/e-vache', {}, t.cookie);
    expect(discard.statusCode).toBe(409);
    expect(discard.json().error).toBe('event_must_decide');
    // On tranche : la piste se libère.
    const { findCard } = await import('../src/world/index.ts');
    const choice = (findCard('e-vache') as unknown as { choices: { id: string }[] }).choices[0]!.id;
    expect((await t.json('POST', '/v1/company/cards/e-vache/play', { choice }, t.cookie)).statusCode).toBe(200);
    const s1 = await t.state();
    expect(s1.pendingEvent).toBeNull();
    expect((await t.json('POST', '/v1/company/flights', { card: 'c-journal', plane: s0.planes[0].id, pilot: s0.pilots[0].id }, t.cookie)).statusCode).toBe(201);
    await t.app.close();
  });
});
