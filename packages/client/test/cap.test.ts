import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nextCap, type CapCompany, type CapWorld, type RouteCap } from '../src/cap.ts';

/**
 * Le monde tel que le cap le voit, copié du vrai : `packages/server/test/world.test.ts`
 * vérifie qu'il n'a pas bougé (et sait le réécrire). Les chiffres sont donc ceux du jeu.
 */
const world = JSON.parse(readFileSync(new URL('./monde-du-cap.json', import.meta.url), 'utf8')) as CapWorld;

const VALLEE = ['s-pont-de-brume', 's-les-tilleuls', 's-moulin-gris', 's-haut-ferrand', 's-lanterne-du-val', 's-combe-aux-rosees'];
const pages = (...ids: string[]) => ids.map((id) => ({ id }));

/** Le premier jour : une Grive, Prosper, rien dans l'album. */
const debut: CapCompany = { stamps: 0, regions: ['brume'], album: [], planes: [{ model: 'grive' }], pilots: [{ pilot: 'prosper' }], zones: {} };

/**
 * La partie du 15 octobre, 09 h 16 : la vallée livrée, la Côte ouverte (10 cachets
 * payés, un rendu par la page « route »), 8 cachets en caisse, toujours une seule Grive.
 */
const quinzeOctobre: CapCompany = {
  ...debut,
  stamps: 8,
  regions: ['brume', 'saline'],
  album: pages('s-fondation', 's-premier-vol', ...VALLEE, 's-vallee', 's-route-saline'),
};

function route(c: CapCompany, w: CapWorld = world): RouteCap {
  const cap = nextCap(w, c);
  if (cap.kind !== 'route') throw new Error(`attendu une route, reçu ${cap.kind}`);
  return cap;
}

describe('le cap vise la route la plus proche', () => {
  it("le 15 octobre : la Forêt (page acquise, 8 cachets sur 12), pas l'Archipel", () => {
    // Le défaut : le cap suivait l'ordre de la liste et désignait l'Archipel, qui demande
    // toute la Côte (trois escales sur l'eau, une hors de portée) et 15 cachets.
    const cap = route(quinzeOctobre);
    expect(cap.region).toBe('cuivre');
    expect(cap.hasPage).toBe(true);
    expect(cap.enough).toBe(false);
    expect(cap.toDeliver).toEqual([]);
    expect(cap.blockers).toEqual([]);
  });

  it('au premier jour, rien ne change : la Côte, la moins chère des deux routes de la vallée', () => {
    const cap = route(debut);
    expect(cap.region).toBe('saline');
    expect(cap.toDeliver).toEqual(VALLEE.map((p) => p.slice(2)));
    expect(cap.blockers).toEqual([]);
  });

  it("ne vise jamais une route dont la région d'origine est fermée", () => {
    // La Forêt ouverte, la Côte non : l'Archipel (qui demande « Toute la Côte ») passe après.
    const cap = route({ ...quinzeOctobre, stamps: 40, regions: ['brume', 'cuivre'], album: pages(...VALLEE, 's-vallee') });
    expect(cap.region).toBe('saline');
  });

  it("l'album prend le relais quand toutes les routes sont ouvertes", () => {
    const all = ['brume', 'saline', 'archipel', 'cuivre'];
    expect(nextCap(world, { ...debut, regions: all })).toEqual({ kind: 'album', missing: world.stamps.length });
    expect(nextCap(world, { ...debut, regions: all, album: world.stamps })).toEqual({ kind: 'done' });
  });
});

describe('le cap dit ce qui manque à la flotte', () => {
  /** La Forêt ouverte à son tour : il ne reste que l'Archipel, et la Côte à livrer. */
  const apresForet: CapCompany = { ...quinzeOctobre, stamps: 1, regions: ['brume', 'saline', 'cuivre'] };

  it('avec une Grive seule : Marais-Blanc hors de portée, trois escales sur l\'eau', () => {
    const cap = route(apresForet);
    expect(cap.region).toBe('archipel');
    expect(cap.toDeliver).toEqual(['port-sel', 'les-oeillets', 'marais-blanc', 'anse-aux-goemons', 'phare-de-brisant', 'ile-sainte-ambre']);
    expect(cap.blockers).toEqual([
      // 9,6 lieues, la Grive en porte 8 : le Martinet, qui demande une place au hangar et
      // une piste roulée — ou un pilote de Longues routes (8 × 1,2 = 9,6) sur la Grive.
      { need: 'range', plane: 'martinet', works: ['hangar', 'runway'], pilotTrait: 'longhaul', stops: ['marais-blanc'] },
      { need: 'water', plane: 'sterne', works: ['pontoon'], pilotTrait: null, stops: ['anse-aux-goemons', 'phare-de-brisant', 'ile-sainte-ambre'] },
    ]);
  });

  it('un pilote de Longues routes au hangar suffit pour Marais-Blanc', () => {
    const cap = route({ ...apresForet, pilots: [{ pilot: 'prosper' }, { pilot: 'hedda' }] });
    expect(cap.blockers.map((b) => b.stops)).toEqual([['anse-aux-goemons', 'phare-de-brisant', 'ile-sainte-ambre']]);
  });

  it("ne réclame pas les travaux déjà faits", () => {
    const cap = route({ ...apresForet, zones: { hangar: 2, runway: 2, ponton: 2 } });
    expect(cap.blockers.map((b) => b.works)).toEqual([[], []]);
  });

  it('un ponton déjà occupé par un hydravion trop court en demande une place de plus', () => {
    // Une Sterne amarrée (portée 14) : l'Archipel va jusqu'à 19 lieues.
    const w: CapWorld = { ...world, regions: [...world.regions, { id: 'essai', page: 's-essai', route: { requires: 's-archipel', cost: 1 } }] };
    const cap = route({ ...apresForet, regions: ['brume', 'saline', 'cuivre', 'archipel'], planes: [{ model: 'grive' }, { model: 'sterne' }], zones: { ponton: 2 } }, w);
    expect(cap.region).toBe('essai');
    const far = cap.blockers.find((b) => b.need === 'range')!;
    expect(far).toMatchObject({ plane: 'goeland', works: ['pontoon'], pilotTrait: 'longhaul' });
    // 14 × 1,2 = 16,8 : un pilote de Longues routes sur la Sterne n'atteint pas 17 lieues et plus.
    expect(far.stops).toEqual(['grand-recif', 'sainte-lueur']);
  });

  it("les clairières demandent le Pic ; Les Scieries, un Pic ou un pilote de Longues routes", () => {
    const w: CapWorld = { ...world, regions: [...world.regions, { id: 'essai', page: 's-essai', route: { requires: 's-foret', cost: 1 } }] };
    const cap = route({ ...apresForet, regions: ['brume', 'saline', 'cuivre', 'archipel'] }, w);
    expect(cap.blockers).toEqual([
      // 9 lieues, piste courte : le Martinet ne s'y pose pas ; le Pic, si.
      { need: 'range', plane: 'pic', works: ['hangar'], pilotTrait: 'longhaul', stops: ['les-scieries'] },
      { need: 'clearing', plane: 'pic', works: ['hangar'], pilotTrait: null, stops: ['sonnefeuille', 'vert-de-gris', 'le-hetre-roi'] },
    ]);
  });

  it("une piste trop courte pour tous les avions de la flotte est dite comme telle", () => {
    // Un Héron seul (grande piste) : seule la Combe-aux-Rosées, en piste longue, l'accueille.
    const cap = route({ ...debut, planes: [{ model: 'heron' }], zones: { runway: 3 } });
    expect(cap.blockers).toEqual([
      { need: 'strip', plane: 'grive', works: ['hangar'], pilotTrait: null, stops: ['pont-de-brume', 'les-tilleuls', 'moulin-gris', 'haut-ferrand', 'lanterne-du-val'] },
    ]);
  });
});
