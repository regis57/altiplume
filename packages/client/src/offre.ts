/**
 * Un avion à vendre : ce qu'il faut pour l'acheter, et pour qu'il vole.
 *
 * Le 16 octobre, la carte du Héron proposait « Acheter · 5600 F » à une compagnie
 * qui avait 818 F, un hangar plein et un pré fauché : on ne découvrait le refus
 * qu'après avoir cliqué. La carte dit maintenant, avant le clic, comme les routes :
 * le prix et ce qu'on a en caisse, la place au hangar (ou au ponton), et la piste
 * qu'il faut pour décoller. Les deux premiers bloquent l'achat (le serveur les
 * refuse) ; la piste avertit seulement : acheter un avion avant d'avoir fini sa
 * piste est une décision légitime, tant qu'on la prend en connaissance de cause.
 *
 * Le 31 octobre, deux Grives et un seul pilote : la carte ne disait pas qu'un avion
 * sans personne pour le mener reste au sol. Elle le dit maintenant, et dit d'où viendra
 * le pilote : le hangar attend son pilote (la règle du tirage, côté serveur).
 */

const RUNWAY_ORDER: Readonly<Record<string, number>> = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };

export interface OfferWorld {
  readonly planes: readonly { readonly id: string; readonly runway: string }[];
  /** Les cartes du monde : on y reconnaît les cartes d'embauche (`offer.type === 'pilot'`). */
  readonly cards: readonly { readonly id: string; readonly offer?: { readonly type: string } }[];
  readonly zones: readonly { readonly id: string; readonly levels: readonly { readonly level: number; readonly name: string; readonly runway?: string; readonly planes?: number; readonly seaplanes?: number }[] }[];
}

export interface OfferCompany {
  readonly francs: number;
  readonly planes: readonly { readonly model: string }[];
  readonly pilots: readonly unknown[];
  readonly hand: readonly { readonly card: string }[];
  readonly zones: Readonly<Record<string, number>>;
}

/** La main : cinq cartes au plus, comme au serveur (sim.ts, `HAND_SIZE`) ; un test les compare. */
export const HAND_SIZE = 5;

/**
 * D'où viendra le pilote d'un avion qui n'en a pas. Un pilote ne mène qu'un avion à la
 * fois ; tant que la compagnie a plus d'avions que de pilotes, le hangar attend son
 * pilote : la première carte du tirage est une carte d'embauche, à moins qu'une d'elles
 * n'attende déjà dans la main (sim.ts, `pilotAwaited`). Un tirage ne donne rien à une
 * main pleine.
 *
 * - `'nextDraw'` : un pilote se présentera au prochain tirage ;
 * - `'handFull'` : au premier tirage qui trouvera une place dans la main ;
 * - `'inHand'` : il attend déjà dans la main, il n'y a plus qu'à l'embaucher ;
 * - `null` : chaque avion a son pilote.
 */
export type AwaitedPilot = 'nextDraw' | 'handFull' | 'inHand' | null;

/**
 * `buying` : on lit la carte d'un avion à vendre, comme s'il était acheté — il compte au
 * hangar, et sa carte a quitté la main.
 */
export function awaitedPilot(world: OfferWorld, c: OfferCompany, buying = false): AwaitedPilot {
  if (c.planes.length + (buying ? 1 : 0) <= c.pilots.length) return null;
  if (hireInHand(world, c)) return 'inHand';
  return c.hand.length - (buying ? 1 : 0) < HAND_SIZE ? 'nextDraw' : 'handFull';
}

/** Une carte d'embauche attend dans la main. */
export function hireInHand(world: OfferWorld, c: OfferCompany): boolean {
  return c.hand.some((h) => world.cards.find((k) => k.id === h.card)?.offer?.type === 'pilot');
}

/**
 * Le palier du premier mois, au cap : tant que la compagnie n'a qu'un avion, le cap
 * propose le deuxième, et dit le pilote qu'il faudra pour le mener.
 *
 * - `'crew'` : un deuxième pilote est déjà engagé ;
 * - `'inHand'` : une carte d'embauche attend dans la main ;
 * - `'afterPurchase'` : le pilote se présentera au tirage qui suit l'achat (la carte de
 *   l'avion quitte la main à l'achat : il y aura une place) ;
 * - `null` : pas un seul avion, rien à proposer.
 */
export type SecondPlaneHint = 'crew' | 'inHand' | 'afterPurchase' | null;

export function secondPlaneHint(world: OfferWorld, c: OfferCompany): SecondPlaneHint {
  if (c.planes.length !== 1) return null;
  if (c.pilots.length > 1) return 'crew';
  return hireInHand(world, c) ? 'inHand' : 'afterPurchase';
}

export interface PlaneOffer {
  readonly seaplane: boolean;
  readonly money: boolean;
  /** Une place libre au hangar, ou au ponton pour un hydravion. */
  readonly place: boolean;
  /** La piste de l'aérodrome suffit pour décoller ; toujours vrai pour un hydravion. */
  readonly runway: boolean;
  /** Le nom du niveau de piste qu'il faut ; `null` pour un hydravion. */
  readonly runwayName: string | null;
  /** L'achat est possible : l'argent et la place (la piste n'avertit que). */
  readonly canBuy: boolean;
  /** Si on l'achète : d'où viendra le prochain pilote, quand la compagnie n'a pas plus de pilotes que d'avions ; `null` sinon (n'avertit que). */
  readonly pilot: AwaitedPilot;
  /** Si on l'achète : les pilotes qui manqueront, un par avion sans pilote (il en vient un par tirage). */
  readonly pilotsMissing: number;
}

export function planeOffer(world: OfferWorld, c: OfferCompany, modelId: string, price: number): PlaneOffer {
  const model = world.planes.find((p) => p.id === modelId);
  const seaplane = model?.runway === 'water';
  const zone = (id: string) => world.zones.find((z) => z.id === id);
  const level = (id: string) => zone(id)?.levels.find((l) => l.level === (c.zones[id] ?? 1));
  const sameKind = c.planes.filter((p) => (world.planes.find((m) => m.id === p.model)?.runway === 'water') === seaplane).length;
  const capacity = seaplane ? level('ponton')?.seaplanes ?? 0 : level('hangar')?.planes ?? 1;
  const money = c.francs >= price;
  const place = sameKind < capacity;
  let runway = true;
  let runwayName: string | null = null;
  if (model && !seaplane) {
    const home = level('runway')?.runway ?? 'short';
    runway = (RUNWAY_ORDER[model.runway] ?? 9) <= (RUNWAY_ORDER[home] ?? 0);
    // Le premier niveau de piste qui suffit à ce modèle.
    runwayName = zone('runway')?.levels.find((l) => (RUNWAY_ORDER[l.runway ?? 'short'] ?? 0) >= (RUNWAY_ORDER[model.runway] ?? 9))?.name ?? null;
  }
  return {
    seaplane, money, place, runway, runwayName, canBuy: money && place,
    pilot: awaitedPilot(world, c, true), pilotsMissing: Math.max(0, c.planes.length + 1 - c.pilots.length),
  };
}

/**
 * Ce que le serveur refuse faute de francs, dit avant le clic : la fête (« Y aller · 15 F »)
 * quand la caisse n'a pas son prix, un choix d'imprévu payant quand la caisse passerait
 * sous zéro (`playCard`). Un gain ou un choix gratuit reste toujours ouvert.
 */
export function canAfford(francs: number, delta: number | undefined): boolean {
  return delta === undefined || delta >= 0 || francs + delta >= 0;
}
