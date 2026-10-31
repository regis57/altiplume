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
      // 9,6 lieues sur piste moyenne, la Grive en porte 8. Le Pic (3 150 F d'occasion, il
      // décolle du pré) et la deuxième place au hangar (700 F) : 3 850 F. Le Martinet
      // demanderait en plus la piste roulée : 2 600 + 700 + 900 = 4 200 F.
      { need: 'range', plane: 'pic', price: 3150, works: [{ work: 'hangar', cost: 700 }], total: 3850, stops: ['marais-blanc'] },
      { need: 'water', plane: 'sterne', price: 3850, works: [{ work: 'pontoon', cost: 1500 }], total: 5350, stops: ['anse-aux-goemons', 'phare-de-brisant', 'ile-sainte-ambre'] },
    ]);
  });

  it('un pilote de Longues routes au hangar suffit pour Marais-Blanc', () => {
    const cap = route({ ...apresForet, pilots: [{ pilot: 'prosper' }, { pilot: 'hedda' }] });
    expect(cap.blockers.map((b) => b.stops)).toEqual([['anse-aux-goemons', 'phare-de-brisant', 'ile-sainte-ambre']]);
  });

  it("ne réclame pas les travaux déjà faits, et le moins cher suit ce qui est bâti", () => {
    // La piste roulée et une place libre : le Martinet n'a plus besoin que de sa carte
    // (2 600 F), moins chère que celle du Pic (3 150 F).
    const cap = route({ ...apresForet, zones: { hangar: 2, runway: 2, ponton: 2 } });
    expect(cap.blockers.map((b) => b.works)).toEqual([[], []]);
    expect(cap.blockers.map((b) => [b.plane, b.total])).toEqual([['martinet', 2600], ['sterne', 3850]]);
  });

  it('un ponton déjà occupé par un hydravion trop court en demande une place de plus', () => {
    // Une Sterne amarrée (portée 14) : l'Archipel va jusqu'à 19 lieues.
    const w: CapWorld = { ...world, regions: [...world.regions, { id: 'essai', page: 's-essai', route: { requires: 's-archipel', cost: 1 } }] };
    const cap = route({ ...apresForet, regions: ['brume', 'saline', 'cuivre', 'archipel'], planes: [{ model: 'grive' }, { model: 'sterne' }], zones: { ponton: 2 } }, w);
    expect(cap.region).toBe('essai');
    const far = cap.blockers.find((b) => b.need === 'range')!;
    // Le Goéland (6 600 F d'occasion) et le double ponton (2 800 F).
    expect(far).toMatchObject({ plane: 'goeland', price: 6600, works: [{ work: 'pontoon', cost: 2800 }], total: 9400 });
    expect(far.stops).toEqual(['grand-recif', 'sainte-lueur', 'le-rocher-noir', 'anse-des-lanternes', 'ile-du-bout']);
  });

  it("les clairières et Les Scieries demandent le Pic", () => {
    const w: CapWorld = { ...world, regions: [...world.regions, { id: 'essai', page: 's-essai', route: { requires: 's-foret', cost: 1 } }] };
    const cap = route({ ...apresForet, regions: ['brume', 'saline', 'cuivre', 'archipel'] }, w);
    const pic = { plane: 'pic', price: 3150, works: [{ work: 'hangar', cost: 700 }], total: 3850 };
    expect(cap.blockers).toEqual([
      // 9 lieues, piste courte : le Martinet ne s'y pose pas ; le Pic, si.
      { need: 'range', ...pic, stops: ['les-scieries'] },
      { need: 'clearing', ...pic, stops: ['sonnefeuille', 'vert-de-gris', 'le-hetre-roi'] },
    ]);
  });

  it("un Martinet acheté sur le pré ne livre pas Marais-Blanc : il y faut une piste plus longue", () => {
    // Revue du 18 octobre : la carte d'offre permet d'acheter le Martinet avant la piste
    // roulée ; le serveur refuse alors chaque départ (« piste trop courte chez soi »). Le
    // cap comptait pourtant Marais-Blanc comme livrable, sans rien dire.
    // La piste roulée (900 F) coûte moins que le Pic et l'atelier (3 150 + 2 000 F).
    const cap = route({ ...apresForet, planes: [{ model: 'grive' }, { model: 'martinet' }], zones: { hangar: 2 } });
    expect(cap.blockers[0]).toEqual({ need: 'range', plane: null, price: 0, works: [{ work: 'runway', cost: 900 }], total: 900, stops: ['marais-blanc'] });
    // La piste roulée : le Martinet décolle, Marais-Blanc n'est plus un obstacle.
    const roulee = route({ ...apresForet, planes: [{ model: 'grive' }, { model: 'martinet' }], zones: { hangar: 2, runway: 2 } });
    expect(roulee.blockers.flatMap((b) => b.stops)).not.toContain('marais-blanc');
  });

  it("une piste trop courte pour tous les avions de la flotte est dite comme telle", () => {
    // Un Héron seul (grande piste) : seule la Combe-aux-Rosées, en piste longue, l'accueille.
    const cap = route({ ...debut, planes: [{ model: 'heron' }], zones: { runway: 3 } });
    expect(cap.blockers).toEqual([
      { need: 'strip', plane: 'grive', price: 1500, works: [{ work: 'hangar', cost: 700 }], total: 2200, stops: ['pont-de-brume', 'les-tilleuls', 'moulin-gris', 'haut-ferrand', 'lanterne-du-val'] },
    ]);
  });

  it('additionne chaque niveau à bâtir : le Héron, depuis le pré, demande la piste roulée puis la grande', () => {
    // Une escale d'essai à 15 lieues, en piste longue : seul le Héron y va. 5 600 F
    // d'occasion, la deuxième place au hangar 700 F, et la piste en deux temps, 900 puis 2 400 F.
    // Sur le pré, le serveur ne tire pas la carte du Héron (planeWithinReach) : elle vient
    // une fois la piste roulée bâtie, ce qui est déjà dans le chemin. Le total est juste ;
    // l'ordre, c'est la piste d'abord.
    const w: CapWorld = { ...world, destinations: [...world.destinations, { id: 'essai-loin', region: 'saline', distance: 15, runway: 'long' }] };
    const loin = route(apresForet, w).blockers.find((b) => b.stops.includes('essai-loin'));
    expect(loin).toEqual({
      need: 'range', plane: 'heron', price: 5600, works: [{ work: 'hangar', cost: 700 }, { work: 'runway', cost: 3300 }], total: 9600, stops: ['essai-loin'],
    });
  });

  it("un hangar à son dernier niveau, et plein : aucun avion ne viendra, le cap n'en promet pas", () => {
    // Le serveur ne tire plus de carte d'avion qu'aucune place n'accueillera (drawCards).
    const cap = route({ ...apresForet, planes: [{ model: 'grive' }, { model: 'grive' }, { model: 'grive' }], zones: { hangar: 3 } });
    expect(cap.blockers[0]).toEqual({ need: 'range', plane: null, price: 0, works: [], total: 0, stops: ['marais-blanc'] });
  });
});

describe('le cap montre le chemin le moins cher, avec ses prix', () => {
  /**
   * La Croisette au 31 octobre : deux Grives et Prosper, le hangar à deux places (plein),
   * le pré fauché, la Côte et la Forêt ouvertes ; Port-Sel, les Œillets et les
   * Charbonnières livrés, 9 cachets.
   */
  const croisette: CapCompany = {
    stamps: 9,
    regions: ['brume', 'saline', 'cuivre'],
    album: pages(...VALLEE, 's-vallee', 's-route-saline', 's-route-cuivre', 's-port-sel', 's-les-oeillets', 's-les-charbonnieres'),
    planes: [{ model: 'grive' }, { model: 'grive' }],
    pilots: [{ pilot: 'prosper' }],
    zones: { hangar: 2 },
  };

  it('la Croisette, pour Marais-Blanc : le Pic, 5 150 F en tout — pas le Martinet, 5 500 F', () => {
    // Le défaut : le cap triait sur le prix de catalogue de l'avion seul (Martinet 3 200 F,
    // Pic 3 675 F), que personne ne paie, et désignait le Martinet : sa carte 2 600 F, la
    // piste roulée 900 F et l'atelier 2 000 F. Le Pic décolle du pré : sa carte 3 150 F
    // et l'atelier 2 000 F suffisent.
    const cap = route(croisette);
    expect(cap.region).toBe('archipel');
    expect(cap.blockers).toEqual([
      { need: 'range', plane: 'pic', price: 3150, works: [{ work: 'hangar', cost: 2000 }], total: 5150, stops: ['marais-blanc'] },
      { need: 'water', plane: 'sterne', price: 3850, works: [{ work: 'pontoon', cost: 1500 }], total: 5350, stops: ['anse-aux-goemons', 'phare-de-brisant', 'ile-sainte-ambre'] },
    ]);
  });

  it("ne promet pas un avion dont la carte ne vient pas encore : sans la Forêt, pas de Pic", () => {
    // La carte du Pic ne se tire qu'une fois la Forêt ouverte. Dans le vrai monde, le cap
    // vise la Forêt avant l'Archipel ; on la retire ici pour ne regarder que cette règle.
    const w: CapWorld = { ...world, regions: world.regions.filter((r) => r.id !== 'cuivre') };
    const cap = route({ ...croisette, regions: ['brume', 'saline'], album: pages(...VALLEE, 's-vallee', 's-route-saline', 's-port-sel', 's-les-oeillets') }, w);
    expect(cap.blockers[0]).toEqual({
      need: 'range', plane: 'martinet', price: 2600, works: [{ work: 'hangar', cost: 2000 }, { work: 'runway', cost: 900 }], total: 5500, stops: ['marais-blanc'],
    });
  });
});
