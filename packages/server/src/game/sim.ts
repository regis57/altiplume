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
import { deriveSeed, makeRng, type Rng } from '../sim/rng.ts';
import { cardRegion, findCard, findDestination, findPilot, findPlane, findRegion, findTrait, flightDurationMs, regionDestinations, WORLD } from '../world/index.ts';
import type { ContractCard, Destination, PilotTemplate, PlaneModel, RegionId, Runway, TraitId } from '../world/types.ts';

export const HAND_SIZE = 5;
export const DAILY_DRAW = 3;
export const FATIGUE_MAX = 10;
export const FATIGUE_LIMIT = 8;
/** Un point de fatigue s'efface toutes les trois heures. */
export const FATIGUE_RECOVERY_MS = 3 * 3_600_000;
const FOG_DELAY_MS = 20 * 60_000;
/** Le vent de mer : plus court que la brume, mais il ne prévient pas. */
const SEAWIND_DELAY_MS = 15 * 60_000;
const INCIDENT_DELAY_FACTOR = 1.3;
const INCIDENT_WEAR = 15;
const FLIGHT_WEAR = 5;

export type News =
  | { kind: 'cards.drawn'; count: number }
  | { kind: 'flight.arrived'; flightId: string; destination: string; pilot: string; plane: string; francs: number; bonus: boolean; incident: boolean }
  | { kind: 'stamp'; stamp: string };

export interface PilotRow { id: string; pilot: string; affinity: number; morale: number; fatigue: number; fatigue_at: number; scenes_seen: number }
export interface PlaneRow { id: string; model: string; wear: number }
export interface FlightRow {
  id: string; card: string; plane_id: string; pilot_id: string; destination: string; departed_at: number; duration_ms: number;
  deadline_at: number; reward: number; bonus: number; incident: number; settled_at: number | null;
}

const RUNWAY_ORDER: Record<Runway, number> = { short: 0, medium: 1, long: 2, water: 3 };

/** Un hydravion se pose sur l'eau et seulement sur l'eau ; les autres, sur une piste assez longue. */
export function canLand(plane: PlaneModel, destination: Destination): boolean {
  if (plane.runway === 'water' || destination.runway === 'water') return plane.runway === destination.runway;
  return RUNWAY_ORDER[plane.runway] <= RUNWAY_ORDER[destination.runway];
}

/** Le cachet « toute la région » de chaque région. */
const REGION_STAMP: Record<RegionId, string> = { brume: 's-vallee', saline: 's-cote', archipel: 's-archipel' };

/** Les régions dont la route est ouverte ; celle de départ l'est toujours. */
export function unlockedRegions(db: Database, companyId: string): RegionId[] {
  const rows = db.prepare('SELECT region FROM company_regions WHERE company_id = ? ORDER BY opened_at').all(companyId) as { region: string }[];
  const set = new Set<RegionId>(['brume']);
  for (const r of rows) if (findRegion(r.region)) set.add(r.region as RegionId);
  return [...set];
}

/** Multiplicateur combiné des deux traits d'un pilote pour un effet donné. */
export function traitFactor(pilot: PilotTemplate, effect: keyof NonNullable<ReturnType<typeof findTrait>>['effects']): number {
  return pilot.traits.reduce((f, id: TraitId) => f * (findTrait(id)?.effects[effect] ?? 1), 1);
}

/** Fatigue effective à l'instant donné : elle redescend d'un point toutes les trois heures. */
export function currentFatigue(row: Pick<PilotRow, 'fatigue' | 'fatigue_at'>, now: number): number {
  const recovered = Math.floor(Math.max(0, now - row.fatigue_at) / FATIGUE_RECOVERY_MS);
  return Math.max(0, row.fatigue - recovered);
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

/** Tire les cartes du jour, pondérées par rareté et par la chance des pilotes. */
export function drawCards(rng: Rng, exclude: readonly string[], luck: number, count = DAILY_DRAW, regions: readonly RegionId[] = ['brume']): string[] {
  const pool = WORLD.cards.filter((c) => !exclude.includes(c.id) && !(c.kind === 'contract' && c.standing) && regions.includes(cardRegion(c)));
  const out: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    // Poids inverse à la rareté ; la chance favorise les opportunités et défavorise les imprévus.
    const weights = pool.map((c) => {
      let w = 1 / c.weight;
      if (c.kind === 'opportunity') w *= luck;
      if (c.kind === 'event') w /= luck;
      return w;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let index = 0;
    while (index < pool.length - 1 && r >= (weights[index] as number)) { r -= weights[index] as number; index += 1; }
    out.push((pool[index] as (typeof pool)[number]).id);
    pool.splice(index, 1);
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
    const row = db.prepare('SELECT last_draw_day, flights_count, deadlines_met FROM companies WHERE id = ?').get(company.id) as { last_draw_day: number; flights_count: number; deadlines_met: number };

    // 1. Les vols arrivés et pas encore encaissés.
    const arrived = db.prepare('SELECT * FROM flights WHERE company_id = ? AND settled_at IS NULL AND departed_at + duration_ms <= ? ORDER BY departed_at').all(company.id, now) as unknown as FlightRow[];
    let deadlinesMet = row.deadlines_met;
    for (const f of arrived) {
      const arrivedAt = f.departed_at + f.duration_ms;
      const onTime = arrivedAt <= f.deadline_at;
      const francs = f.reward + (onTime ? f.bonus : 0);
      db.prepare('UPDATE flights SET settled_at = ? WHERE id = ?').run(now, f.id);
      db.prepare('UPDATE companies SET francs = francs + ? WHERE id = ?').run(francs, company.id);
      db.prepare('UPDATE company_pilots SET affinity = affinity + 1, morale = MIN(20, MAX(0, morale + ?)) WHERE id = ?')
        .run((onTime ? 1 : 0) - (f.incident ? 1 : 0), f.pilot_id);
      ledger(db, company.id, arrivedAt, 'flight.arrived', francs, f.destination);
      if (onTime) deadlinesMet += 1;
      const pilot = db.prepare('SELECT pilot FROM company_pilots WHERE id = ?').get(f.pilot_id) as { pilot: string } | undefined;
      const plane = db.prepare('SELECT model FROM company_planes WHERE id = ?').get(f.plane_id) as { model: string } | undefined;
      news.push({ kind: 'flight.arrived', flightId: f.id, destination: f.destination, pilot: pilot?.pilot ?? '', plane: plane?.model ?? '', francs, bonus: onTime, incident: f.incident === 1 });

      // L'album.
      const stamps: string[] = ['s-premier-vol', `s-${f.destination}`];
      const dest = findDestination(f.destination);
      const hour = new Date(arrivedAt).getUTCHours();
      if (dest?.hazard === 'night' && (hour >= 20 || hour < 6)) stamps.push('s-nuit');
      if (dest?.runway === 'water') stamps.push('s-hydravion');
      if (deadlinesMet >= 10) stamps.push('s-delai');
      for (const s of stamps) {
        if (!awardStamp(db, company.id, s, arrivedAt)) continue;
        news.push({ kind: 'stamp', stamp: s });
        // Une première livraison lointaine vaut plus qu'une page : 2 ou 3 cachets au lieu d'un.
        const extra = s === `s-${f.destination}` ? Math.max(0, (dest?.firstDeliveryStamps ?? 1) - 1) : 0;
        if (extra > 0) db.prepare('UPDATE companies SET stamps = stamps + ? WHERE id = ?').run(extra, company.id);
      }
      // Toute la région livrée : la page qui ouvre la suivante.
      const region = dest?.region ?? 'brume';
      const all = regionDestinations(region);
      const delivered = db.prepare('SELECT COUNT(*) AS n FROM company_stamps WHERE company_id = ? AND stamp IN (' + all.map(() => '?').join(',') + ')')
        .get(company.id, ...all.map((d) => `s-${d.id}`)) as { n: number };
      if (Number(delivered.n) === all.length && awardStamp(db, company.id, REGION_STAMP[region], arrivedAt)) news.push({ kind: 'stamp', stamp: REGION_STAMP[region] });
    }
    if (deadlinesMet !== row.deadlines_met) db.prepare('UPDATE companies SET deadlines_met = ? WHERE id = ?').run(deadlinesMet, company.id);

    // 2. Le tirage du jour, une fois par jour de jeu, dans la place qui reste.
    const today = gameDayIndex(now);
    if (row.last_draw_day < today) {
      const hand = listHand(db, company.id);
      const room = HAND_SIZE - hand.length;
      const luck = (db.prepare('SELECT pilot FROM company_pilots WHERE company_id = ?').all(company.id) as { pilot: string }[])
        .reduce((f, r) => { const p = findPilot(r.pilot); return p ? f * traitFactor(p, 'luck') : f; }, 1);
      const inFlight = (db.prepare('SELECT card FROM flights WHERE company_id = ? AND settled_at IS NULL').all(company.id) as { card: string }[]).map((r) => r.card);
      const drawn = drawCards(makeRng(deriveSeed(playerId, today, 'cards')), [...hand.map((h) => h.card), ...inFlight], luck, DAILY_DRAW, unlockedRegions(db, company.id));
      let added = 0;
      for (const card of drawn.slice(0, Math.max(0, room))) {
        db.prepare('INSERT OR IGNORE INTO company_hand (company_id, card, drawn_at) VALUES (?, ?, ?)').run(company.id, card, now);
        added += 1;
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
  | 'plane_too_small' | 'runway_too_short' | 'home_runway_too_short' | 'needs_seaplane' | 'needs_water' | 'out_of_range' | 'not_enough_francs' | 'event_pending' | 'region_locked';

export interface DispatchPlan {
  readonly card: ContractCard;
  readonly destination: Destination;
  readonly plane: PlaneRow; readonly model: PlaneModel;
  readonly pilot: PilotRow; readonly template: PilotTemplate;
  readonly durationMs: number;
  readonly cost: number;
}

/** Vérifie une intention d'expédition et calcule ce qu'elle coûtera et durera. */
export function planDispatch(db: Database, company: Company, cardId: string, planeId: string, pilotId: string, now: number): { ok: true; plan: DispatchPlan } | { ok: false; error: DispatchError } {
  const card = findCard(cardId);
  if (!card) return { ok: false, error: 'card_unknown' };
  if (card.kind !== 'contract') return { ok: false, error: 'card_not_contract' };
  // La ligne régulière n'est jamais en main : elle est toujours là.
  const inHand = card.standing || db.prepare('SELECT 1 FROM company_hand WHERE company_id = ? AND card = ?').get(company.id, cardId);
  if (!inHand) return { ok: false, error: 'card_unknown' };
  // Un imprévu en main, c'est une vache sur la piste : rien ne décolle tant qu'on n'a pas tranché.
  if (pendingEvent(db, company)) return { ok: false, error: 'event_pending' };
  const destination = findDestination(card.destination);
  if (!destination) return { ok: false, error: 'card_unknown' };
  if (!unlockedRegions(db, company.id).includes(destination.region)) return { ok: false, error: 'region_locked' };
  const plane = db.prepare('SELECT id, model, wear FROM company_planes WHERE id = ? AND company_id = ?').get(planeId, company.id) as PlaneRow | undefined;
  const model = plane ? findPlane(plane.model) : undefined;
  if (!plane || !model) return { ok: false, error: 'plane_unknown' };
  const pilot = db.prepare('SELECT * FROM company_pilots WHERE id = ? AND company_id = ?').get(pilotId, company.id) as PilotRow | undefined;
  const template = pilot ? findPilot(pilot.pilot) : undefined;
  if (!pilot || !template) return { ok: false, error: 'pilot_unknown' };

  const busy = db.prepare('SELECT plane_id, pilot_id FROM flights WHERE company_id = ? AND departed_at + 2 * duration_ms > ?').all(company.id, now) as { plane_id: string; pilot_id: string }[];
  if (busy.some((b) => b.plane_id === plane.id)) return { ok: false, error: 'plane_busy' };
  if (busy.some((b) => b.pilot_id === pilot.id)) return { ok: false, error: 'pilot_busy' };
  if (currentFatigue(pilot, now) >= FATIGUE_LIMIT) return { ok: false, error: 'pilot_tired' };
  if (model.capacity < card.bags) return { ok: false, error: 'plane_too_small' };
  if (!canLand(model, destination)) {
    if (destination.runway === 'water') return { ok: false, error: 'needs_seaplane' };
    if (model.runway === 'water') return { ok: false, error: 'needs_water' };
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

  // Un hangar équipé entretient mieux : l'établi divise l'entretien par 1,25, l'atelier par 1,5.
  const maintenance = WORLD.zones.find((z) => z.id === 'hangar')!.levels.find((l) => l.level === zone('hangar'))?.maintenance ?? 1;
  const cost = Math.round(template.wage + (model.upkeep * traitFactor(template, 'fuel')) / maintenance);
  // La ligne régulière ne coûte rien au départ : la poste avance le salaire et le
  // carburant, et les retient sur le tarif à l'arrivée. C'est ce qui garantit qu'une
  // compagnie ne peut jamais rester clouée au sol, même la caisse vide.
  if (!card.standing && company.francs < cost) return { ok: false, error: 'not_enough_francs' };
  const durationMs = flightDurationMs(destination, model, traitFactor(template, 'speed'));
  return { ok: true, plan: { card, destination, plane, model, pilot, template, durationMs, cost } };
}

/** Expédie : débite le coût, fatigue le pilote, tire l'aléa du vol, enregistre le vol. */
export function dispatch(db: Database, company: Company, playerId: string, plan: DispatchPlan, now: number): FlightRow {
  return transaction(db, () => {
    const row = db.prepare('SELECT flights_count FROM companies WHERE id = ?').get(company.id) as { flights_count: number };
    const rng = makeRng(deriveSeed(playerId, row.flights_count, 'flight'));
    // La nuit aux lanternes : le risque d'incident double, sauf pour un pilote Nocturne (÷ 4).
    const hour = new Date(now).getUTCHours();
    const nightFlight = plan.destination.hazard === 'night' && (hour >= 20 || hour < 6);
    const nightFactor = nightFlight ? 2 * traitFactor(plan.template, 'nightRisk') : 1;
    // Le moral compte : un pilote heureux casse moins (20 → risque × 0,75), un pilote abattu plus (0 → × 1,25).
    const moraleFactor = 1 + (10 - plan.pilot.morale) / 40;
    const baseReliability = Math.min(1, plan.model.reliability * traitFactor(plan.template, 'reliability') * (1 - plan.plane.wear / 400));
    const reliability = 1 - Math.min(1, (1 - baseReliability) * nightFactor * moraleFactor);
    const incident = rng() > reliability;
    let durationMs = plan.durationMs;
    if (plan.destination.hazard === 'fog' && rng() < 0.5 * traitFactor(plan.template, 'fogRisk')) durationMs += FOG_DELAY_MS;
    if (plan.destination.hazard === 'seawind' && rng() < 0.4 * traitFactor(plan.template, 'fogRisk')) durationMs += SEAWIND_DELAY_MS;
    if (incident) durationMs = Math.round(durationMs * INCIDENT_DELAY_FACTOR);
    const wear = Math.round((FLIGHT_WEAR + (incident ? INCIDENT_WEAR : 0)) * traitFactor(plan.template, 'wear'));
    const fatigueGain = Math.max(1, Math.round((plan.destination.distance >= 3 ? 2 : 1) * traitFactor(plan.template, 'fatigue')));

    // Ligne régulière : rien au départ, le tarif moins l'avance à l'arrivée — et jamais moins que zéro.
    const advanced = plan.card.standing === true;
    const debit = advanced ? 0 : plan.cost;
    const reward = advanced ? Math.max(0, plan.card.reward - plan.cost) : plan.card.reward;
    const id = newId();
    db.prepare(`INSERT INTO flights (id, company_id, card, plane_id, pilot_id, destination, departed_at, duration_ms, deadline_at, reward, bonus, incident)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, company.id, plan.card.id, plan.plane.id, plan.pilot.id, plan.destination.id, now, durationMs,
        now + plan.card.softDeadlineHours * 3_600_000, reward, plan.card.bonus, incident ? 1 : 0);
    db.prepare('DELETE FROM company_hand WHERE company_id = ? AND card = ?').run(company.id, plan.card.id);
    db.prepare('UPDATE companies SET francs = francs - ?, flights_count = flights_count + 1 WHERE id = ?').run(debit, company.id);
    db.prepare('UPDATE company_planes SET wear = MIN(100, wear + ?) WHERE id = ?').run(wear, plan.plane.id);
    db.prepare('UPDATE company_pilots SET fatigue = ?, fatigue_at = ? WHERE id = ?')
      .run(Math.min(FATIGUE_MAX, currentFatigue(plan.pilot, now) + fatigueGain), now, plan.pilot.id);
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
      if (e.wear) { db.prepare('UPDATE company_planes SET wear = MIN(100, wear + ?) WHERE id = (SELECT id FROM company_planes WHERE company_id = ? ORDER BY wear LIMIT 1)').run(e.wear, company.id); effects['wear'] = e.wear; }
      if (e.delayHours) {
        // Le retard s'applique au vol en cours le plus proche de l'arrivée, s'il y en a un.
        db.prepare('UPDATE flights SET duration_ms = duration_ms + ? WHERE id = (SELECT id FROM flights WHERE company_id = ? AND settled_at IS NULL AND departed_at + duration_ms > ? ORDER BY departed_at + duration_ms LIMIT 1)')
          .run(e.delayHours * 3_600_000, company.id, now);
        effects['delayHours'] = e.delayHours;
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
        db.prepare('INSERT INTO company_planes (id, company_id, model, wear, acquired_at) VALUES (?, ?, ?, 10, ?)').run(newId(), company.id, model.id, now);
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

export type BuildError = 'zone_unknown' | 'zone_max' | 'decoration_unknown' | 'decoration_owned' | 'not_enough_francs';

/** Monte une zone d'un niveau, si la caisse le permet. */
export function upgradeZone(db: Database, company: Company, zoneId: string, now: number): { ok: true; level: number } | { ok: false; error: BuildError } {
  const zone = WORLD.zones.find((z) => z.id === zoneId);
  if (!zone) return { ok: false, error: 'zone_unknown' };
  return transaction(db, () => {
    const current = (db.prepare('SELECT level FROM company_zones WHERE company_id = ? AND zone = ?').get(company.id, zoneId) as { level: number } | undefined)?.level ?? 1;
    const next = zone.levels.find((l) => l.level === current + 1);
    if (!next) return { ok: false as const, error: 'zone_max' as const };
    const francs = (db.prepare('SELECT francs FROM companies WHERE id = ?').get(company.id) as { francs: number }).francs;
    if (francs < next.cost) return { ok: false as const, error: 'not_enough_francs' as const };
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
