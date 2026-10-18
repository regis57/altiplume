/**
 * Le formulaire d'envoi : quel avion peut y aller, et ce que le vol coûtera et durera.
 *
 * Le serveur tranche (`checkCrew` dans `packages/server/src/game/sim.ts`) ; le client
 * ne fait que l'annoncer avant le clic. Deux défauts relevés à la revue du 18 octobre :
 *
 * 1. L'estimation ignorait les traits des pilotes : « Économe » baisse l'entretien,
 *    « Tête brûlée » va plus vite. Héron et Ilias vers Combe-aux-Rosées, avec
 *    l'atelier : l'écran disait ≈ 24 min et 18 F, le serveur faisait voler 21 min et
 *    débitait 16 F.
 * 2. Le formulaire présélectionnait le premier avion libre, même s'il ne pouvait pas
 *    se poser là-bas : une Grive pour un contrat sur l'eau, d'où un « trop lourd » ou
 *    un convoi que le serveur refusait ensuite (« il faut un hydravion »).
 *
 * Fonctions pures, avec les règles et l'ordre des refus du serveur.
 */

/** Du plus court au plus long ; l'eau à part. Le même ordre que le serveur. */
const RUNWAY_ORDER: Readonly<Record<string, number>> = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };

export interface EnvoiWorld {
  readonly planes: readonly { readonly id: string; readonly capacity: number; readonly speed: number; readonly range: number; readonly upkeep: number; readonly runway: string }[];
  readonly pilots: readonly { readonly id: string; readonly traits: readonly string[]; readonly wage: number }[];
  /** Les facteurs d'un trait qui se voient avant le départ : portée, vitesse, entretien. */
  readonly traits: readonly { readonly id: string; readonly range?: number; readonly speed?: number; readonly fuel?: number }[];
  readonly zones: readonly { readonly id: string; readonly levels: readonly { readonly level: number; readonly runway?: string; readonly maintenance?: number }[] }[];
  readonly seasons: readonly { readonly id: string; readonly effects: { readonly duration?: number } }[];
}

export interface EnvoiCompany {
  readonly planes: readonly { readonly id: string; readonly model: string; readonly busyUntil: number | null }[];
  readonly pilots: readonly { readonly id: string; readonly pilot: string; readonly busyUntil: number | null; readonly restedAt: number | null }[];
  readonly zones: Readonly<Record<string, number>>;
  readonly season: { readonly id: string };
}

export interface Stop { readonly distance: number; readonly runway: string }

/** Les refus du serveur qui tiennent à l'avion et à l'escale, dans son ordre. */
export type CrewProblem = 'needs_seaplane' | 'needs_water' | 'needs_clearing_plane' | 'runway_too_short' | 'out_of_range' | 'home_runway_too_short';

type Plane = EnvoiWorld['planes'][number];

function modelOf(world: EnvoiWorld, c: EnvoiCompany, planeId: string): Plane | undefined {
  return world.planes.find((m) => m.id === c.planes.find((p) => p.id === planeId)?.model);
}

function templateOf(world: EnvoiWorld, c: EnvoiCompany, pilotId: string) {
  return world.pilots.find((x) => x.id === c.pilots.find((p) => p.id === pilotId)?.pilot);
}

/** Le produit des facteurs des traits d'un pilote pour un effet : `traitFactor` du serveur. */
export function traitFactor(world: EnvoiWorld, traits: readonly string[], effect: 'range' | 'speed' | 'fuel'): number {
  return traits.reduce((f, id) => f * (world.traits.find((t) => t.id === id)?.[effect] ?? 1), 1);
}

/** L'allonge d'un pilote engagé (« Longues routes ») ; 1 s'il n'en a pas. */
export function pilotReach(world: EnvoiWorld, c: EnvoiCompany, pilotId: string): number {
  return traitFactor(world, templateOf(world, c, pilotId)?.traits ?? [], 'range');
}

/** Un pilote qui se repose encore à l'instant `now` (horloge du serveur). */
export function isResting(p: { readonly restedAt: number | null }, now: number): boolean {
  return p.restedAt !== null && p.restedAt > now;
}

/** Un pilote au sol et reposé. */
export function pilotFree(p: EnvoiCompany['pilots'][number], now: number): boolean {
  return p.busyUntil === null && !isResting(p, now);
}

/** La meilleure allonge parmi les pilotes libres : ce qu'on peut espérer de l'équipage. */
export function bestFreeReach(world: EnvoiWorld, c: EnvoiCompany, now: number): number {
  return c.pilots.filter((p) => pilotFree(p, now)).reduce((best, p) => Math.max(best, pilotReach(world, c, p.id)), 1);
}

/**
 * Pourquoi cet avion, avec cette allonge de pilote, ne peut pas faire ce vol ; `null`
 * s'il le peut. Mêmes règles et même ordre que `checkCrew` : se poser, la portée,
 * puis décoller de chez soi.
 */
export function crewProblem(world: EnvoiWorld, c: EnvoiCompany, planeId: string, reach: number, stop: Stop): CrewProblem | null {
  const model = modelOf(world, c, planeId);
  if (!model) return null;
  const lands = model.runway === 'water' || stop.runway === 'water'
    ? model.runway === stop.runway
    : (RUNWAY_ORDER[model.runway] ?? 9) <= (RUNWAY_ORDER[stop.runway] ?? -1);
  if (!lands) {
    if (stop.runway === 'water') return 'needs_seaplane';
    if (model.runway === 'water') return 'needs_water';
    if (stop.runway === 'clearing') return 'needs_clearing_plane';
    return 'runway_too_short';
  }
  if (stop.distance > model.range * reach) return 'out_of_range';
  if (model.runway !== 'water') {
    const home = world.zones.find((z) => z.id === 'runway')?.levels.find((l) => l.level === (c.zones['runway'] ?? 1))?.runway ?? 'short';
    if ((RUNWAY_ORDER[model.runway] ?? 9) > (RUNWAY_ORDER[home] ?? 0)) return 'home_runway_too_short';
  }
  return null;
}

/**
 * L'avion à présélectionner : le premier libre qui peut y aller avec l'allonge donnée ;
 * à défaut, le premier libre (le formulaire dira pourquoi il ne part pas). `exclude` :
 * l'avion de tête, quand on choisit l'escorte.
 */
export function pickPlane(world: EnvoiWorld, c: EnvoiCompany, stop: Stop, reach: number, exclude?: string): string | null {
  const free = c.planes.filter((p) => p.busyUntil === null && p.id !== exclude);
  return (free.find((p) => crewProblem(world, c, p.id, reach, stop) === null) ?? free[0])?.id ?? null;
}

/** Les avions libres qui peuvent faire ce vol : ceux qui comptent pour un convoi. */
export function ablePlanes(world: EnvoiWorld, c: EnvoiCompany, stop: Stop, reach: number): number {
  return c.planes.filter((p) => p.busyUntil === null && crewProblem(world, c, p.id, reach, stop) === null).length;
}

/**
 * Ce qu'un équipage coûtera et mettra pour l'aller : le calcul de `checkCrew`.
 * Le salaire, plus l'entretien × « Économe » ÷ le hangar ; la durée, à la vitesse
 * × « Tête brûlée », rallongée par la saison.
 */
export function crewEstimate(world: EnvoiWorld, c: EnvoiCompany, planeId: string, pilotId: string, stop: Stop): { durationMs: number; cost: number; capacity: number } | null {
  const model = modelOf(world, c, planeId);
  const tpl = templateOf(world, c, pilotId);
  if (!model || !tpl) return null;
  const maintenance = world.zones.find((z) => z.id === 'hangar')?.levels.find((l) => l.level === (c.zones['hangar'] ?? 1))?.maintenance ?? 1;
  const cost = Math.round(tpl.wage + (model.upkeep * traitFactor(world, tpl.traits, 'fuel')) / maintenance);
  const slower = world.seasons.find((s) => s.id === c.season.id)?.effects.duration ?? 1;
  const baseMs = Math.round((stop.distance / (model.speed * traitFactor(world, tpl.traits, 'speed'))) * 3_600_000);
  return { durationMs: Math.round(baseMs * slower), cost, capacity: model.capacity };
}
