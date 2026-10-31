import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { openDatabase } from '../src/db/database.ts';
import { findCompanyByPlayer, foundCompany } from '../src/db/repos/companies.ts';
import { drawCards, HAND_SIZE, listHand, pilotAwaited, settle, type Fleet } from '../src/game/sim.ts';
import { makeRng } from '../src/sim/rng.ts';
import { cardRegion, findPlane, WORLD } from '../src/world/index.ts';
import type { RegionId } from '../src/world/types.ts';

/**
 * Le hangar attend son pilote : tant que la compagnie a plus d'avions que de pilotes, la
 * première carte du tirage est une carte d'embauche. Le cas réel du 31 octobre : deux
 * Grives au hangar, Prosper seul pour les mener, et dix jours sans carte pilote ; la
 * seconde Grive ne volait pas.
 */
const GRIVE = findPlane('grive')!;
const UN_EQUIPAGE: Fleet = { planes: [GRIVE], pilots: 1, reach: 1, home: 'short' };
const DEUX_GRIVES_UN_PILOTE: Fleet = { planes: [GRIVE, GRIVE], pilots: 1, reach: 1, home: 'short' };
const HIRES = WORLD.cards.filter((c) => c.kind === 'opportunity' && c.offer.type === 'pilot').map((c) => c.id);
const isHire = (id: string | undefined) => id !== undefined && HIRES.includes(id);
const GRAINES = 2000;

function tirages(fleet: Fleet, exclude: readonly string[] = [], regions: RegionId[] = ['brume']): string[][] {
  return Array.from({ length: GRAINES }, (_, seed) => drawCards(makeRng(seed), exclude, 1, 3, regions, ['s-fondation'], 'automne', fleet));
}

describe('le hangar attend son pilote', () => {
  it("deux Grives et un pilote : la carte d'embauche est en tête du tirage, pour toutes les graines", () => {
    for (const cartes of tirages(DEUX_GRIVES_UN_PILOTE)) {
      expect(cartes).toHaveLength(3);
      expect(cartes[0]).toBe('o-pilote');
      // Une seule : le reste du tirage suit les règles de toujours.
      expect(cartes.filter(isHire)).toHaveLength(1);
    }
  });

  it("avec la Forêt et l'Archipel ouverts, la roue choisit l'une des trois cartes d'embauche", () => {
    const tetes = tirages(DEUX_GRIVES_UN_PILOTE, [], ['brume', 'cuivre', 'archipel']).map((c) => c[0]);
    expect(tetes.every(isHire)).toBe(true);
    // Elles pèsent toutes le même poids : chacune vient environ une fois sur trois.
    for (const id of ['o-pilote', 'o-pilote-foret', 'o-pilote-iles']) {
      const part = tetes.filter((t) => t === id).length / GRAINES;
      expect(part, id).toBeGreaterThan(0.25);
      expect(part, id).toBeLessThan(0.42);
    }
  });

  it('le tirage reste déterministe : même graine, mêmes cartes', () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const a = drawCards(makeRng(seed), [], 1, 3, ['brume', 'cuivre'], [], 'automne', DEUX_GRIVES_UN_PILOTE);
      const b = drawCards(makeRng(seed), [], 1, 3, ['brume', 'cuivre'], [], 'automne', DEUX_GRIVES_UN_PILOTE);
      expect(a).toEqual(b);
    }
  });

  it("un avion et un pilote : rien n'est forcé, la carte d'embauche reste rare", () => {
    const tous = tirages(UN_EQUIPAGE);
    const enTete = tous.filter((c) => isHire(c[0])).length / GRAINES;
    const presente = tous.filter((c) => c.some(isHire)).length / GRAINES;
    expect(pilotAwaited(UN_EQUIPAGE, [])).toBe(false);
    // Environ un tirage sur douze, comme avant la règle.
    expect(enTete).toBeLessThan(0.06);
    expect(presente).toBeGreaterThan(0.04);
    expect(presente).toBeLessThan(0.14);
  });

  it("deux avions et deux pilotes : rien n'est forcé non plus", () => {
    const deux: Fleet = { ...DEUX_GRIVES_UN_PILOTE, pilots: 2 };
    expect(pilotAwaited(deux, [])).toBe(false);
    expect(tirages(deux).filter((c) => isHire(c[0])).length / GRAINES).toBeLessThan(0.06);
  });

  it("une carte d'embauche déjà en main : pas de deuxième carte forcée", () => {
    // La Forêt est ouverte : sa lettre de candidature est encore dans le paquet.
    expect(pilotAwaited(DEUX_GRIVES_UN_PILOTE, ['o-pilote'])).toBe(false);
    const tous = tirages(DEUX_GRIVES_UN_PILOTE, ['o-pilote'], ['brume', 'cuivre']);
    expect(tous.every((c) => !c.includes('o-pilote'))).toBe(true);
    expect(tous.filter((c) => c[0] === 'o-pilote-foret').length / GRAINES).toBeLessThan(0.06);
  });

  it("tous les pilotes engagés : plus de carte d'embauche, rien de forcé, et trois cartes quand même", () => {
    const complet: Fleet = { planes: Array.from({ length: WORLD.pilots.length + 1 }, () => GRIVE), pilots: WORLD.pilots.length, reach: 1, home: 'short', allPilotsHired: true };
    for (const cartes of tirages(complet, [], ['brume', 'cuivre', 'archipel'])) {
      expect(cartes).toHaveLength(3);
      expect(cartes.some(isHire)).toBe(false);
    }
  });

  it("sans flotte connue (anciens appels), rien ne change", () => {
    expect(pilotAwaited(undefined, [])).toBe(false);
  });

  it("la carte d'un avion, côté client, compte la main comme le serveur", () => {
    // offre.ts dit « au prochain tirage » ou « quand la main aura une place » : il lui faut la même main.
    const offre = readFileSync(new URL('../../client/src/offre.ts', import.meta.url), 'utf8');
    expect(/export const HAND_SIZE = (\d+);/.exec(offre)?.[1]).toBe(String(HAND_SIZE));
  });
});

describe('le hangar attend son pilote, au tirage du jour', () => {
  const DAY = 86_400_000;
  const T0 = Date.UTC(2026, 9, 31, 17, 0);

  /** Une compagnie neuve, puis une seconde Grive au hangar (deux places) : un avion de plus que de pilotes. */
  function compagnie(joueur: string, regions: RegionId[] = []) {
    const db = openDatabase({ path: ':memory:' });
    db.prepare('INSERT INTO players (id, email, nickname, nickname_key, locale, age_confirmed, terms_version, terms_accepted_at, created_at, last_seen_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(joueur, `${joueur}@example.test`, joueur, joueur, 'fr', 1, 'x', T0, T0, T0);
    const id = foundCompany(db, joueur, 'Les Deux Grives', T0).id;
    for (const r of regions) db.prepare('INSERT INTO company_regions (company_id, region, opened_at) VALUES (?, ?, ?)').run(id, r, T0);
    const co = () => findCompanyByPlayer(db, joueur)!;
    settle(db, co(), joueur, T0); // le tirage du premier jour, avec un seul avion
    db.prepare("UPDATE company_zones SET level = 2 WHERE company_id = ? AND zone = 'hangar'").run(id);
    db.prepare("INSERT INTO company_planes (id, company_id, model, wear, wear_at, acquired_at) VALUES ('g2', ?, 'grive', 0, ?, ?)").run(id, T0, T0);
    const main = () => listHand(db, id).map((h) => h.card);
    return { db, id, co, main, settle: (now: number) => settle(db, co(), joueur, now) };
  }

  it("la carte d'embauche arrive au tirage du lendemain", () => {
    for (let n = 0; n < 30; n += 1) {
      const c = compagnie(`joueuse-${n}`);
      // Si le premier jour en a donné une par hasard, le joueur l'a laissée passer.
      c.db.prepare("DELETE FROM company_hand WHERE company_id = ? AND card = 'o-pilote'").run(c.id);
      c.settle(T0 + DAY);
      expect(c.main()).toContain('o-pilote');
    }
  });

  it("main presque pleine : la dernière place va au pilote", () => {
    const c = compagnie('joueur-plein');
    c.db.prepare("DELETE FROM company_hand WHERE company_id = ? AND card = 'o-pilote'").run(c.id);
    // Des contrats de la vallée qu'une Grive porte seule : ils restent en main.
    const autres = WORLD.cards.filter((k) => k.kind === 'contract' && !k.standing && !k.heavy && cardRegion(k) === 'brume' && !c.main().includes(k.id)).map((k) => k.id);
    for (const card of autres.slice(0, HAND_SIZE - 1 - c.main().length)) c.db.prepare('INSERT INTO company_hand (company_id, card, drawn_at) VALUES (?, ?, ?)').run(c.id, card, T0);
    expect(c.main()).toHaveLength(HAND_SIZE - 1);
    c.settle(T0 + DAY);
    expect(c.main()).toHaveLength(HAND_SIZE);
    expect(c.main()).toContain('o-pilote');
  });

  it("deux jours d'absence, main vidée : une carte d'embauche dans la main pleine, pas deux d'office", () => {
    let deux = 0;
    for (let n = 0; n < 40; n += 1) {
      const c = compagnie(`absent-${n}`, ['cuivre']);
      c.db.prepare('DELETE FROM company_hand WHERE company_id = ?').run(c.id);
      c.settle(T0 + 2 * DAY);
      const main = c.main();
      expect(main).toHaveLength(5);
      expect(main.some(isHire)).toBe(true);
      if (main.filter(isHire).length > 1) deux += 1;
    }
    // Le premier jour rattrapé force la carte ; le second la trouve en main et ne force rien.
    // Une seconde carte d'embauche ne vient alors que par le hasard ordinaire du tirage.
    expect(deux).toBeLessThan(8);
  });

  it("la carte d'embauche en main, le lendemain n'en force pas d'autre", () => {
    let forcees = 0;
    for (let n = 0; n < 40; n += 1) {
      const c = compagnie(`patient-${n}`, ['cuivre']);
      c.db.prepare('DELETE FROM company_hand WHERE company_id = ?').run(c.id);
      c.db.prepare("INSERT INTO company_hand (company_id, card, drawn_at) VALUES (?, 'o-pilote', ?)").run(c.id, T0);
      c.settle(T0 + DAY);
      if (c.main().includes('o-pilote-foret')) forcees += 1;
    }
    expect(forcees).toBeLessThan(8);
  });

  it("une fois le pilote embauché, le tirage redevient ordinaire", () => {
    const c = compagnie('joueuse-embauche');
    c.settle(T0 + DAY);
    expect(c.main()).toContain('o-pilote');
    // Le pilote est engagé : deux avions, deux pilotes.
    c.db.prepare("INSERT INTO company_pilots (id, company_id, pilot, hired_at) VALUES ('p2', ?, ?, ?)").run(c.id, WORLD.pilots[1]!.id, T0 + DAY);
    let encore = 0;
    for (let d = 2; d < 12; d += 1) {
      c.db.prepare('DELETE FROM company_hand WHERE company_id = ?').run(c.id);
      c.settle(T0 + d * DAY);
      if (c.main().includes('o-pilote')) encore += 1;
    }
    expect(encore).toBeLessThan(4);
  });
});
