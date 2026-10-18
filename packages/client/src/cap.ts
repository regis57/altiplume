/**
 * Le cap : la prochaine route à ouvrir, et ce qui manque vraiment pour y arriver.
 *
 * Deux défauts relevés le 15 octobre, sur une vraie partie :
 *
 * 1. Le cap visait la première région fermée **dans l'ordre de la liste**. Une fois
 *    la Côte ouverte, il désignait l'Archipel (la page « Toute la Côte » et 15
 *    cachets) alors que la Forêt de Cuivre ne demandait plus que 4 cachets : sa page
 *    était déjà dans l'album. Les routes s'ouvrent dans n'importe quel ordre ; le cap
 *    vise maintenant **la plus proche** : d'abord celle dont la page est acquise, puis
 *    celle qui demande le moins d'avions neufs, de livraisons, puis de cachets.
 * 2. Il listait les escales à livrer sans dire que la flotte ne pouvait pas toutes y
 *    aller. Avec une Grive seule, trois escales de la Côte sont sur l'eau et une
 *    quatrième est hors de portée. Le cap dit maintenant l'avion qu'il y faut, et ce
 *    qu'il demande à l'aérodrome (place au hangar ou au ponton, piste plus longue),
 *    avec les mêmes règles que le serveur.
 *
 * Fonction pure : ni réseau, ni page. Elle rend des identifiants ; l'affichage
 * met les mots.
 */

/** Du plus court au plus long ; l'eau à part. Le même ordre que le serveur. */
const RUNWAY_ORDER: Readonly<Record<string, number>> = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };

export interface CapWorld {
  readonly regions: readonly { readonly id: string; readonly page: string; readonly route?: { readonly requires: string; readonly cost: number } }[];
  readonly destinations: readonly { readonly id: string; readonly region: string; readonly distance: number; readonly runway: string }[];
  readonly planes: readonly { readonly id: string; readonly range: number; readonly runway: string; readonly price: number }[];
  readonly pilots: readonly { readonly id: string; readonly traits: readonly string[] }[];
  /** `range` : le facteur de portée d'un trait (« Longues routes »), s'il en a un. */
  readonly traits: readonly { readonly id: string; readonly range?: number }[];
  readonly zones: readonly { readonly id: string; readonly levels: readonly { readonly level: number; readonly runway?: string; readonly planes?: number; readonly seaplanes?: number }[] }[];
  readonly stamps: readonly { readonly id: string }[];
}

export interface CapCompany {
  readonly stamps: number;
  readonly regions: readonly string[];
  readonly album: readonly { readonly id: string }[];
  readonly planes: readonly { readonly model: string }[];
  readonly pilots: readonly { readonly pilot: string }[];
  readonly zones: Readonly<Record<string, number>>;
}

/** Pourquoi la flotte n'y va pas. */
export type Need =
  /** Un avion sait s'y poser, mais aucun ne porte assez loin. */
  | 'range'
  /** Sur l'eau : il faut un hydravion. */
  | 'water'
  /** En clairière : il faut l'avion des clairières. */
  | 'clearing'
  /** Une piste trop courte pour tous les avions de la flotte. */
  | 'strip';

/** Ce que l'avion neuf demande à l'aérodrome. */
export type Work = 'hangar' | 'pontoon' | 'runway';

/** Des escales que la flotte ne peut pas livrer, pour la même raison et le même remède. */
export interface Blocker {
  readonly need: Need;
  /** Le modèle le moins cher qui y va ; `null` si aucun (ne doit pas arriver). */
  readonly plane: string | null;
  readonly works: readonly Work[];
  /** Un trait de pilote qui suffirait, avec un avion déjà au hangar ; sinon `null`. */
  readonly pilotTrait: string | null;
  readonly stops: readonly string[];
}

export interface RouteCap {
  readonly kind: 'route';
  readonly region: string;
  readonly requires: string;
  readonly cost: number;
  readonly hasPage: boolean;
  readonly enough: boolean;
  /** Les escales encore à livrer une première fois pour coller la page demandée. */
  readonly toDeliver: readonly string[];
  readonly blockers: readonly Blocker[];
}

export type Cap = RouteCap | { readonly kind: 'album'; readonly missing: number } | { readonly kind: 'done' };

type Plane = CapWorld['planes'][number];
type Stop = CapWorld['destinations'][number];

function canLand(plane: Plane, stop: Stop): boolean {
  if (plane.runway === 'water' || stop.runway === 'water') return plane.runway === stop.runway;
  return (RUNWAY_ORDER[plane.runway] ?? 9) <= (RUNWAY_ORDER[stop.runway] ?? -1);
}

function reaches(plane: Plane, stop: Stop, reach: number): boolean {
  return canLand(plane, stop) && stop.distance <= plane.range * reach;
}

interface Fleet {
  /** Les avions qui décollent de la piste actuelle : ceux qui livrent vraiment. */
  readonly models: readonly Plane[];
  /** Tous les avions possédés, cloués au sol compris : ils prennent une place au hangar. */
  readonly owned: readonly Plane[];
  /** Les avions achetés avant leur piste : le serveur refuse leur départ (`home_runway_too_short`). */
  readonly grounded: readonly Plane[];
  readonly reach: number;
}

/** Les avions de la compagnie, et l'allonge de son pilote le plus endurant. */
function fleetOf(world: CapWorld, c: CapCompany): Fleet {
  const owned = c.planes.map((p) => world.planes.find((m) => m.id === p.model)).filter((m): m is Plane => m !== undefined);
  const home = levelOf(world, c, 'runway')?.runway ?? 'short';
  // La règle de départ du serveur (checkCrew) : l'hydravion part de la rivière, les
  // autres demandent une piste au moins aussi longue que la leur.
  const takesOff = (m: Plane) => m.runway === 'water' || (RUNWAY_ORDER[m.runway] ?? 9) <= (RUNWAY_ORDER[home] ?? 0);
  const reach = c.pilots.reduce((best, p) => {
    const traits = world.pilots.find((x) => x.id === p.pilot)?.traits ?? [];
    return traits.reduce((b, id) => Math.max(b, world.traits.find((t) => t.id === id)?.range ?? 1), best);
  }, 1);
  return { models: owned.filter(takesOff), owned, grounded: owned.filter((m) => !takesOff(m)), reach };
}

function levelOf(world: CapWorld, c: CapCompany, zone: string) {
  return world.zones.find((z) => z.id === zone)?.levels.find((l) => l.level === (c.zones[zone] ?? 1));
}

/** Ce que l'aérodrome doit avoir pour accueillir ce modèle : les règles d'achat et de départ du serveur. */
function worksFor(world: CapWorld, c: CapCompany, fleet: Fleet, plane: Plane): Work[] {
  const works: Work[] = [];
  if (plane.runway === 'water') {
    const berths = levelOf(world, c, 'ponton')?.seaplanes ?? 0;
    if (fleet.owned.filter((m) => m.runway === 'water').length >= berths) works.push('pontoon');
    return works;
  }
  const bays = levelOf(world, c, 'hangar')?.planes ?? 1;
  if (fleet.owned.filter((m) => m.runway !== 'water').length >= bays) works.push('hangar');
  const home = levelOf(world, c, 'runway')?.runway ?? 'short';
  if ((RUNWAY_ORDER[plane.runway] ?? 0) > (RUNWAY_ORDER[home] ?? 0)) works.push('runway');
  return works;
}

/** Pourquoi une escale est hors d'atteinte, et le remède le moins cher. */
function blockerFor(world: CapWorld, c: CapCompany, fleet: Fleet, stop: Stop): Omit<Blocker, 'stops'> {
  const landers = fleet.models.filter((m) => canLand(m, stop));
  const need: Need = landers.length > 0 ? 'range'
    : stop.runway === 'water' ? 'water'
    : stop.runway === 'clearing' ? 'clearing'
    : 'strip';
  const plane = [...world.planes].filter((m) => reaches(m, stop, fleet.reach)).sort((a, b) => a.price - b.price)[0] ?? null;
  // Un pilote plus endurant suffirait-il, avec un avion qu'on a déjà ?
  let pilotTrait: string | null = null;
  if (need === 'range') {
    const best = [...world.traits].filter((t) => (t.range ?? 1) > fleet.reach).sort((a, b) => (a.range ?? 1) - (b.range ?? 1))
      .find((t) => landers.some((m) => reaches(m, stop, t.range ?? 1)));
    pilotTrait = best?.id ?? null;
  }
  return { need, plane: plane?.id ?? null, works: plane ? worksFor(world, c, fleet, plane) : [], pilotTrait };
}

function routeCap(world: CapWorld, c: CapCompany, fleet: Fleet, region: CapWorld['regions'][number]): RouteCap & { sourceOpen: boolean } {
  const route = region.route!;
  const hasPage = c.album.some((a) => a.id === route.requires);
  const from = world.regions.find((x) => x.page === route.requires);
  const sourceOpen = from ? c.regions.includes(from.id) : true;
  const toDeliver = from && !hasPage
    ? world.destinations.filter((d) => d.region === from.id && !c.album.some((a) => a.id === `s-${d.id}`))
    : [];
  const blockers: Blocker[] = [];
  if (sourceOpen) {
    for (const stop of toDeliver) {
      if (fleet.models.some((m) => reaches(m, stop, fleet.reach))) continue;
      // Un avion du hangar y va, mais ne décolle pas d'ici : il lui faut sa piste,
      // pas un avion de plus (le 18 octobre, un Martinet acheté sur le pré).
      const grounded = fleet.grounded.some((m) => reaches(m, stop, fleet.reach));
      const found = blockerFor(world, c, fleet, stop);
      const b = grounded ? { ...found, plane: null, works: ['runway' as const] } : found;
      const same = blockers.find((x) => x.need === b.need && x.plane === b.plane && x.pilotTrait === b.pilotTrait && x.works.join() === b.works.join());
      if (same) (same.stops as string[]).push(stop.id);
      else blockers.push({ ...b, stops: [stop.id] });
    }
  }
  return {
    kind: 'route', region: region.id, requires: route.requires, cost: route.cost,
    hasPage, enough: c.stamps >= route.cost, toDeliver: toDeliver.map((d) => d.id), blockers, sourceOpen,
  };
}

/** La prochaine route, la plus proche ; ou l'album quand toutes sont ouvertes. */
export function nextCap(world: CapWorld, c: CapCompany): Cap {
  const closed = world.regions.filter((r) => r.route && !c.regions.includes(r.id));
  if (closed.length === 0) {
    const missing = world.stamps.length - c.album.length;
    return missing > 0 ? { kind: 'album', missing } : { kind: 'done' };
  }
  const fleet = fleetOf(world, c);
  const ranked = closed.map((r, order) => {
    const cap = routeCap(world, c, fleet, r);
    const stuck = cap.blockers.reduce((n, b) => n + b.stops.length, 0);
    return { cap, key: [cap.sourceOpen ? 0 : 1, cap.hasPage ? 0 : 1, stuck, cap.toDeliver.length, Math.max(0, cap.cost - c.stamps), order] };
  }).sort((a, b) => {
    for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i]! - b.key[i]!;
    return 0;
  });
  const { kind, region, requires, cost, hasPage, enough, toDeliver, blockers } = ranked[0]!.cap;
  return { kind, region, requires, cost, hasPage, enough, toDeliver, blockers };
}
