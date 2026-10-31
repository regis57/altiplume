/**
 * La simulation de la compagnie : cartes du jour, vols, arrivées, album.
 *
 * Tout est « sans tick » : rien ne tourne en tâche de fond. À chaque lecture de
 * l'état, `settle()` rattrape ce qui s'est passé depuis la dernière fois — le
 * tirage des jours passés, les vols arrivés — et rend la liste des nouvelles.
 * Toutes les fonctions prennent `now` en paramètre : testables sans faire semblant.
 *
 * Règle absolue : l'absence n'est jamais punie. Rien ne se perd, rien n'expire,
 * sauf les cartes du jour qu'on n'avait pas la place de prendre — et ce n'est pas
 * une perte, c'est du courrier que quelqu'un d'autre a porté.
 */
import type { Database } from '../db/database.ts';
import { transaction } from '../db/database.ts';
import { awardStamp, type Company } from '../db/repos/companies.ts';
import { newId } from '../auth/tokens.ts';
import { gameDayIndex } from '../sim/day.ts';
import { DEFAULT_TIMEZONE, isNight } from '../sim/heure.ts';
import { seasonOf, type Season } from '../sim/saison.ts';
import { deriveSeed, makeRng, type Rng } from '../sim/rng.ts';
import { cardRegion, findCard, findDestination, findPilot, findPlane, findRegion, findTrait, flightDurationMs, REGION_PAGE, regionDestinations, WORLD } from '../world/index.ts';
import type { Card, ContractCard, Destination, PilotTemplate, PlaneModel, RegionId, Runway, SeasonDef, TraitId } from '../world/types.ts';

export const HAND_SIZE = 5;
export const DAILY_DRAW = 3;
/**
 * L'escale attend sa lettre : parmi les contrats du tirage, ceux d'une escale qui n'a
 * jamais reçu de courrier pèsent trois fois plus. Sans elle, la dernière escale d'une
 * région ne dépend que de la chance : 24 % par jour pour Lanterne-du-Val, et un joueur
 * sur dix attendait plus de neuf jours (mesuré le 13/10/2026).
 */
export const WAITING_WEIGHT = 3;
/**
 * La fatigue se compte en minutes de vol, aller et retour compris : un saut à
 * Pont-de-Brume pèse dix minutes, une traversée de l'Archipel deux heures et
 * demie. Un pilote se repose quand il a huit heures de vol dans les bras, et
 * au sol une minute de repos efface deux minutes de vol — une longue journée
 * se rattrape dans l'après-midi, pas en vingt-quatre heures.
 */
export const FATIGUE_MAX_MIN = 10 * 60;
export const FATIGUE_LIMIT_MIN = 8 * 60;
export const FATIGUE_RECOVERY_RATE = 2;
const FOG_DELAY_MS = 20 * 60_000;
/** Le vent de mer : plus court que la brume, mais il ne prévient pas. */
const SEAWIND_DELAY_MS = 15 * 60_000;
const INCIDENT_DELAY_FACTOR = 1.3;
const INCIDENT_WEAR = 15;
const FLIGHT_WEAR = 5;
/**
 * L'usure redescend au sol, comme la fatigue : dix points par heure, multipliés par
 * l'entretien du hangar (× 1,25 avec l'établi, × 1,5 avec l'atelier). Un avion usé
 * jusqu'à 100 est remis à neuf en dix heures, six heures quarante à l'atelier. En l'air,
 * rien ne redescend : le compte part du retour au sol.
 */
export const WEAR_RECOVERY_PER_HOUR = 10;

export type News =
  | { kind: 'cards.drawn'; count: number }
  | { kind: 'cards.released'; count: number }
  | { kind: 'flight.arrived'; flightId: string; destination: string; pilot: string; plane: string; francs: number; bonus: boolean; incident: boolean; wing?: { pilot: string; plane: string } }
  | { kind: 'stamp'; stamp: string };

export interface PilotRow { id: string; pilot: string; affinity: number; morale: number; fatigue: number; fatigue_at: number; scenes_seen: number }
export interface PlaneRow { id: string; model: string; wear: number }
export interface FlightRow {
  id: string; card: string; plane_id: string; pilot_id: string; destination: string; departed_at: number; duration_ms: number;
  deadline_at: number; reward: number; bonus: number; incident: number; settled_at: number | null;
  /** Fret lourd : l'identifiant du vol de tête du convoi (lui-même pour la tête), sinon `null`. */
  convoy: string | null;
}

/** Une clairière est plus courte qu'une piste courte : seul le Pic s'y pose, et lui se pose partout sur la terre. */
const RUNWAY_ORDER: Record<Runway, number> = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };

/** Un hydravion se pose sur l'eau et seulement sur l'eau ; les autres, sur une piste assez longue. */
export function canLand(plane: PlaneModel, destination: Destination): boolean {
  if (plane.runway === 'water' || destination.runway === 'water') return plane.runway === destination.runway;
  return RUNWAY_ORDER[plane.runway] <= RUNWAY_ORDER[destination.runway];
}

/**
 * Ce qu'une flotte peut porter jusqu'à une escale : le plus gros avion capable
 * d'y aller et de s'y poser, puis les deux plus gros ensemble — le convoi.
 */
export function carryCapacity(models: readonly PlaneModel[], destination: Destination, reach = 1, longHaulers = 2): { alone: number; convoy: number } {
  // Ce qu'un avion porte jusque-là, avec ou sans un pilote « Longues routes » aux commandes.
  // Ce pilote ne mène qu'un avion à la fois : dans un convoi, l'allonge ne compte que
  // pour autant d'avions qu'il y a de pilotes qui l'ont.
  const carries = (m: PlaneModel, boosted: boolean) => (canLand(m, destination) && destination.distance <= m.range * (boosted ? reach : 1) ? m.capacity : 0);
  const boost = longHaulers > 0;
  let alone = 0;
  for (const m of models) alone = Math.max(alone, carries(m, boost));
  let convoy = alone;
  for (let i = 0; i < models.length; i += 1) {
    for (let j = i + 1; j < models.length; j += 1) {
      const a = models[i]!; const b = models[j]!;
      const pairs = [carries(a, false) + carries(b, false)];
      if (longHaulers >= 1) pairs.push(carries(a, true) + carries(b, false), carries(a, false) + carries(b, true));
      if (longHaulers >= 2) pairs.push(carries(a, true) + carries(b, true));
      convoy = Math.max(convoy, ...pairs);
    }
  }
  return { alone, convoy };
}

/** Ce que la compagnie possède : ses avions, ses pilotes, et l'allonge du meilleur. */
export interface Fleet {
  readonly planes: readonly PlaneModel[];
  readonly pilots: number;
  /** Le facteur « Longues routes » du pilote le plus endurant ; 1 si personne ne l'a. */
  readonly reach: number;
  /** La piste de l'aérodrome ; sans elle (anciens appels), on ne filtre pas les avions proposés. */
  readonly home?: Runway;
  /** Combien de pilotes ont l'allonge ; sans elle (anciens appels), autant qu'il faut. */
  readonly longHaulers?: number;
  /** Plus aucune place possible : la zone est à son dernier niveau, et pleine. */
  readonly noRoom?: { readonly hangar: boolean; readonly ponton: boolean };
  /** Tous les pilotes du monde sont déjà embauchés. */
  readonly allPilotsHired?: boolean;
}

/**
 * Un avion qu'on peut proposer au joueur : sa piste n'est pas plus courte que d'un cran
 * par rapport à ce qu'il demande. Le Héron (grande piste) n'arrive qu'après la piste
 * roulée ; le 16 octobre, il tombait dès le premier jour, sur un pré fauché, à 5 600 F,
 * pour une compagnie qui en avait 818. L'hydravion part de la rivière : pas concerné.
 */
export function planeWithinReach(model: PlaneModel, home: Runway): boolean {
  if (model.runway === 'water') return true;
  return RUNWAY_ORDER[model.runway] <= RUNWAY_ORDER[home] + 1;
}

/**
 * Un contrat que la compagnie peut vraiment faire avec ce qu'elle a au hangar.
 *
 * On ne regarde ni les vols en cours ni la fatigue : c'est passager, et le jeu
 * ne doit pas punir d'avoir un avion en l'air au moment du tirage. On regarde ce
 * qui ne changera pas d'ici demain : les avions possédés, les pilotes engagés.
 * Un sac de trop, et la carte n'est pas distribuée — la proposer serait mentir.
 */
export function canCarry(card: ContractCard, fleet: Fleet): boolean {
  const destination = findDestination(card.destination);
  if (!destination) return false;
  const { alone, convoy } = carryCapacity(fleet.planes, destination, fleet.reach, fleet.longHaulers ?? 2);
  if (alone >= card.bags) return true;
  // Le fret lourd : deux avions, et deux pilotes pour les mener.
  return fleet.planes.length >= 2 && fleet.pilots >= 2 && convoy >= card.bags;
}

/** La flotte d'une compagnie, telle qu'elle est en base. */
export function companyFleet(db: Database, companyId: string): Fleet {
  const planes = (db.prepare('SELECT model FROM company_planes WHERE company_id = ?').all(companyId) as { model: string }[])
    .flatMap((r) => { const m = findPlane(r.model); return m ? [m] : []; });
  const pilots = (db.prepare('SELECT pilot FROM company_pilots WHERE company_id = ?').all(companyId) as { pilot: string }[])
    .flatMap((r) => { const p = findPilot(r.pilot); return p ? [p] : []; });
  const reach = pilots.reduce((best, p) => Math.max(best, traitFactor(p, 'range')), 1);
  const longHaulers = pilots.filter((p) => traitFactor(p, 'range') > 1).length;
  const zoneLevel = (zone: string) => (db.prepare('SELECT level FROM company_zones WHERE company_id = ? AND zone = ?').get(companyId, zone) as { level: number } | undefined)?.level ?? 1;
  const home = WORLD.zones.find((z) => z.id === 'runway')!.levels.find((l) => l.level === zoneLevel('runway'))?.runway ?? 'short';
  // Une zone sans niveau suivant et pleine : aucun avion de plus ne pourra jamais y dormir.
  const noRoomIn = (zone: 'hangar' | 'ponton') => {
    const levels = WORLD.zones.find((z) => z.id === zone)!.levels;
    if (levels.some((l) => l.level > zoneLevel(zone))) return false;
    const last = levels.find((l) => l.level === zoneLevel(zone));
    const places = (zone === 'ponton' ? last?.seaplanes : last?.planes) ?? 0;
    return planes.filter((m) => (m.runway === 'water') === (zone === 'ponton')).length >= places;
  };
  return {
    planes, pilots: pilots.length, reach, home, longHaulers,
    noRoom: { hangar: noRoomIn('hangar'), ponton: noRoomIn('ponton') },
    allPilotsHired: WORLD.pilots.every((p) => pilots.some((h) => h.id === p.id)),
  };
}

/** Le cachet « toute la région » de chaque région (défini avec le monde). */
const REGION_STAMP = REGION_PAGE;

/** La région de l'aérodrome : les Vallées de Brume. Le reste, c'est « loin de chez soi ». */
export const HOME_REGION: RegionId = 'brume';

/** Les régions dont la route est ouverte ; celle de départ l'est toujours. */
export function unlockedRegions(db: Database, companyId: string): RegionId[] {
  const rows = db.prepare('SELECT region FROM company_regions WHERE company_id = ? ORDER BY opened_at').all(companyId) as { region: string }[];
  const set = new Set<RegionId>([HOME_REGION]);
  for (const r of rows) if (findRegion(r.region)) set.add(r.region as RegionId);
  return [...set];
}

/** Ce que la saison fait à un effet donné, à l'instant donné ; 1 = rien. */
export function seasonEffect(now: number, effect: keyof SeasonDef['effects']): number {
  const season = seasonOf(now).season;
  return WORLD.seasons.find((x) => x.id === season)?.effects[effect] ?? 1;
}

/**
 * La chance de la compagnie : celle de son pilote le plus chanceux, pas le produit de
 * tous. « Les bonnes cartes suivent ce pilote » : un porte-bonheur suffit, dix ne
 * font pas une compagnie dix fois plus chanceuse (règle du 14/10 ; avant, dix pilotes
 * donnaient × 1,5 d'occasions et ÷ 1,5 d'imprévus, et la fin de partie s'adoucissait
 * sans que rien ne le dise).
 */
export function companyLuck(db: Database, companyId: string): number {
  return (db.prepare('SELECT pilot FROM company_pilots WHERE company_id = ?').all(companyId) as { pilot: string }[])
    .reduce((best, r) => { const p = findPilot(r.pilot); return p ? Math.max(best, traitFactor(p, 'luck')) : best; }, 1);
}

/** Multiplicateur combiné des deux traits d'un pilote pour un effet donné. */
export function traitFactor(pilot: PilotTemplate, effect: keyof NonNullable<ReturnType<typeof findTrait>>['effects']): number {
  return pilot.traits.reduce((f, id: TraitId) => f * (findTrait(id)?.effects[effect] ?? 1), 1);
}

/**
 * Fatigue effective, en minutes de vol. `fatigue_at` est l'heure du retour au
 * sol : en l'air, rien ne s'efface ; au sol, deux minutes de vol par minute.
 */
export function currentFatigue(row: Pick<PilotRow, 'fatigue' | 'fatigue_at'>, now: number): number {
  const recovered = (Math.max(0, now - row.fatigue_at) / 60_000) * FATIGUE_RECOVERY_RATE;
  return Math.max(0, Math.round(row.fatigue - recovered));
}

/** Ce que le joueur voit : dix crans, le pilote se repose au huitième. */
export function fatiguePoints(minutes: number): number {
  return Math.min(10, Math.floor(minutes / 60));
}

/** Quand ce pilote pourra repartir, ou `null` s'il peut déjà. */
export function restedAt(minutes: number, now: number): number | null {
  if (minutes < FATIGUE_LIMIT_MIN) return null;
  return now + Math.ceil((minutes - FATIGUE_LIMIT_MIN + 1) / FATIGUE_RECOVERY_RATE) * 60_000;
}

/** La ligne régulière : pas de contrat, pas de prime, pas de délai à tenir. */
export function isStanding(card: ReturnType<typeof findCard>): boolean {
  return card?.kind === 'contract' && card.standing === true;
}

/**
 * Ce que le pilote met de fatigue dans un vol vers cette destination : son trait
 * « fatigue » partout, « fatigueAway » (Cœur de village) hors de la région de l'aérodrome.
 */
export function fatigueFactor(pilot: PilotTemplate, destination: Pick<Destination, 'region'>): number {
  return traitFactor(pilot, 'fatigue') * (destination.region === HOME_REGION ? 1 : traitFactor(pilot, 'fatigueAway'));
}

/** L'entretien du hangar : 1 avec la porte de travers, 1,25 avec l'établi, 1,5 avec l'atelier. */
export function hangarMaintenance(db: Database, companyId: string): number {
  const level = (db.prepare("SELECT level FROM company_zones WHERE company_id = ? AND zone = 'hangar'").get(companyId) as { level: number } | undefined)?.level ?? 1;
  return WORLD.zones.find((z) => z.id === 'hangar')!.levels.find((l) => l.level === level)?.maintenance ?? 1;
}

/** Combien de millisecondes au sol effacent un point d'usure, à cet entretien (6 min, 4 min 48 s, 4 min). */
function msPerWearPoint(maintenance: number): number {
  return Math.round(3_600_000 / (WEAR_RECOVERY_PER_HOUR * maintenance));
}

/**
 * Usure effective, entière. `wear_at` est l'heure à laquelle `wear` a été comptée (le
 * retour au sol après un vol) : avant, rien ne bouge ; après, un point par
 * `msPerWearPoint`, sans descendre sous zéro.
 */
export function currentWear(row: { wear: number; wear_at: number }, now: number, maintenance: number): number {
  const points = Math.floor(Math.max(0, now - row.wear_at) / msPerWearPoint(maintenance));
  return Math.max(0, row.wear - points);
}

/**
 * Inscrit en base ce que les avions au sol ont récupéré depuis la dernière fois. Seul
 * le temps qui a effacé des points entiers est consommé : le reste compte pour la
 * suite, et une page rechargée toutes les minutes ne perd rien à l'arrondi.
 */
export function restPlanes(db: Database, companyId: string, now: number): void {
  const step = msPerWearPoint(hangarMaintenance(db, companyId));
  const planes = db.prepare(`SELECT id, wear, wear_at FROM company_planes WHERE company_id = ? AND wear_at < ?
    AND id NOT IN (SELECT plane_id FROM flights WHERE company_id = ? AND departed_at + 2 * duration_ms > ?)`).all(companyId, now, companyId, now) as { id: string; wear: number; wear_at: number }[];
  for (const p of planes) {
    const points = Math.floor((now - p.wear_at) / step);
    if (points <= 0) continue;
    if (points >= p.wear) db.prepare('UPDATE company_planes SET wear = 0, wear_at = ? WHERE id = ?').run(now, p.id);
    else db.prepare('UPDATE company_planes SET wear = ?, wear_at = ? WHERE id = ?').run(p.wear - points, p.wear_at + points * step, p.id);
  }
}

/** Fin d'occupation d'un avion et d'un pilote : l'aller, puis le retour. */
export function busyUntil(f: Pick<FlightRow, 'departed_at' | 'duration_ms'>): number {
  return f.departed_at + 2 * f.duration_ms;
}

// ---- Lecture ----

export function listHand(db: Database, companyId: string): { card: string; drawnAt: number }[] {
  return (db.prepare('SELECT card, drawn_at FROM company_hand WHERE company_id = ? ORDER BY drawn_at, card').all(companyId) as { card: string; drawn_at: number }[])
    .map((r) => ({ card: r.card, drawnAt: r.drawn_at }));
}

export function listFlights(db: Database, companyId: string, now: number): FlightRow[] {
  // Les vols dont l'avion est encore occupé, plus les arrivées non encaissées.
  return db.prepare('SELECT * FROM flights WHERE company_id = ? AND (settled_at IS NULL OR departed_at + 2 * duration_ms > ?) ORDER BY departed_at').all(companyId, now) as unknown as FlightRow[];
}

export function listLedger(db: Database, companyId: string, limit = 12): { at: number; kind: string; francs: number; ref: string | null }[] {
  return db.prepare('SELECT at, kind, francs, ref FROM ledger WHERE company_id = ? ORDER BY at DESC, id DESC LIMIT ?').all(companyId, limit) as { at: number; kind: string; francs: number; ref: string | null }[];
}

function ledger(db: Database, companyId: string, now: number, kind: string, francs: number, ref: string | null): void {
  db.prepare('INSERT INTO ledger (company_id, at, kind, francs, ref) VALUES (?, ?, ?, ?, ?)').run(companyId, now, kind, francs, ref);
}

// ---- Le jour : tirage des cartes ----

/** Une carte d'embauche : « Un pilote de passage », et ses deux cousines de la Forêt et de l'Archipel. */
function isHire(c: Card | undefined): boolean {
  return c?.kind === 'opportunity' && c.offer.type === 'pilot';
}

/**
 * Le hangar attend son pilote : tant que la compagnie a plus d'avions que de pilotes, la
 * première carte du tirage est une carte d'embauche, sauf si l'une d'elles attend déjà en
 * main (ou, par principe, en vol : tout ce qui est exclu du tirage). Un pilote ne mène
 * qu'un avion à la fois ; avec deux Grives et un pilote, Côte et Forêt ouvertes, main vide,
 * la carte d'embauche ne sortait que 7,7 % des jours, et 45 % des joueurs passaient dix
 * jours sans la voir, la seconde Grive au sol (mesuré le 31/10/2026). Quand les dix
 * pilotes sont engagés, il n'y a plus de carte d'embauche à tirer : rien n'est forcé.
 */
export function pilotAwaited(fleet: Fleet | undefined, exclude: readonly string[]): boolean {
  return fleet !== undefined && fleet.planes.length > fleet.pilots && !exclude.some((id) => isHire(findCard(id)));
}

/** Tire les cartes du jour, pondérées par rareté et par la chance des pilotes. */
export function drawCards(
  rng: Rng, exclude: readonly string[], luck: number, count = DAILY_DRAW, regions: readonly RegionId[] = ['brume'], album: readonly string[] = [], season?: Season, fleet?: Fleet,
): string[] {
  const pool = WORLD.cards.filter((c) => !exclude.includes(c.id) && !(c.kind === 'contract' && c.standing) && regions.includes(cardRegion(c))
    // Une carte qui attend une page d'album (la cloche attend que Sonnefeuille ait été livrée) ne vient qu'ensuite.
    && !(c.kind === 'contract' && c.requires && !album.includes(c.requires))
    // Une carte de saison ne vient qu'en sa saison ; sans saison donnée, elle ne vient pas.
    && (c.kind === 'opportunity' || c.season === undefined || c.season === season)
    // Et jamais un contrat que les avions du hangar ne peuvent pas porter.
    && !(c.kind === 'contract' && fleet !== undefined && !canCarry(c, fleet))
    // Ni un avion à vendre qui demande deux crans de piste de plus que l'aérodrome n'en a.
    && !(c.kind === 'opportunity' && c.offer.type === 'plane' && fleet?.home !== undefined
      && !planeWithinReach(findPlane(c.offer.model)!, fleet.home))
    // Ni un avion qu'aucune place ne pourra jamais accueillir (hangar ou ponton à leur
    // dernier niveau, et pleins), ni un pilote quand tous sont déjà là : ces cartes ne
    // pouvaient que dire « non », pour toujours (revue du 18 octobre).
    && !(c.kind === 'opportunity' && c.offer.type === 'plane' && fleet?.noRoom
      && fleet.noRoom[findPlane(c.offer.model)!.runway === 'water' ? 'ponton' : 'hangar'])
    && !(c.kind === 'opportunity' && c.offer.type === 'pilot' && fleet?.allPilotsHired === true)
    // Ni un imprévu de coque ou de flotteurs chez qui n'a pas d'hydravion.
    && !(c.kind === 'event' && c.needsSeaplane === true && fleet !== undefined && !fleet.planes.some((m) => m.runway === 'water')));
  const seeds = WORLD.seasons.find((x) => x.id === season)?.effects.seedsWeight ?? 1;
  const waiting = (c: (typeof pool)[number]) => c.kind === 'contract' && !album.includes(`s-${c.destination}`);
  // Poids inverse à la rareté ; la chance favorise les opportunités et défavorise les imprévus.
  const weightOf = (c: (typeof pool)[number]) => {
    let w = 1 / c.weight;
    // Au printemps, les semences partent deux fois plus souvent.
    if (c.kind === 'contract' && c.cargo === 'seeds') w *= seeds;
    if (c.kind === 'opportunity') w *= luck;
    if (c.kind === 'event') w /= luck;
    return w;
  };
  // Une roue : un tirage de `rng`, un rang choisi au poids.
  const spin = (weights: readonly number[]) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let index = 0;
    while (index < weights.length - 1 && r >= (weights[index] as number)) { r -= weights[index] as number; index += 1; }
    return index;
  };
  const out: string[] = [];
  const take = (index: number) => { out.push((pool[index] as (typeof pool)[number]).id); pool.splice(index, 1); };
  // Le hangar attend son pilote : la carte d'embauche passe en tête du tirage. S'il y en a
  // plusieurs dans le paquet (la Forêt et l'Archipel ont la leur), la roue choisit, au poids.
  if (count > 0 && pilotAwaited(fleet, exclude)) {
    const hires = pool.flatMap((c, k) => (isHire(c) ? [k] : []));
    if (hires.length > 0) take(hires[spin(hires.map((k) => weightOf(pool[k] as (typeof pool)[number])))] as number);
  }
  while (out.length < count && pool.length > 0) {
    const weights = pool.map(weightOf);
    // L'escale attend sa lettre : parmi les contrats, ceux d'une escale qui n'a encore
    // rien reçu pèsent trois fois plus. Les contrats gardent ensemble le même poids,
    // donc ni plus ni moins d'imprévus et d'occasions qu'avant. Quand toutes les escales
    // attendent (le premier jour) ou qu'aucune n'attend plus, rien ne change.
    const contracts = pool.filter((c) => c.kind === 'contract');
    if (contracts.some(waiting) && !contracts.every(waiting)) {
      const before = pool.reduce((sum, c, k) => sum + (c.kind === 'contract' ? (weights[k] as number) : 0), 0);
      const after = pool.reduce((sum, c, k) => sum + (c.kind === 'contract' ? (weights[k] as number) * (waiting(c) ? WAITING_WEIGHT : 1) : 0), 0);
      pool.forEach((c, k) => { if (c.kind === 'contract') weights[k] = (weights[k] as number) * (waiting(c) ? WAITING_WEIGHT : 1) * (before / after); });
    }
    take(spin(weights));
  }
  return out;
}

/**
 * Rattrape tout ce qui s'est passé depuis la dernière lecture : le tirage du jour,
 * les vols arrivés. Rend les nouvelles, à afficher une fois.
 */
export function settle(db: Database, company: Company, playerId: string, now: number): News[] {
  return transaction(db, () => {
    const news: News[] = [];
    // 0. L'usure des avions au sol redescend.
    restPlanes(db, company.id, now);
    const row = db.prepare('SELECT last_draw_day, flights_count, deadlines_met FROM companies WHERE id = ?').get(company.id) as { last_draw_day: number; flights_count: number; deadlines_met: number };

    // 1. Les vols arrivés et pas encore encaissés.
    const arrived = db.prepare('SELECT * FROM flights WHERE company_id = ? AND settled_at IS NULL AND departed_at + duration_ms <= ? ORDER BY departed_at').all(company.id, now) as unknown as FlightRow[];
    let deadlinesMet = row.deadlines_met;
    for (const f of arrived) {
      const arrivedAt = f.departed_at + f.duration_ms;
      const card = findCard(f.card);
      // La ligne régulière n'a ni contrat ni délai : elle ne compte jamais « à l'heure »
      // (ni moral, ni page « À l'heure », ni « délai tenu » dans les nouvelles).
      const onTime = !isStanding(card) && arrivedAt <= f.deadline_at;
      // L'ailier d'un convoi : il a volé, son pilote y gagne en affinité et en moral,
      // mais c'est la tête qui encaisse, annonce et colle les pages.
      if (f.convoy !== null && f.convoy !== f.id) {
        db.prepare('UPDATE flights SET settled_at = ? WHERE id = ?').run(now, f.id);
        db.prepare('UPDATE company_pilots SET affinity = affinity + 1, morale = MIN(20, MAX(0, morale + ?)) WHERE id = ?')
          .run((onTime ? 1 : 0) - (f.incident ? 1 : 0), f.pilot_id);
        continue;
      }
      const francs = f.reward + (onTime ? f.bonus : 0);
      db.prepare('UPDATE flights SET settled_at = ? WHERE id = ?').run(now, f.id);
      db.prepare('UPDATE companies SET francs = francs + ? WHERE id = ?').run(francs, company.id);
      db.prepare('UPDATE company_pilots SET affinity = affinity + 1, morale = MIN(20, MAX(0, morale + ?)) WHERE id = ?')
        .run((onTime ? 1 : 0) - (f.incident ? 1 : 0), f.pilot_id);
      ledger(db, company.id, arrivedAt, 'flight.arrived', francs, f.destination);
      if (onTime) deadlinesMet += 1;
      const pilot = db.prepare('SELECT pilot FROM company_pilots WHERE id = ?').get(f.pilot_id) as { pilot: string } | undefined;
      const plane = db.prepare('SELECT model FROM company_planes WHERE id = ?').get(f.plane_id) as { model: string } | undefined;
      const wingRow = f.convoy === f.id
        ? db.prepare('SELECT p.pilot AS pilot, pl.model AS plane, f.incident AS incident FROM flights f JOIN company_pilots p ON p.id = f.pilot_id JOIN company_planes pl ON pl.id = f.plane_id WHERE f.convoy = ? AND f.id != ?').get(f.id, f.id) as { pilot: string; plane: string; incident: number } | undefined
        : undefined;
      news.push({
        kind: 'flight.arrived', flightId: f.id, destination: f.destination, pilot: pilot?.pilot ?? '', plane: plane?.model ?? '', francs, bonus: onTime,
        incident: f.incident === 1 || wingRow?.incident === 1, ...(wingRow ? { wing: { pilot: wingRow.pilot, plane: wingRow.plane } } : {}),
      });

      // L'album.
      const stamps: string[] = ['s-premier-vol', `s-${f.destination}`];
      const dest = findDestination(f.destination);
      // La nuit du joueur, à son heure (14/10) : de 21 h à 6 h là où il est.
      if (dest?.hazard === 'night' && isNight(arrivedAt, companyTimezone(db, company.id))) stamps.push('s-nuit');
      if (dest?.runway === 'water') stamps.push('s-hydravion');
      if (dest?.runway === 'clearing') stamps.push('s-clairiere');
      if (f.convoy === f.id) stamps.push('s-convoi');
      // La première livraison de chaque saison ; les quatre font une année.
      stamps.push(`s-${seasonOf(arrivedAt).season}`);
      if (card?.kind === 'contract' && card.stamp) stamps.push(card.stamp);
      if (deadlinesMet >= 10) stamps.push('s-delai');
      for (const s of stamps) {
        if (!awardStamp(db, company.id, s, arrivedAt)) continue;
        news.push({ kind: 'stamp', stamp: s });
        // Une première livraison lointaine vaut plus qu'une page : 2 ou 3 cachets au lieu d'un.
        const extra = s === `s-${f.destination}` ? Math.max(0, (dest?.firstDeliveryStamps ?? 1) - 1) : 0;
        if (extra > 0) db.prepare('UPDATE companies SET stamps = stamps + ? WHERE id = ?').run(extra, company.id);
      }
      const seasonsDone = db.prepare("SELECT COUNT(*) AS n FROM company_stamps WHERE company_id = ? AND stamp IN ('s-printemps', 's-ete', 's-automne', 's-hiver')").get(company.id) as { n: number };
      if (Number(seasonsDone.n) === 4 && awardStamp(db, company.id, 's-annee', arrivedAt)) news.push({ kind: 'stamp', stamp: 's-annee' });
      // Toute la région livrée : la page qui ouvre la suivante.
      const region = dest?.region ?? 'brume';
      const all = regionDestinations(region);
      const delivered = db.prepare('SELECT COUNT(*) AS n FROM company_stamps WHERE company_id = ? AND stamp IN (' + all.map(() => '?').join(',') + ')')
        .get(company.id, ...all.map((d) => `s-${d.id}`)) as { n: number };
      if (Number(delivered.n) === all.length && awardStamp(db, company.id, REGION_STAMP[region], arrivedAt)) news.push({ kind: 'stamp', stamp: REGION_STAMP[region] });
    }
    if (deadlinesMet !== row.deadlines_met) db.prepare('UPDATE companies SET deadlines_met = ? WHERE id = ?').run(deadlinesMet, company.id);

    // 2. Le tirage du jour, une fois par jour de jeu, dans la place qui reste.
    // Les jours d'absence tirent aussi leurs cartes, du plus ancien au plus récent :
    // seules se perdent celles qu'on n'a pas la place de prendre. Deux jours suffisent
    // à remplir une main vide (3 + 3 ≥ 5) ; une compagnie neuve ne tire que le jour même.
    const today = gameDayIndex(now);
    if (row.last_draw_day < today) {
      const fleet = companyFleet(db, company.id);
      // Ce qui dort en main et qu'aucun avion du hangar ne peut porter repart par
      // la route : une carte ne reste pas en travers de la main pour toujours.
      const stuck = listHand(db, company.id).filter((h) => {
        const c = findCard(h.card);
        return c !== undefined && c.kind === 'contract' && !canCarry(c, fleet);
      });
      for (const h of stuck) db.prepare('DELETE FROM company_hand WHERE company_id = ? AND card = ?').run(company.id, h.card);
      if (stuck.length > 0) news.push({ kind: 'cards.released', count: stuck.length });
      const luck = companyLuck(db, company.id);
      const regions = unlockedRegions(db, company.id);
      const inFlight = (db.prepare('SELECT card FROM flights WHERE company_id = ? AND settled_at IS NULL').all(company.id) as { card: string }[]).map((r) => r.card);
      const album = (db.prepare('SELECT stamp FROM company_stamps WHERE company_id = ?').all(company.id) as { stamp: string }[]).map((r) => r.stamp);
      const first = row.last_draw_day < 0 ? today : Math.max(row.last_draw_day + 1, today - 1);
      let added = 0;
      let room = HAND_SIZE - listHand(db, company.id).length;
      for (let d = first; d <= today && room > 0; d += 1) {
        // La main a changé au passage précédent : la place et les exclusions se recalculent.
        const hand = listHand(db, company.id);
        room = HAND_SIZE - hand.length;
        const drawn = drawCards(makeRng(deriveSeed(playerId, d, 'cards')), [...hand.map((h) => h.card), ...inFlight], luck, DAILY_DRAW, regions, album, seasonOf(now).season, fleet);
        for (const card of drawn.slice(0, room)) {
          db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES (?, ?, ?)').run(company.id, card, now);
          added += 1;
        }
        room = HAND_SIZE - listHand(db, company.id).length;
      }
      db.prepare('UPDATE companies SET last_draw_day = ? WHERE id = ?').run(today, company.id);
      if (added > 0) news.push({ kind: 'cards.drawn', count: added });
    }
    return news;
  });
}

// ---- Expédier ----

export type DispatchError =
  | 'card_unknown' | 'card_not_contract' | 'plane_unknown' | 'pilot_unknown' | 'plane_busy' | 'pilot_busy' | 'pilot_tired'
  | 'plane_too_small' | 'runway_too_short' | 'home_runway_too_short' | 'needs_seaplane' | 'needs_water' | 'needs_clearing_plane' | 'out_of_range' | 'not_enough_francs' | 'event_pending' | 'runway_closed' | 'region_locked'
  | 'convoy_not_needed' | 'convoy_same';

/** Un équipage : un avion, un pilote, ce qu'ils coûtent et ce qu'ils mettent pour l'aller. */
export interface Crew {
  readonly plane: PlaneRow; readonly model: PlaneModel;
  readonly pilot: PilotRow; readonly template: PilotTemplate;
  readonly durationMs: number;
  readonly cost: number;
}

export interface DispatchPlan extends Crew {
  readonly card: ContractCard;
  readonly destination: Destination;
  /** Ce que la tour de la Croisette fait au temps et à la nuit ; 1 = rien. */
  readonly tower?: { readonly weather: number; readonly night: number };
  /** Le fuseau du joueur : la nuit aux lanternes se compte à son heure. */
  readonly timezone?: string;
  /**
   * Le fret lourd : un second équipage qui vole avec le premier, quand un seul
   * avion ne porte pas tous les sacs. `durationMs` et `cost` du plan sont alors
   * ceux du convoi entier — le plus lent des deux, la somme des deux.
   */
  readonly wing?: Crew;
}

/**
 * Vérifie un équipage pour une destination : l'avion et le pilote existent, sont
 * libres, le pilote n'est pas trop fatigué, l'avion se pose là-bas, y va, et
 * décolle de chez soi. `bags`, s'il est donné, est vérifié à sa place habituelle
 * (après la fatigue, avant la piste) : l'ordre des refus ne change pas.
 */
function checkCrew(
  db: Database, company: Company, destination: Destination, planeId: string, pilotId: string, busy: readonly { plane_id: string; pilot_id: string }[], now: number, bags?: number,
): { ok: true; crew: Crew } | { ok: false; error: DispatchError } {
  const row = db.prepare('SELECT id, model, wear, wear_at FROM company_planes WHERE id = ? AND company_id = ?').get(planeId, company.id) as (PlaneRow & { wear_at: number }) | undefined;
  const model = row ? findPlane(row.model) : undefined;
  if (!row || !model) return { ok: false, error: 'plane_unknown' };
  // Un hangar équipé entretient mieux : l'établi divise l'entretien par 1,25, l'atelier par 1,5,
  // et l'usure redescend d'autant plus vite au sol.
  const maintenance = hangarMaintenance(db, company.id);
  const plane: PlaneRow = { id: row.id, model: row.model, wear: currentWear(row, now, maintenance) };
  const pilot = db.prepare('SELECT * FROM company_pilots WHERE id = ? AND company_id = ?').get(pilotId, company.id) as PilotRow | undefined;
  const template = pilot ? findPilot(pilot.pilot) : undefined;
  if (!pilot || !template) return { ok: false, error: 'pilot_unknown' };
  if (busy.some((b) => b.plane_id === plane.id)) return { ok: false, error: 'plane_busy' };
  if (busy.some((b) => b.pilot_id === pilot.id)) return { ok: false, error: 'pilot_busy' };
  if (currentFatigue(pilot, now) >= FATIGUE_LIMIT_MIN) return { ok: false, error: 'pilot_tired' };
  if (bags !== undefined && model.capacity < bags) return { ok: false, error: 'plane_too_small' };
  if (!canLand(model, destination)) {
    if (destination.runway === 'water') return { ok: false, error: 'needs_seaplane' };
    if (model.runway === 'water') return { ok: false, error: 'needs_water' };
    if (destination.runway === 'clearing') return { ok: false, error: 'needs_clearing_plane' };
    return { ok: false, error: 'runway_too_short' };
  }
  if (destination.distance > model.range * traitFactor(template, 'range')) return { ok: false, error: 'out_of_range' };
  // Il faut aussi pouvoir décoller de chez soi : le Martinet demande la piste roulée, le Héron la grande piste.
  // (L'hydravion part de la rivière ; il n'existe pas sans ponton.)
  const zone = (id: string) => (db.prepare('SELECT level FROM company_zones WHERE company_id = ? AND zone = ?').get(company.id, id) as { level: number } | undefined)?.level ?? 1;
  if (model.runway !== 'water') {
    const home = WORLD.zones.find((z) => z.id === 'runway')!.levels.find((l) => l.level === zone('runway'))?.runway ?? 'short';
    if (RUNWAY_ORDER[model.runway] > RUNWAY_ORDER[home]) return { ok: false, error: 'home_runway_too_short' };
  }
  const cost = Math.round(template.wage + (model.upkeep * traitFactor(template, 'fuel')) / maintenance);
  // L'hiver, la neige et le froid rallongent les vols.
  const durationMs = Math.round(flightDurationMs(destination, model, traitFactor(template, 'speed')) * seasonEffect(now, 'duration'));
  return { ok: true, crew: { plane, model, pilot, template, durationMs, cost } };
}

/**
 * Vérifie une intention d'expédition et calcule ce qu'elle coûtera et durera.
 *
 * `wing` : le second équipage d'un convoi. Il n'est accepté que si un seul avion
 * ne suffit pas (sinon `convoy_not_needed`), et les deux réunis doivent porter
 * tous les sacs.
 */
export function planDispatch(
  db: Database, company: Company, cardId: string, planeId: string, pilotId: string, now: number, wing?: { plane: string; pilot: string },
): { ok: true; plan: DispatchPlan } | { ok: false; error: DispatchError } {
  const card = findCard(cardId);
  if (!card) return { ok: false, error: 'card_unknown' };
  if (card.kind !== 'contract') return { ok: false, error: 'card_not_contract' };
  // La ligne régulière n'est jamais en main : elle est toujours là.
  const inHand = card.standing || db.prepare('SELECT 1 FROM company_hand WHERE company_id = ? AND card = ?').get(company.id, cardId);
  if (!inHand) return { ok: false, error: 'card_unknown' };
  // Un imprévu en main, c'est une vache sur la piste : rien ne décolle tant qu'on n'a pas tranché.
  if (pendingEvent(db, company)) return { ok: false, error: 'event_pending' };
  // Et quand on a choisi d'attendre, la piste reste fermée le temps annoncé.
  const closed = runwayClosedUntil(db, company.id);
  if (closed !== null && closed > now) return { ok: false, error: 'runway_closed' };
  const destination = findDestination(card.destination);
  if (!destination) return { ok: false, error: 'card_unknown' };
  if (!unlockedRegions(db, company.id).includes(destination.region)) return { ok: false, error: 'region_locked' };

  const busy = db.prepare('SELECT plane_id, pilot_id FROM flights WHERE company_id = ? AND departed_at + 2 * duration_ms > ?').all(company.id, now) as { plane_id: string; pilot_id: string }[];
  const lead = checkCrew(db, company, destination, planeId, pilotId, busy, now, wing ? undefined : card.bags);
  if (!lead.ok) return lead;
  let second: Crew | undefined;
  if (wing) {
    if (lead.crew.model.capacity >= card.bags) return { ok: false, error: 'convoy_not_needed' };
    if (wing.plane === planeId || wing.pilot === pilotId) return { ok: false, error: 'convoy_same' };
    const w = checkCrew(db, company, destination, wing.plane, wing.pilot, busy, now);
    if (!w.ok) return w;
    if (lead.crew.model.capacity + w.crew.model.capacity < card.bags) return { ok: false, error: 'plane_too_small' };
    second = w.crew;
  }
  const cost = lead.crew.cost + (second?.cost ?? 0);
  // La ligne régulière ne coûte rien au départ : la poste avance le salaire et le
  // carburant, et les retient sur le tarif à l'arrivée. C'est ce qui garantit qu'une
  // compagnie ne peut jamais rester clouée au sol, même la caisse vide.
  if (!card.standing && company.francs < cost) return { ok: false, error: 'not_enough_francs' };
  const durationMs = Math.max(lead.crew.durationMs, second?.durationMs ?? 0);
  const towerLevel = (db.prepare("SELECT level FROM company_zones WHERE company_id = ? AND zone = 'tour'").get(company.id) as { level: number } | undefined)?.level ?? 1;
  const towerDef = WORLD.zones.find((z) => z.id === 'tour')?.levels.find((l) => l.level === towerLevel);
  const tower = { weather: towerDef?.weather ?? 1, night: towerDef?.night ?? 1 };
  return { ok: true, plan: { ...lead.crew, card, destination, durationMs, cost, tower, timezone: companyTimezone(db, company.id), ...(second ? { wing: second } : {}) } };
}

/**
 * La probabilité d'un incident mécanique sur ce vol, dans [0, 1].
 *
 * Elle part de la fiabilité de l'avion (au trait du pilote près, et entamée par
 * l'usure), puis se multiplie : la nuit aux lanternes la double (÷ 4 pour un pilote
 * Nocturne) ; le moral la fait varier de × 0,75 (20) à × 1,25 (0) ; l'humidité des
 * sous-bois de la Forêt de Cuivre la multiplie par 1,5.
 */
export function incidentRisk(plan: Pick<DispatchPlan, 'destination' | 'model' | 'plane' | 'pilot' | 'template' | 'tower'> & { timezone?: string; durationMs?: number }, now: number): number {
  // La nuit se juge à l'arrivée, comme la page « Vol de nuit » de l'album : c'est
  // l'atterrissage aux lanternes qui est risqué.
  const nightFlight = plan.destination.hazard === 'night' && isNight(now + (plan.durationMs ?? 0), plan.timezone ?? DEFAULT_TIMEZONE);
  // La nuit : × 2, ÷ 4 pour un pilote Nocturne, et × 0,7 encore avec le feu de la tour.
  const nightFactor = nightFlight ? 2 * traitFactor(plan.template, 'nightRisk') * (plan.tower?.night ?? 1) : 1;
  const moraleFactor = 1 + (10 - plan.pilot.morale) / 40;
  const canopyFactor = plan.destination.hazard === 'canopy' ? 1.5 : 1;
  const baseReliability = Math.min(1, plan.model.reliability * traitFactor(plan.template, 'reliability') * (1 - plan.plane.wear / 400));
  return Math.min(1, (1 - baseReliability) * nightFactor * moraleFactor * canopyFactor);
}

/**
 * Expédie : débite le coût, fatigue le pilote, tire l'aléa du vol, enregistre le vol.
 *
 * Un convoi s'enregistre en deux lignes de vol partis ensemble : celle de tête
 * porte la récompense ; celle de l'ailier ne porte rien, mais occupe son avion et
 * son pilote, et désigne la tête par `convoy`. Les aléas du convoi sont tirés après
 * ceux d'un vol simple : un vol à un seul avion tire exactement les mêmes nombres
 * qu'avant le fret lourd.
 */
export function dispatch(db: Database, company: Company, playerId: string, plan: DispatchPlan, now: number): FlightRow {
  return transaction(db, () => {
    const row = db.prepare('SELECT flights_count FROM companies WHERE id = ?').get(company.id) as { flights_count: number };
    const rng = makeRng(deriveSeed(playerId, row.flights_count, 'flight'));
    const leadIncident = rng() > 1 - incidentRisk(plan, now);
    let durationMs = plan.durationMs;
    // La saison pèse sur le temps qu'il fait : l'été chasse la brume et le vent de mer, l'automne ramène la brume.
    // Et la vigie de la tour, qui a regardé le ciel avant le départ.
    const lookout = plan.tower?.weather ?? 1;
    if (plan.destination.hazard === 'fog' && rng() < 0.5 * traitFactor(plan.template, 'fogRisk') * seasonEffect(now, 'fogRisk') * lookout) durationMs += FOG_DELAY_MS;
    if (plan.destination.hazard === 'seawind' && rng() < 0.4 * traitFactor(plan.template, 'fogRisk') * seasonEffect(now, 'seawindRisk') * lookout) durationMs += SEAWIND_DELAY_MS;
    // L'ailier a son propre moteur, et donc son propre aléa ; le convoi attend le plus lent.
    const wingIncident = plan.wing ? rng() > 1 - incidentRisk({ ...plan.wing, destination: plan.destination, durationMs: plan.durationMs, ...(plan.timezone ? { timezone: plan.timezone } : {}), ...(plan.tower ? { tower: plan.tower } : {}) }, now) : false;
    if (leadIncident || wingIncident) durationMs = Math.round(durationMs * INCIDENT_DELAY_FACTOR);

    // Ligne régulière : rien au départ, le tarif moins l'avance à l'arrivée — et jamais moins que zéro.
    const advanced = plan.card.standing === true;
    const debit = advanced ? 0 : plan.cost;
    // L'hiver, le courrier vaut plus cher : la prime de froid s'ajoute au tarif (pas à la prime de délai).
    const tariff = Math.round(plan.card.reward * seasonEffect(now, 'reward'));
    const reward = advanced ? Math.max(0, tariff - plan.cost) : tariff;
    const id = newId();
    const deadline = now + plan.card.softDeadlineHours * 3_600_000;
    const insert = db.prepare(`INSERT INTO flights (id, company_id, card, plane_id, pilot_id, destination, departed_at, duration_ms, deadline_at, reward, bonus, incident, convoy)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insert.run(id, company.id, plan.card.id, plan.plane.id, plan.pilot.id, plan.destination.id, now, durationMs, deadline, reward, plan.card.bonus, leadIncident ? 1 : 0, plan.wing ? id : null);
    if (plan.wing) {
      insert.run(newId(), company.id, plan.card.id, plan.wing.plane.id, plan.wing.pilot.id, plan.destination.id, now, durationMs, deadline, 0, 0, wingIncident ? 1 : 0, id);
    }
    db.prepare('DELETE FROM company_hand WHERE company_id = ? AND card = ?').run(company.id, plan.card.id);
    db.prepare('UPDATE companies SET francs = francs - ?, flights_count = flights_count + 1 WHERE id = ?').run(debit, company.id);
    // Chaque équipage s'use et se fatigue pour lui-même : du temps passé en l'air, aller et retour, au trait du pilote près.
    // L'usure, comme la fatigue, ne redescend qu'une fois l'avion rentré.
    const crews: [Crew, boolean][] = [[plan, leadIncident], ...(plan.wing ? [[plan.wing, wingIncident] as [Crew, boolean]] : [])];
    for (const [crew, incident] of crews) {
      const wear = Math.round((FLIGHT_WEAR + (incident ? INCIDENT_WEAR : 0)) * traitFactor(crew.template, 'wear'));
      const fatigueGain = Math.max(1, Math.round(((2 * durationMs) / 60_000) * fatigueFactor(crew.template, plan.destination)));
      db.prepare('UPDATE company_planes SET wear = ?, wear_at = ? WHERE id = ?')
        .run(Math.min(100, crew.plane.wear + wear), busyUntil({ departed_at: now, duration_ms: durationMs }), crew.plane.id);
      db.prepare('UPDATE company_pilots SET fatigue = ?, fatigue_at = ? WHERE id = ?')
        .run(Math.min(FATIGUE_MAX_MIN, currentFatigue(crew.pilot, now) + fatigueGain), busyUntil({ departed_at: now, duration_ms: durationMs }), crew.pilot.id);
    }
    ledger(db, company.id, now, 'flight.departed', -debit, plan.destination.id);
    return db.prepare('SELECT * FROM flights WHERE id = ?').get(id) as unknown as FlightRow;
  });
}

// ---- Jouer une carte (imprévu, opportunité) ou la défausser ----

export type PlayError = 'card_unknown' | 'choice_unknown' | 'not_enough_francs' | 'hangar_full' | 'no_pontoon' | 'no_pilot_available' | 'card_is_contract';

export function playCard(db: Database, company: Company, cardId: string, choiceId: string | undefined, now: number): { ok: true; effects: Record<string, number>; ref?: string } | { ok: false; error: PlayError } {
  const inHand = db.prepare('SELECT 1 FROM company_hand WHERE company_id = ? AND card = ?').get(company.id, cardId);
  const card = findCard(cardId);
  if (!inHand || !card) return { ok: false, error: 'card_unknown' };
  if (card.kind === 'contract') return { ok: false, error: 'card_is_contract' };

  return transaction(db, () => {
    const effects: Record<string, number> = {};
    let ref: string | undefined;
    if (card.kind === 'event') {
      const choice = card.choices.find((c) => c.id === choiceId);
      if (!choice) return { ok: false as const, error: 'choice_unknown' as const };
      const e = choice.effects;
      if (e.francs && e.francs < 0 && company.francs + e.francs < 0) return { ok: false as const, error: 'not_enough_francs' as const };
      if (e.francs) { db.prepare('UPDATE companies SET francs = francs + ? WHERE id = ?').run(e.francs, company.id); effects['francs'] = e.francs; }
      if (e.morale) { db.prepare('UPDATE company_pilots SET morale = MIN(20, MAX(0, morale + ?)) WHERE company_id = ?').run(e.morale, company.id); effects['morale'] = e.morale; }
      if (e.wear) {
        // L'avion le moins usé parmi ceux qui sont au sol — jamais un avion en l'air —
        // et un hydravion quand l'imprévu parle de coque ou de flotteurs.
        restPlanes(db, company.id, now);
        const water = WORLD.planes.filter((p) => p.runway === 'water').map((p) => p.id);
        const grounded = (db.prepare('SELECT id, model, wear FROM company_planes WHERE company_id = ? ORDER BY wear').all(company.id) as { id: string; model: string; wear: number }[])
          .filter((p) => !db.prepare('SELECT 1 FROM flights WHERE plane_id = ? AND departed_at + 2 * duration_ms > ?').get(p.id, now))
          .filter((p) => !card.needsSeaplane || water.includes(p.model));
        const target = grounded[0];
        if (target && target.wear < 100) {
          db.prepare('UPDATE company_planes SET wear = MIN(100, wear + ?) WHERE id = ?').run(e.wear, target.id);
          effects['wear'] = Math.min(e.wear, 100 - target.wear);
        }
      }
      if (e.waitHours) {
        // Attendre, c'est attendre : la piste reste fermée le nombre d'heures annoncé
        // (règle du 14/10 ; avant, le « retard » visait un vol en l'air, et s'il n'y en
        // avait aucun, on pouvait repartir tout de suite après « dormir sur place »).
        // Les vols déjà en l'air, eux, ne sont pas concernés.
        const until = Math.max(now, runwayClosedUntil(db, company.id) ?? 0) + e.waitHours * 3_600_000;
        db.prepare('UPDATE companies SET runway_closed_until = ? WHERE id = ?').run(until, company.id);
        effects['waitHours'] = e.waitHours;
      }
      if (e.stamps) { db.prepare('UPDATE companies SET stamps = stamps + ? WHERE id = ?').run(e.stamps, company.id); effects['stamps'] = e.stamps; }
      ref = choice.id;
      ledger(db, company.id, now, 'card.played', e.francs ?? 0, `${card.id}:${choice.id}`);
    } else {
      const offer = card.offer;
      if (offer.type === 'plane') {
        const model = findPlane(offer.model)!;
        // Un hydravion s'amarre au ponton ; les autres dorment au hangar.
        const seaplane = model.runway === 'water';
        const zoneId = seaplane ? 'ponton' : 'hangar';
        const level = (db.prepare('SELECT level FROM company_zones WHERE company_id = ? AND zone = ?').get(company.id, zoneId) as { level: number } | undefined)?.level ?? 1;
        const zoneLevel = WORLD.zones.find((z) => z.id === zoneId)!.levels.find((l) => l.level === level);
        const capacity = (seaplane ? zoneLevel?.seaplanes : zoneLevel?.planes) ?? 0;
        const waterModels = WORLD.planes.filter((p) => p.runway === 'water').map((p) => p.id);
        const owned = (db.prepare('SELECT model FROM company_planes WHERE company_id = ?').all(company.id) as { model: string }[])
          .filter((r) => waterModels.includes(r.model) === seaplane).length;
        if (owned >= capacity) return { ok: false as const, error: seaplane ? 'no_pontoon' as const : 'hangar_full' as const };
        if (company.francs < offer.price) return { ok: false as const, error: 'not_enough_francs' as const };
        db.prepare('INSERT INTO company_planes (id, company_id, model, wear, wear_at, acquired_at) VALUES (?, ?, ?, 10, ?, ?)').run(newId(), company.id, model.id, now, now);
        db.prepare('UPDATE companies SET francs = francs - ? WHERE id = ?').run(offer.price, company.id);
        effects['francs'] = -offer.price; ref = model.id;
        ledger(db, company.id, now, 'purchase.plane', -offer.price, model.id);
      } else if (offer.type === 'pilot') {
        const hired = (db.prepare('SELECT pilot FROM company_pilots WHERE company_id = ?').all(company.id) as { pilot: string }[]).map((r) => r.pilot);
        const next = WORLD.pilots.find((p) => !hired.includes(p.id));
        if (!next) return { ok: false as const, error: 'no_pilot_available' as const };
        db.prepare('INSERT INTO company_pilots (id, company_id, pilot, hired_at) VALUES (?, ?, ?, ?)').run(newId(), company.id, next.id, now);
        ref = next.id;
        ledger(db, company.id, now, 'hire.pilot', 0, next.id);
      } else if (offer.type === 'fete') {
        if (company.francs < offer.cost) return { ok: false as const, error: 'not_enough_francs' as const };
        db.prepare('UPDATE companies SET francs = francs - ? WHERE id = ?').run(offer.cost, company.id);
        db.prepare('UPDATE company_pilots SET morale = MIN(20, morale + ?) WHERE company_id = ?').run(offer.morale, company.id);
        effects['francs'] = -offer.cost; effects['morale'] = offer.morale;
        ledger(db, company.id, now, 'card.played', -offer.cost, card.id);
      } else {
        db.prepare('UPDATE companies SET stamps = stamps + ? WHERE id = ?').run(offer.stamps, company.id);
        effects['stamps'] = offer.stamps;
        ledger(db, company.id, now, 'card.played', 0, card.id);
      }
    }
    db.prepare('DELETE FROM company_hand WHERE company_id = ? AND card = ?').run(company.id, cardId);
    return { ok: true as const, effects, ...(ref ? { ref } : {}) };
  });
}

/** Un imprévu non tranché bloque la piste. */
/** Le fuseau du joueur de la compagnie, pour la nuit du jeu. */
export function companyTimezone(db: Database, companyId: string): string {
  const row = db.prepare('SELECT p.timezone AS tz FROM companies c JOIN players p ON p.id = c.player_id WHERE c.id = ?').get(companyId) as { tz: string } | undefined;
  return row?.tz ?? DEFAULT_TIMEZONE;
}

/** L'heure à laquelle la piste rouvre, après un imprévu où l'on a choisi d'attendre. */
export function runwayClosedUntil(db: Database, companyId: string): number | null {
  const row = db.prepare('SELECT runway_closed_until AS t FROM companies WHERE id = ?').get(companyId) as { t: number } | undefined;
  return row && row.t > 0 ? row.t : null;
}

export function pendingEvent(db: Database, company: Company): string | null {
  const rows = db.prepare('SELECT card FROM company_hand WHERE company_id = ?').all(company.id) as { card: string }[];
  const found = rows.find((r) => findCard(r.card)?.kind === 'event');
  return found ? found.card : null;
}

/** Laisser passer : un contrat ou une opportunité, jamais un imprévu — lui, on le tranche. */
export function discardCard(db: Database, company: Company, cardId: string): boolean {
  if (findCard(cardId)?.kind === 'event') return false;
  return Number(db.prepare('DELETE FROM company_hand WHERE company_id = ? AND card = ?').run(company.id, cardId).changes) === 1;
}

// ---- Ouvrir une route ----

export type RouteError = 'region_unknown' | 'region_open' | 'route_requires' | 'not_enough_stamps';

/**
 * Ouvre la route d'une région : il faut la page d'album exigée, et les cachets
 * se dépensent — c'est la monnaie de prestige, elle sert à ça.
 */
export function openRegion(db: Database, company: Company, regionId: string, now: number): { ok: true } | { ok: false; error: RouteError } {
  const region = findRegion(regionId);
  if (!region || !region.route) return { ok: false, error: 'region_unknown' };
  return transaction(db, () => {
    if (unlockedRegions(db, company.id).includes(region.id)) return { ok: false as const, error: 'region_open' as const };
    const has = db.prepare('SELECT 1 FROM company_stamps WHERE company_id = ? AND stamp = ?').get(company.id, region.route!.requires);
    if (!has) return { ok: false as const, error: 'route_requires' as const };
    const stamps = (db.prepare('SELECT stamps FROM companies WHERE id = ?').get(company.id) as { stamps: number }).stamps;
    if (stamps < region.route!.cost) return { ok: false as const, error: 'not_enough_stamps' as const };
    db.prepare('UPDATE companies SET stamps = stamps - ? WHERE id = ?').run(region.route!.cost, company.id);
    db.prepare('INSERT INTO company_regions (company_id, region, opened_at) VALUES (?, ?, ?)').run(company.id, region.id, now);
    ledger(db, company.id, now, 'route.opened', 0, region.id);
    awardStamp(db, company.id, `s-route-${region.id}`, now);
    return { ok: true as const };
  });
}

// ---- Restaurer et décorer ----

export type BuildError = 'zone_unknown' | 'zone_max' | 'zone_changed' | 'decoration_unknown' | 'decoration_owned' | 'not_enough_francs';

/**
 * Monte une zone d'un niveau, si la caisse le permet. `level` est le niveau que le
 * joueur a vu sur le bouton : si la zone n'est plus juste en dessous (requête rejouée,
 * second onglet), rien ne se passe, et il ne paie pas un niveau qu'il n'a pas vu.
 */
export function upgradeZone(db: Database, company: Company, zoneId: string, now: number, level: number): { ok: true; level: number } | { ok: false; error: BuildError } {
  const zone = WORLD.zones.find((z) => z.id === zoneId);
  if (!zone) return { ok: false, error: 'zone_unknown' };
  return transaction(db, () => {
    const current = (db.prepare('SELECT level FROM company_zones WHERE company_id = ? AND zone = ?').get(company.id, zoneId) as { level: number } | undefined)?.level ?? 1;
    if (level !== current + 1) return { ok: false as const, error: 'zone_changed' as const };
    const next = zone.levels.find((l) => l.level === current + 1);
    if (!next) return { ok: false as const, error: 'zone_max' as const };
    const francs = (db.prepare('SELECT francs FROM companies WHERE id = ?').get(company.id) as { francs: number }).francs;
    if (francs < next.cost) return { ok: false as const, error: 'not_enough_francs' as const };
    // Le nouvel atelier entretient mieux à partir de maintenant, pas rétroactivement.
    if (zoneId === 'hangar') restPlanes(db, company.id, now);
    db.prepare('UPDATE companies SET francs = francs - ? WHERE id = ?').run(next.cost, company.id);
    db.prepare('UPDATE company_zones SET level = ? WHERE company_id = ? AND zone = ?').run(next.level, company.id, zoneId);
    ledger(db, company.id, now, 'build.zone', -next.cost, `${zoneId}:${next.level}`);
    return { ok: true as const, level: next.level };
  });
}

/** Pose une décoration, une seule fois chacune. */
export function placeDecoration(db: Database, company: Company, decorationId: string, now: number): { ok: true } | { ok: false; error: BuildError } {
  const deco = WORLD.decorations.find((d) => d.id === decorationId);
  if (!deco) return { ok: false, error: 'decoration_unknown' };
  return transaction(db, () => {
    const owned = db.prepare('SELECT 1 FROM company_decorations WHERE company_id = ? AND decoration = ?').get(company.id, decorationId);
    if (owned) return { ok: false as const, error: 'decoration_owned' as const };
    const francs = (db.prepare('SELECT francs FROM companies WHERE id = ?').get(company.id) as { francs: number }).francs;
    if (francs < deco.cost) return { ok: false as const, error: 'not_enough_francs' as const };
    db.prepare('UPDATE companies SET francs = francs - ? WHERE id = ?').run(deco.cost, company.id);
    db.prepare('INSERT INTO company_decorations (company_id, decoration, placed_at) VALUES (?, ?, ?)').run(company.id, decorationId, now);
    // Le moral : léger, et pour tout le monde. C'est le Stardew en nous.
    db.prepare('UPDATE company_pilots SET morale = MIN(20, morale + ?) WHERE company_id = ?').run(deco.morale, company.id);
    ledger(db, company.id, now, 'build.decoration', -deco.cost, decorationId);
    return { ok: true as const };
  });
}
