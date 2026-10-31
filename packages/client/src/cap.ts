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
 * Et un troisième, relevé le 31 octobre sur la partie de la Croisette (deux Grives,
 * le hangar à deux places, le pré fauché) : le cap promettait le remède le moins cher,
 * mais triait les avions sur leur prix de catalogue, que personne ne paie (un avion ne
 * s'achète que par sa carte d'occasion, sim.ts, `playCard`), sans compter les
 * chantiers. Pour Marais-Blanc, il désignait le Martinet (carte 2 600 F, piste roulée
 * 900 F, atelier 2 000 F : 5 500 F) quand le Pic y va pour 5 150 F (carte 3 150 F,
 * atelier 2 000 F ; il décolle du pré). Il proposait aussi « un pilote Longues
 * routes », que le joueur ne choisit pas : la carte d'embauche prend toujours le
 * suivant de la liste. Le cap trie maintenant sur ce qu'il faut vraiment réunir —
 * la carte d'occasion, et les niveaux à bâtir — et dit chaque prix, et le total.
 *
 * Fonction pure : ni réseau, ni page. Elle rend des identifiants et des francs ;
 * l'affichage met les mots.
 */

/** Du plus court au plus long ; l'eau à part. Le même ordre que le serveur. */
const RUNWAY_ORDER: Readonly<Record<string, number>> = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };

export interface CapWorld {
  readonly regions: readonly { readonly id: string; readonly page: string; readonly route?: { readonly requires: string; readonly cost: number } }[];
  readonly destinations: readonly { readonly id: string; readonly region: string; readonly distance: number; readonly runway: string }[];
  /** Pas de prix ici : celui du catalogue n'est jamais payé. Le prix d'un avion est celui de sa carte. */
  readonly planes: readonly { readonly id: string; readonly range: number; readonly runway: string }[];
  readonly pilots: readonly { readonly id: string; readonly traits: readonly string[] }[];
  /** `range` : le facteur de portée d'un trait (« Longues routes »), s'il en a un : l'allonge des pilotes engagés. */
  readonly traits: readonly { readonly id: string; readonly range?: number }[];
  /** `cost` : ce que coûte ce niveau, depuis le précédent ; on les bâtit un par un (sim.ts, `upgradeZone`). */
  readonly zones: readonly { readonly id: string; readonly levels: readonly { readonly level: number; readonly cost: number; readonly runway?: string; readonly planes?: number; readonly seaplanes?: number }[] }[];
  /**
   * Les cartes : on n'y lit que les avions d'occasion (`offer.type === 'plane'`), seul
   * moyen d'en acheter un, avec leur prix — et leur région : une carte de la Forêt ne
   * vient au tirage qu'une fois la Forêt ouverte (sim.ts, `drawCards`).
   */
  readonly cards: readonly { readonly kind: string; readonly region?: string; readonly offer?: { readonly type: string; readonly model?: string; readonly price?: number } }[];
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

/** Ce que l'avion demande à l'aérodrome. */
export type Work = 'hangar' | 'pontoon' | 'runway';

/** Un chantier qui manque, et son prix : tous les niveaux à bâtir jusqu'au premier qui suffit. */
export interface WorkCost {
  readonly work: Work;
  readonly cost: number;
}

/** Des escales que la flotte ne peut pas livrer, pour la même raison et le même remède. */
export interface Blocker {
  readonly need: Need;
  /**
   * L'avion à acheter : celui du remède le moins cher en tout. `null` quand un avion du
   * hangar y va une fois sa piste bâtie, ou quand rien ne peut y aller.
   */
  readonly plane: string | null;
  /** Le prix de sa carte d'occasion ; 0 sans avion à acheter. */
  readonly price: number;
  readonly works: readonly WorkCost[];
  /** Ce qu'il faut réunir en tout : la carte et les chantiers. */
  readonly total: number;
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

type Level = CapWorld['zones'][number]['levels'][number];

/**
 * Ce que coûte la zone jusqu'au premier niveau qui convient : 0 si le niveau actuel
 * convient déjà, la somme des niveaux à bâtir sinon (on les bâtit un par un) ; `null`
 * si aucun ne convient, même le dernier.
 */
function buildCost(world: CapWorld, c: CapCompany, zone: string, fits: (l: Level) => boolean): number | null {
  const levels = [...(world.zones.find((z) => z.id === zone)?.levels ?? [])].sort((a, b) => a.level - b.level);
  const current = c.zones[zone] ?? 1;
  const here = levels.find((l) => l.level === current);
  if (here && fits(here)) return 0;
  let cost = 0;
  for (const l of levels.filter((x) => x.level > current)) {
    cost += l.cost;
    if (fits(l)) return cost;
  }
  return null;
}

/** La piste qu'il faut à ce modèle pour décoller d'ici : la règle de départ du serveur (checkCrew). */
function runwayFor(world: CapWorld, c: CapCompany, plane: Plane): WorkCost[] | null {
  if (plane.runway === 'water') return [];
  const cost = buildCost(world, c, 'runway', (l) => (RUNWAY_ORDER[l.runway ?? 'short'] ?? 0) >= (RUNWAY_ORDER[plane.runway] ?? 9));
  return cost === null ? null : cost > 0 ? [{ work: 'runway', cost }] : [];
}

/**
 * Ce que l'aérodrome doit bâtir pour accueillir un avion de plus, et le faire décoller :
 * les règles d'achat (`playCard` : une place au hangar, ou au ponton pour un hydravion)
 * et de départ du serveur. `null` si aucune place ne viendra jamais (zone au dernier
 * niveau, et pleine : le serveur ne tire plus cette carte).
 */
function worksFor(world: CapWorld, c: CapCompany, fleet: Fleet, plane: Plane): WorkCost[] | null {
  const seaplane = plane.runway === 'water';
  const owned = fleet.owned.filter((m) => (m.runway === 'water') === seaplane).length;
  const place = seaplane
    ? buildCost(world, c, 'ponton', (l) => (l.seaplanes ?? 0) > owned)
    : buildCost(world, c, 'hangar', (l) => (l.planes ?? 0) > owned);
  const runway = runwayFor(world, c, plane);
  if (place === null || runway === null) return null;
  return [...(place > 0 ? [{ work: seaplane ? 'pontoon' as const : 'hangar' as const, cost: place }] : []), ...runway];
}

/**
 * Les avions qu'une carte d'occasion peut apporter : la carte la moins chère de chaque
 * modèle, si sa région est ouverte. Les deux autres règles de tirage du serveur
 * (sim.ts, `drawCards`) sont déjà dans le chemin chiffré : pas d'avion sans place
 * possible (`worksFor` rend `null`) ; pas d'avion à deux crans de piste de plus que
 * l'aérodrome (`planeWithinReach`) — la carte du Héron ne sort pas sur le pré, mais son
 * chemin compte la piste roulée puis la grande, et elle vient une fois la piste roulée
 * bâtie. Le total est juste ; l'ordre, c'est la piste d'abord.
 */
function offers(world: CapWorld, c: CapCompany): Map<string, number> {
  const out = new Map<string, number>();
  for (const k of world.cards) {
    if (k.kind !== 'opportunity' || k.offer?.type !== 'plane' || !k.offer.model || k.offer.price === undefined) continue;
    if (k.region && !c.regions.includes(k.region)) continue;
    out.set(k.offer.model, Math.min(out.get(k.offer.model) ?? Infinity, k.offer.price));
  }
  return out;
}

type Remedy = Omit<Blocker, 'need' | 'stops'>;

/**
 * Pourquoi une escale est hors d'atteinte, et le remède le moins cher **en tout** : un
 * avion du hangar qui y va mais ne décolle pas d'ici (sa piste seule), ou un avion
 * d'occasion (sa carte, sa place, sa piste). À égalité, l'avion qu'on a déjà, puis
 * l'ordre du monde.
 */
function blockerFor(world: CapWorld, c: CapCompany, fleet: Fleet, stop: Stop): Omit<Blocker, 'stops'> {
  const landers = fleet.models.filter((m) => canLand(m, stop));
  const need: Need = landers.length > 0 ? 'range'
    : stop.runway === 'water' ? 'water'
    : stop.runway === 'clearing' ? 'clearing'
    : 'strip';
  const remedies: Remedy[] = [];
  // Le 18 octobre, un Martinet acheté sur le pré : il lui faut sa piste, pas un avion de plus.
  for (const m of fleet.grounded) {
    const works = reaches(m, stop, fleet.reach) ? runwayFor(world, c, m) : null;
    if (works) remedies.push({ plane: null, price: 0, works, total: works.reduce((n, w) => n + w.cost, 0) });
  }
  const forSale = offers(world, c);
  for (const m of world.planes) {
    const price = forSale.get(m.id);
    const works = price !== undefined && reaches(m, stop, fleet.reach) ? worksFor(world, c, fleet, m) : null;
    if (price !== undefined && works) remedies.push({ plane: m.id, price, works, total: price + works.reduce((n, w) => n + w.cost, 0) });
  }
  const best = remedies.reduce<Remedy | null>((a, b) => (a === null || b.total < a.total ? b : a), null);
  return { need, ...(best ?? { plane: null, price: 0, works: [], total: 0 }) };
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
      const b = blockerFor(world, c, fleet, stop);
      const key = (x: Omit<Blocker, 'stops'>) => JSON.stringify([x.need, x.plane, x.works]);
      const same = blockers.find((x) => key(x) === key(b));
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
