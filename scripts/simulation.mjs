#!/usr/bin/env node
/**
 * La simulation : des joueurs fictifs jouent les vraies règles du serveur, pour que
 * les chiffres de l'économie (Conception, § 4.5) se rejouent.
 *
 *   npm run simulation -- --profil une-heure --scenario neuf --joueurs 60 --jours 45
 *   npm run simulation -- --liste            (les profils, scénarios et politiques)
 *
 * Le tableau du § 4.4 (le hangar attend son pilote) a été mesuré avant que chaque
 * contrat paie un quart de plus, avec l'outil de l'étude du 31 octobre 2026 dont
 * celui-ci est tiré : il ne le rejoue pas au chiffre près.
 *
 * Chaque joueur a sa base SQLite en mémoire et passe par le code du serveur
 * (packages/server/src) : le tirage du jour, les vols, les imprévus, les achats, les
 * chantiers, les routes. Rien n'est recopié : si une règle change, les chiffres
 * changent avec elle. Le hasard est celui du jeu, tiré d'une graine par joueur et
 * par jour : deux lancements avec les mêmes options donnent le même résultat, au
 * chiffre près ; `--graine` change la série de joueurs.
 *
 * LE ROBOT EST UN PLAFOND. Il joue sans se tromper : il prend à chaque passage le
 * meilleur vol pour chaque équipage libre, ouvre les routes dès que la page et les
 * cachets y sont (sauf dans une flotte figée), bâtit la deuxième place du hangar dès
 * qu'il a 700 F, achète tout avion qu'il peut payer et faire décoller, embauche chaque
 * pilote qui passe, et, à un imprévu, choisit ce qui garde la piste ouverte. Un vrai
 * joueur gagne moins et arrive plus tard ; seuls les écarts entre deux mesures faites
 * avec les mêmes options se transposent.
 *
 * Les profils (heures de Paris, heure d'été comprise ; l'hiver du jeu commence le
 * 21 décembre ; entre parenthèses, leur nom dans l'étude du 31 octobre 2026) :
 *   deux-passages-courts  8 h et 18 h, cinq minutes chacun (P_CONCEPTION)
 *   deux-passages         8 h et 18 h, dix minutes chacun (P_REGIS)
 *   un-passage            18 h, vingt minutes (P_UNE_VISITE)
 *   une-heure             18 h, une heure (P_UNE_HEURE)
 *   realiste              9 h dix minutes, manqué deux jours sur trois, et 18 h vingt
 *                         minutes ; la ligne régulière une fois par passage, le vol le
 *                         plus proche d'abord (P_REALISTE)
 * Un passage rejoue le jeu toutes les deux minutes, comme un joueur qui garde l'écran
 * ouvert.
 *
 * Les scénarios : `neuf` (une compagnie fondée au premier jour) ; `deux-grives-un-pilote`
 * (deux Grives, un seul pilote, la vallée livrée, la Côte et la Forêt ouvertes, la main
 * vide : la compagnie de Régis au 31 octobre, approchée) ; et des flottes figées, sans
 * achat, ni embauche, ni chantier, ni route nouvelle, pour lire ce que rapporte une
 * flotte donnée sur les routes données (voir `--liste`).
 *
 * Les politiques : `glouton` (ci-dessus, par défaut) ; `vise-le-pic` (ouvre la Forêt
 * d'abord, garde en main la carte du Pic tant qu'elle est trop chère, et bâtit l'atelier
 * quand il faut une place de plus) ; `vise-le-pic-sans-grive` (la même, sans deuxième
 * Grive).
 *
 * Le résultat est un JSON en français, sur la sortie standard. « Médiane » compte tous
 * les joueurs : celui qui n'atteint pas un jalon dans la durée compte parmi les plus
 * lents (`null` si plus de la moitié ne l'atteint pas). Les jours se comptent depuis 0 :
 * « jour 3 » est le quatrième jour.
 *
 * Le champ `controle` vérifie que l'outil rattrape le tirage comme le serveur (place en
 * main, veille et jour) : s'il trouve un écart, l'outil sort en erreur. Il ne voit pas
 * un changement de règle dans le tirage lui-même, que l'outil appelle tel quel.
 */
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { openDatabase } from '../packages/server/src/db/database.ts';
import { foundCompany, findCompanyByPlayer, awardStamp } from '../packages/server/src/db/repos/companies.ts';
import {
  settle, planDispatch, dispatch, playCard, discardCard, pendingEvent, listHand, upgradeZone, openRegion,
  companyFleet, companyLuck, unlockedRegions, canCarry, drawCards, HAND_SIZE, DAILY_DRAW,
} from '../packages/server/src/game/sim.ts';
import { WORLD, findCard, regionDestinations, findDestination, findPlane } from '../packages/server/src/world/index.ts';
import { makeRng, deriveSeed } from '../packages/server/src/sim/rng.ts';
import { gameDayIndex } from '../packages/server/src/sim/day.ts';
import { seasonOf } from '../packages/server/src/sim/saison.ts';

const H = 3_600_000, MIN = 60_000, DAY = 24 * H;

/** Une option refusée : l'outil le dit en une ligne, sans pile d'appels. */
class OptionInvalide extends Error {}

const PARIS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
});
/** L'avance de Paris sur UTC à cet instant : une heure l'hiver, deux l'été. */
function avanceDeParis(t) {
  const p = Object.fromEntries(PARIS.formatToParts(new Date(t)).map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / MIN) * MIN;
}
/** L'instant où il est `heure` h `minutes` à Paris, le jour qui commence à `minuitUtc`. */
export function heureDeParis(minuitUtc, heure, minutes = 0) {
  const lue = minuitUtc + heure * H + minutes * MIN; // l'heure de Paris, lue comme une heure UTC
  return lue - avanceDeParis(lue - avanceDeParis(lue));
}

/** Les visites : [heure de Paris, minutes, probabilité d'être manquée]. */
export const PROFILS = {
  'deux-passages-courts': { nom: '8 h et 18 h, cinq minutes chacun', visites: [[8, 5], [18, 5]] },
  'deux-passages': { nom: '8 h et 18 h, dix minutes chacun', visites: [[8, 10], [18, 10]] },
  'un-passage': { nom: '18 h, vingt minutes', visites: [[18, 20]] },
  'une-heure': { nom: '18 h, une heure', visites: [[18, 60]] },
  realiste: {
    nom: '9 h dix minutes (manqué deux jours sur trois), 18 h vingt minutes ; ligne régulière une fois par passage, vol le plus proche d\'abord',
    visites: [[9, 10, 0.67], [18, 20, 0]],
    jeu: { ligne: 'une-fois', choix: 'plus-proche' },
  },
};

export const POLITIQUES = {
  glouton: { nom: 'achète tout avion payable, embauche chaque pilote', viser: null, grive: true },
  'vise-le-pic': { nom: 'ouvre la Forêt d\'abord, garde la carte du Pic et bâtit l\'atelier pour lui', viser: 'pic', grive: true, routes: ['cuivre'] },
  'vise-le-pic-sans-grive': { nom: 'ouvre la Forêt d\'abord, garde la carte du Pic, ne prend pas de deuxième Grive', viser: 'pic', grive: false, routes: ['cuivre'] },
};

const ROUTES_DE_BASE = ['s-premier-vol', 's-vallee', 's-route-saline', 's-route-cuivre'];
/**
 * Une flotte figée : la vallée livrée, la Côte et la Forêt ouvertes (plus les routes du scénario),
 * ni achat, ni embauche, ni chantier, ni route nouvelle : ce qu'elle rapporte ne doit qu'à elle.
 */
const figee = (nom, avions, pilotes, zones, routes = []) => ({ nom, avions, pilotes, zones, routes, figee: true });
export const SCENARIOS = {
  neuf: { nom: 'compagnie neuve : une Grive, Prosper, 300 F' },
  'deux-grives-un-pilote': {
    nom: 'deux Grives, un pilote, hangar à deux places, 289 F, la vallée livrée, la Côte et la Forêt ouvertes, la main vide',
    avions: ['grive', 'grive'], pilotes: 1, zones: { hangar: 2 }, francs: 289, cachets: 9,
    pages: ['s-histoire', 's-automne', 's-port-sel', 's-les-oeillets', 's-les-charbonnieres'], moralAffinite: [20, 92],
  },
  'grive-seule': figee('flotte figée : une Grive, un pilote', ['grive'], 1, {}),
  'grive-pic': figee('flotte figée : une Grive et un Pic, un pilote', ['grive', 'pic'], 1, { hangar: 2 }),
  'grive-pic-deux-pilotes': figee('flotte figée : une Grive et un Pic, deux pilotes', ['grive', 'pic'], 2, { hangar: 2 }),
  'deux-grives-deux-pilotes': figee('flotte figée : deux Grives, deux pilotes', ['grive', 'grive'], 2, { hangar: 2 }),
  'grive-pic-sterne': figee('flotte figée : une Grive, un Pic et une Sterne, trois pilotes', ['grive', 'pic', 'sterne'], 3, { hangar: 2, ponton: 2 }),
  'archipel-goeland': figee('flotte figée : Grive, Pic, Sterne et Goéland, quatre pilotes, la Côte livrée et l\'Archipel ouvert',
    ['grive', 'pic', 'sterne', 'goeland'], 4, { hangar: 2, ponton: 3 }, ['saline-livree', 'archipel']),
};

const RUNWAY_ORDER = { clearing: 0, short: 1, medium: 2, long: 3, water: 4 };
const zoneDef = (zone, level) => WORLD.zones.find((z) => z.id === zone).levels.find((l) => l.level === level);
const zoneCost = (zone, level) => zoneDef(zone, level)?.cost ?? Infinity;
const STANDING = WORLD.cards.filter((c) => c.kind === 'contract' && c.standing).map((c) => c.id);
const ROUTE_ORDER = [...WORLD.regions].filter((r) => r.route).sort((a, b) => a.route.cost - b.route.cost).map((r) => r.id);
const MODEL_NAME = (id) => findPlane(id).name.fr.split(' ')[0];

/** La flotte, en mots : « 2 Grive + Pic, 2 pilotes ». */
function fleetKey(models, pilots) {
  const n = {};
  for (const m of models) n[MODEL_NAME(m)] = (n[MODEL_NAME(m)] ?? 0) + 1;
  const planes = Object.entries(n).sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([m, k]) => (k > 1 ? `${k} ${m}s` : m)).join(' + ');
  return `${planes}, ${pilots} pilote${pilots > 1 ? 's' : ''}`;
}

function setUp(db, id, scen, t0) {
  if (!scen.avions) return;
  const models = db.prepare('SELECT id, model FROM company_planes WHERE company_id = ?').all(id);
  for (const [k, m] of scen.avions.slice(models.length).entries()) {
    db.prepare('INSERT INTO company_planes (id, company_id, model, wear, wear_at, acquired_at) VALUES (?, ?, ?, 0, ?, ?)').run(`avion-${k + 2}-${m}`, id, m, t0, t0);
  }
  const hired = db.prepare('SELECT COUNT(*) AS n FROM company_pilots WHERE company_id = ?').get(id).n;
  for (const p of WORLD.pilots.slice(hired, scen.pilotes)) {
    db.prepare('INSERT INTO company_pilots (id, company_id, pilot, hired_at) VALUES (?, ?, ?, ?)').run(`pilote-${p.id}`, id, p.id, t0);
  }
  for (const [zone, level] of Object.entries(scen.zones ?? {})) db.prepare('UPDATE company_zones SET level = ? WHERE company_id = ? AND zone = ?').run(level, id, zone);
  const regions = ['saline', 'cuivre', ...((scen.routes ?? []).includes('archipel') ? ['archipel'] : [])];
  for (const r of regions) db.prepare('INSERT OR IGNORE INTO company_regions (company_id, region, opened_at) VALUES (?, ?, ?)').run(id, r, t0);
  const pages = [...ROUTES_DE_BASE, ...regionDestinations('brume').map((d) => `s-${d.id}`), ...(scen.pages ?? [])];
  if ((scen.routes ?? []).includes('saline-livree')) pages.push(...regionDestinations('saline').map((d) => `s-${d.id}`), 's-cote', 's-hydravion');
  if ((scen.routes ?? []).includes('archipel')) pages.push('s-route-archipel');
  for (const s of pages) awardStamp(db, id, s, t0);
  db.prepare('UPDATE companies SET francs = ?, stamps = COALESCE(?, stamps), flights_count = ? WHERE id = ?')
    .run(scen.francs ?? WORLD.start.francs, scen.cachets ?? null, scen.moralAffinite?.[1] ?? 0, id);
  if (scen.moralAffinite) db.prepare('UPDATE company_pilots SET morale = ?, affinity = ?, scenes_seen = 3 WHERE company_id = ?').run(...scen.moralAffinite, id);
}

/** Joue un joueur fictif ; rend ses relevés. */
function playOne(n, o) {
  const db = openDatabase({ path: ':memory:' });
  const playerId = `${o.graine}-${n}`;
  const t0 = o.debut;
  db.prepare('INSERT INTO players (id, email, nickname, nickname_key, locale, age_confirmed, terms_version, terms_accepted_at, created_at, last_seen_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(playerId, `${playerId}@example.test`, playerId, playerId, 'fr', 1, 'x', t0, t0, t0);
  foundCompany(db, playerId, 'Simulation', t0);
  const co = () => findCompanyByPlayer(db, playerId);
  const id = co().id;
  setUp(db, id, o.scen, t0);
  const frozen = o.scen.figee === true;
  const pol = o.pol;
  const r = {
    jalons: { deuxiemeAvion: null, deuxiemePilote: null, deuxEquipages: null, hangar2: null, atelier: null, pic: null, valleeLivree: null, routeCote: null, routeForet: null },
    idlePlaneDays: 0, contractsDrawn: 0, lostToFullHand: 0, lostPilotCards: 0, drawMismatch: 0,
    earned: 0, events: 0, eventsWaited: 0, eventFrancs: 0, visits: 0, visitsNoDispatch: 0,
    wealthAt: {}, byFleet: {},
  };
  const zoneLevel = (z) => db.prepare('SELECT level FROM company_zones WHERE company_id = ? AND zone = ?').get(id, z).level;
  const count = (t) => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE company_id = ?`).get(id).n);
  const models = () => db.prepare('SELECT model FROM company_planes WHERE company_id = ?').all(id).map((x) => x.model);
  const hasStamp = (s) => !!db.prepare('SELECT 1 FROM company_stamps WHERE company_id = ? AND stamp = ?').get(id, s);
  const arrivedSum = () => Number(db.prepare("SELECT COALESCE(SUM(francs),0) AS s FROM ledger WHERE company_id = ? AND kind = 'flight.arrived'").get(id).s);
  const lastDrawDay = () => Number(db.prepare('SELECT last_draw_day AS d FROM companies WHERE id = ?').get(id).d);
  // Le patrimoine : la caisse, plus ce qui a été bâti et acheté. Sa variation d'un jour à l'autre est le gain net du jour.
  const wealth = () => co().francs + Number(db.prepare("SELECT COALESCE(-SUM(francs),0) AS s FROM ledger WHERE company_id = ? AND kind IN ('purchase.plane','build.zone','build.decoration')").get(id).s);
  const skipRng = makeRng(deriveSeed(playerId, 0, 'simulation:absences'));
  const planned = new Map();

  // Le tirage, rejoué avec la même graine que settle() : ce qui n'a pas trouvé de place en main.
  // Il sert aussi de contrôle : s'il ne retrouve pas la main du serveur, l'outil ne rattrape plus
  // les jours comme lui. (Il appelle le même drawCards : un changement du tirage, il ne le voit pas.)
  function replayDraw(before, lastDay, now) {
    const today = gameDayIndex(now);
    if (lastDay >= today) return;
    const fleet = companyFleet(db, id);
    let hand = before.filter((c) => { const k = findCard(c); return !(k?.kind === 'contract' && !canCarry(k, fleet)); });
    const inFlight = db.prepare('SELECT card FROM flights WHERE company_id = ? AND settled_at IS NULL').all(id).map((x) => x.card);
    const album = db.prepare('SELECT stamp FROM company_stamps WHERE company_id = ?').all(id).map((x) => x.stamp);
    const luck = companyLuck(db, id), regions = unlockedRegions(db, id), season = seasonOf(now).season;
    const first = lastDay < 0 ? today : Math.max(lastDay + 1, today - 1);
    const kept = [];
    for (let d = first; d <= today; d += 1) {
      const room = Math.max(0, HAND_SIZE - hand.length);
      const drawn = drawCards(makeRng(deriveSeed(playerId, d, 'cards')), [...hand, ...inFlight], luck, DAILY_DRAW, regions, album, season, fleet);
      for (const c of drawn.slice(room)) {
        r.lostToFullHand += 1;
        if (findCard(c)?.offer?.type === 'pilot') r.lostPilotCards += 1;
      }
      for (const c of drawn.slice(0, room)) if (findCard(c)?.kind === 'contract') r.contractsDrawn += 1;
      hand = [...hand, ...drawn.slice(0, room)]; kept.push(...drawn.slice(0, room));
    }
    const actual = listHand(db, id).map((h) => h.card).filter((c) => !before.includes(c));
    if (actual.length !== kept.length || actual.some((c) => !kept.includes(c))) r.drawMismatch += 1;
  }

  // Les vols possibles (simples ou en convoi), et ce que chacun rapporte net.
  function candidates(now) {
    const company = co();
    const planes = db.prepare('SELECT id FROM company_planes WHERE company_id = ? ORDER BY rowid').all(id);
    const pilots = db.prepare('SELECT id FROM company_pilots WHERE company_id = ? ORDER BY rowid').all(id);
    const hand = listHand(db, id).map((h) => h.card).filter((c) => findCard(c)?.kind === 'contract');
    const out = [];
    for (const card of [...hand, ...STANDING]) {
      const k = findCard(card);
      for (const pl of planes) for (const pi of pilots) {
        const p = planDispatch(db, company, card, pl.id, pi.id, now);
        if (p.ok) {
          out.push({ standing: !!k.standing, net: k.standing ? Math.max(0, k.reward - p.plan.cost) : k.reward - p.plan.cost, crews: 1, plan: p.plan, dist: p.plan.destination.distance, age: hand.indexOf(card) });
        } else if (!k.standing && k.heavy && p.error === 'plane_too_small') {
          for (const pl2 of planes) for (const pi2 of pilots) {
            if (pl2.id === pl.id || pi2.id === pi.id) continue;
            const q = planDispatch(db, company, card, pl.id, pi.id, now, { plane: pl2.id, pilot: pi2.id });
            if (q.ok) out.push({ standing: false, net: k.reward - q.plan.cost, crews: 2, plan: q.plan, dist: q.plan.destination.distance, age: hand.indexOf(card) });
          }
        }
      }
    }
    return out;
  }
  function pickBest(cands) {
    const contracts = cands.filter((c) => !c.standing);
    if (contracts.length > 0) {
      return [...contracts].sort((a, b) => {
        if (o.jeu.choix === 'plus-proche') return a.dist - b.dist || b.net - a.net;
        return b.net / b.crews - a.net / a.crews; // le meilleur gain net par équipage occupé
      })[0];
    }
    return cands.filter((c) => c.standing).sort((a, b) => b.net - a.net)[0] ?? null;
  }
  // Une place pour un avion de plus : le chantier à bâtir, ou null s'il y a déjà la place.
  function roomFor(model) {
    const zone = findPlane(model).runway === 'water' ? 'ponton' : 'hangar';
    const lvl = zoneLevel(zone);
    const places = zone === 'ponton' ? (zoneDef(zone, lvl).seaplanes ?? 0) : zoneDef(zone, lvl).planes;
    const owned = models().filter((m) => (findPlane(m).runway === 'water') === (zone === 'ponton')).length;
    return owned < places ? null : { zone, level: lvl + 1, cost: zoneCost(zone, lvl + 1) };
  }

  const markers = [7, 14, 21, 30, 45, 60];
  let morning = wealth();
  for (let d = 0; d < o.jours; d += 1) {
    const fleetToday = fleetKey(models(), count('company_pilots'));
    for (const [vi, [hour, minutes, pSkip = 0]] of o.profil.visites.entries()) {
      const roll = skipRng();
      // La toute première visite est toujours faite.
      if (pSkip > 0 && !(d === 0 && vi === 0) && roll < pSkip) continue;
      r.visits += 1;
      let dispatched = 0, standingThisVisit = 0;
      const arrival = heureDeParis(t0 + d * DAY, hour);
      for (let m = 0; m <= minutes; m += 2) {
        const now = arrival + m * MIN;
        const beforeHand = listHand(db, id).map((h) => h.card);
        const lastDay = lastDrawDay();
        const before = arrivedSum();
        settle(db, co(), playerId, now);
        r.earned += arrivedSum() - before;
        replayDraw(beforeHand, lastDay, now);
        // 1. L'imprévu : ce qui garde la piste ouverte, puis le moins cher, puis le moins d'usure, puis le moral.
        for (let g = 0; g < 4; g += 1) {
          const ev = pendingEvent(db, co()); if (!ev) break;
          const fr = (c) => c.effects.francs ?? 0;
          const choices = [...findCard(ev).choices].sort((a, b) => ((a.effects.waitHours ? 1 : 0) - (b.effects.waitHours ? 1 : 0))
            || (fr(b) - fr(a)) || ((a.effects.wear ?? 0) - (b.effects.wear ?? 0)) || ((b.effects.morale ?? 0) - (a.effects.morale ?? 0)));
          const played = choices.find((c) => playCard(db, co(), ev, c.id, now).ok);
          if (!played) break;
          r.events += 1; r.eventFrancs += fr(played); if (played.effects.waitHours) r.eventsWaited += 1;
        }
        // 2. Les occasions.
        for (const h of listHand(db, id)) {
          const c = findCard(h.card);
          if (!c || c.kind !== 'opportunity') continue;
          if (c.offer.type === 'fete' || (frozen && (c.offer.type === 'pilot' || c.offer.type === 'plane'))) { discardCard(db, co(), h.card); continue; }
          if (c.offer.type === 'plane') {
            const model = findPlane(c.offer.model);
            const home = zoneDef('runway', zoneLevel('runway')).runway;
            const flyable = model.runway === 'water' || RUNWAY_ORDER[model.runway] <= RUNWAY_ORDER[home];
            const target = pol.viser === model.id;
            if (!flyable || (model.id === 'grive' && !pol.grive)) { discardCard(db, co(), h.card); continue; }
            if (target) {
              // La cible : on bâtit la place qui manque quand la caisse tient le chantier et l'avion, sinon on garde la carte.
              const room = roomFor(model.id);
              if (room && co().francs >= room.cost + c.offer.price) upgradeZone(db, co(), room.zone, now, room.level);
              playCard(db, co(), h.card, undefined, now);
              continue;
            }
            if (!playCard(db, co(), h.card, undefined, now).ok) discardCard(db, co(), h.card);
            continue;
          }
          playCard(db, co(), h.card, undefined, now);
        }
        // 3. La deuxième place du hangar dès 700 F, si la place n'est pas gardée pour la cible.
        if (!frozen && zoneLevel('hangar') === 1 && co().francs >= zoneCost('hangar', 2)) upgradeZone(db, co(), 'hangar', now, 2);
        // 3 bis. Les routes, la moins chère d'abord, dès que la page et les cachets y sont ; la route
        // préférée de la politique passe avant, et les cachets l'attendent. Une flotte figée garde les siennes.
        if (!frozen) for (const reg of [...(pol.routes ?? []), ...ROUTE_ORDER.filter((x) => !(pol.routes ?? []).includes(x))]) {
          openRegion(db, co(), reg, now);
          if ((pol.routes ?? []).includes(reg) && !unlockedRegions(db, id).includes(reg)) break;
        }
        // 4. Les vols.
        for (let g = 0; g < 8; g += 1) {
          let cands = candidates(now);
          if (o.jeu.ligne === 'une-fois' && standingThisVisit >= 1) cands = cands.filter((c) => !c.standing);
          const best = pickBest(cands);
          if (!best) break;
          const row = dispatch(db, co(), playerId, best.plan, now);
          planned.set(row.id, { model: best.plan.model.id, cost: best.plan.cost, crews: best.crews });
          dispatched += 1; if (best.standing) standingThisVisit += 1;
        }
      }
      if (dispatched === 0) r.visitsNoDispatch += 1;
    }
    // Fin de journée : le gain net du jour, rangé par flotte du matin ; les jalons.
    const evening = wealth();
    (r.byFleet[fleetToday] ??= { jours: 0, net: 0 }); r.byFleet[fleetToday].jours += 1; r.byFleet[fleetToday].net += evening - morning;
    morning = evening;
    const planes = count('company_planes'), pilots = count('company_pilots'), j = r.jalons;
    if (planes >= 2) j.deuxiemeAvion ??= d;
    if (pilots >= 2) j.deuxiemePilote ??= d;
    if (planes >= 2 && pilots >= 2) j.deuxEquipages ??= d;
    if (planes > pilots) r.idlePlaneDays += 1;
    if (zoneLevel('hangar') >= 2) j.hangar2 ??= d;
    if (zoneLevel('hangar') >= 3) j.atelier ??= d;
    if (models().includes('pic')) j.pic ??= d;
    if (hasStamp('s-vallee')) j.valleeLivree ??= d;
    if (unlockedRegions(db, id).includes('saline')) j.routeCote ??= d;
    if (unlockedRegions(db, id).includes('cuivre')) j.routeForet ??= d;
    if (markers.includes(d + 1)) r.wealthAt[d + 1] = evening;
  }
  // Les vols, relus en base : ce que rapporte un contrat, par région et par avion de tête.
  const flights = db.prepare('SELECT * FROM flights WHERE company_id = ? AND settled_at IS NOT NULL').all(id);
  r.contracts = []; r.standing = { n: 0, net: 0 }; r.departures = 0;
  for (const f of flights) {
    if (f.convoy !== null && f.convoy !== f.id) continue;
    const k = findCard(f.card), p = planned.get(f.id);
    if (!p) continue;
    if (k.standing) { r.standing.n += 1; r.standing.net += f.reward; continue; }
    r.departures += p.cost;
    const onTime = f.departed_at + f.duration_ms <= f.deadline_at;
    r.contracts.push({ region: findDestination(f.destination).region, model: p.model, crews: p.crews, net: f.reward + (onTime ? f.bonus : 0) - p.cost, roundTripMin: (2 * f.duration_ms) / MIN });
  }
  db.close();
  return r;
}

/** Fait jouer `joueurs` joueurs fictifs et rend les mesures, en français. */
export function simuler(options = {}) {
  const profil = PROFILS[options.profil ?? 'une-heure'];
  const scen = SCENARIOS[options.scenario ?? 'neuf'];
  const pol = POLITIQUES[options.politique ?? 'glouton'];
  if (!profil) throw new OptionInvalide(`profil inconnu : ${options.profil}`);
  if (!scen) throw new OptionInvalide(`scénario inconnu : ${options.scenario}`);
  if (!pol) throw new OptionInvalide(`politique inconnue : ${options.politique}`);
  const entier = (nom, v, defaut) => {
    const x = v ?? defaut;
    if (!Number.isInteger(x) || x < 1) throw new OptionInvalide(`${nom} : un nombre entier, au moins 1 (reçu : ${v})`);
    return x;
  };
  // Le premier jour, à minuit UTC : les passages se placent ensuite à l'heure de Paris.
  const jour = options.debut ?? '2026-11-02';
  const debut = Date.parse(`${jour}T00:00:00Z`);
  if (!Number.isFinite(debut) || new Date(debut).toISOString().slice(0, 10) !== jour) {
    throw new OptionInvalide(`début : une date AAAA-MM-JJ (reçu : ${options.debut})`);
  }
  const o = {
    profil, scen, pol, jeu: { ligne: 'toujours', choix: 'meilleur', ...(profil.jeu ?? {}) },
    joueurs: entier('joueurs', options.joueurs, 60), jours: entier('jours', options.jours, 45), graine: options.graine ?? 'joueur', debut,
  };
  const runs = Array.from({ length: o.joueurs }, (_, n) => playOne(n, o));
  const N = o.joueurs, D = o.jours;
  const pct = (xs, p) => { const v = xs.map((x) => x ?? Infinity).sort((a, b) => a - b); const x = v[Math.min(v.length - 1, Math.floor(p * v.length))]; return x === Infinity ? null : x; };
  const sum = (f) => runs.reduce((a, r) => a + f(r), 0);
  const perDay = (f, digits = 2) => +(sum(f) / N / D).toFixed(digits);
  const milestone = (k) => {
    const xs = runs.map((r) => r.jalons[k]);
    return { atteint: `${xs.filter((x) => x !== null).length}/${N}`, p10: pct(xs, 0.1), mediane: pct(xs, 0.5), p90: pct(xs, 0.9) };
  };
  const contrats = {};
  for (const c of runs.flatMap((r) => r.contracts)) {
    if (c.crews > 1) continue; // un convoi occupe deux équipages : il est compté à part
    const key = `${c.region} / ${MODEL_NAME(c.model)}`;
    const t = (contrats[key] ??= { n: 0, net: 0, min: 0 }); t.n += 1; t.net += c.net; t.min += c.roundTripMin;
  }
  const convois = runs.flatMap((r) => r.contracts).filter((c) => c.crews > 1);
  const marks = [7, 14, 21, 30, 45, 60].filter((d) => d <= D);
  const byFleet = {};
  for (const r of runs) for (const [k, v] of Object.entries(r.byFleet)) { const t = (byFleet[k] ??= { jours: 0, net: 0 }); t.jours += v.jours; t.net += v.net; }
  return {
    outil: 'scripts/simulation.mjs',
    profil: `${options.profil ?? 'une-heure'} : ${profil.nom}`,
    scenario: `${options.scenario ?? 'neuf'} : ${scen.nom}`,
    politique: `${options.politique ?? 'glouton'} : ${pol.nom}`,
    joueurs: N, jours: D, graine: o.graine, debut: new Date(o.debut).toISOString().slice(0, 10),
    avertissement: 'Le robot joue sans se tromper : ses chiffres sont un plafond, pas ceux d\'un joueur.',
    jalons: Object.fromEntries(Object.keys(runs[0]?.jalons ?? {}).map((k) => [k, milestone(k)])),
    parJour: {
      contratsTires: perDay((r) => r.contractsDrawn),
      recettesDesVols: perDay((r) => r.earned, 1),
      fraisDesContrats: perDay((r) => r.departures, 1),
      imprevusFrancs: perDay((r) => r.eventFrancs, 1),
      // Recettes moins salaires et entretien, carburant compris (la ligne régulière les retient à l'arrivée).
      gainNetDesVols: +((sum((r) => r.earned) - sum((r) => r.departures)) / N / D).toFixed(1),
      imprevus: perDay((r) => r.events),
      attentesChoisies: perDay((r) => r.eventsWaited),
      visitesSansDepart: perDay((r) => r.visitsNoDispatch),
      cartesPerduesMainPleine: perDay((r) => r.lostToFullHand),
    },
    // Par contrat (hors ligne régulière et convois) : le net moyen (récompense, prime si le délai est
    // tenu, moins salaire et entretien), l'aller-retour moyen et le net par heure de vol aller-retour.
    contratsParRegionEtAvion: Object.fromEntries(Object.entries(contrats).sort((a, b) => b[1].n - a[1].n).map(([k, t]) => [k, {
      parJour: +(t.n / N / D).toFixed(2), netMoyen: Math.round(t.net / t.n), allerRetourMin: Math.round(t.min / t.n), netParHeure: Math.round((60 * t.net) / t.min),
    }])),
    convois: { parJour: +(convois.length / N / D).toFixed(2), netMoyen: convois.length ? Math.round(convois.reduce((a, c) => a + c.net, 0) / convois.length) : null },
    ligneReguliere: { parJour: perDay((r) => r.standing.n), netMoyen: sum((r) => r.standing.n) ? Math.round(sum((r) => r.standing.net) / sum((r) => r.standing.n)) : null },
    // Le gain net d'une journée (variation du patrimoine : caisse + achats + chantiers), rangé par flotte du matin.
    gainNetParJourSelonFlotte: Object.fromEntries(Object.entries(byFleet).sort((a, b) => b[1].jours - a[1].jours).map(([k, t]) => [k, { joursObserves: t.jours, gainNetMoyen: Math.round(t.net / t.jours) }])),
    joursAvecAvionSansPilote: +(sum((r) => r.idlePlaneDays) / N).toFixed(1),
    cartesPiloteJeteesMainPleine: +(sum((r) => r.lostPilotCards) / N).toFixed(2),
    patrimoineMedian: Object.fromEntries(marks.map((d) => [`jour${d}`, pct(runs.map((r) => r.wealthAt[d] ?? null), 0.5)])),
    controle: { tiragesRejouesDifferents: sum((r) => r.drawMismatch) },
  };
}

function main() {
  let out;
  try {
    const { values } = parseArgs({
      options: {
        profil: { type: 'string', default: 'une-heure' }, scenario: { type: 'string', default: 'neuf' },
        politique: { type: 'string', default: 'glouton' }, joueurs: { type: 'string', default: '60' },
        jours: { type: 'string', default: '45' }, graine: { type: 'string', default: 'joueur' },
        debut: { type: 'string', default: '2026-11-02' }, liste: { type: 'boolean', default: false },
      },
    });
    if (values.liste) {
      const line = (o) => Object.entries(o).map(([k, v]) => `  ${k.padEnd(26)}${v.nom}`).join('\n');
      process.stdout.write(`Profils :\n${line(PROFILS)}\nScénarios :\n${line(SCENARIOS)}\nPolitiques :\n${line(POLITIQUES)}\n`);
      return;
    }
    const nombre = (v) => (/^\d+$/.test(v) ? Number(v) : v);
    out = simuler({
      profil: values.profil, scenario: values.scenario, politique: values.politique,
      joueurs: nombre(values.joueurs), jours: nombre(values.jours), graine: values.graine, debut: values.debut,
    });
  } catch (e) {
    if (!(e instanceof OptionInvalide) && !String(e?.code).startsWith('ERR_PARSE_ARGS')) throw e;
    process.stderr.write(`${e.message}\n(npm run simulation -- --liste donne les profils, scénarios et politiques.)\n`);
    process.exitCode = 2;
    return;
  }
  process.stdout.write(`${JSON.stringify(out, null, 1)}\n`);
  if (out.controle.tiragesRejouesDifferents > 0) {
    process.stderr.write('Le tirage rejoué ne retrouve pas la main du serveur : l\'outil ne rattrape plus les jours comme lui ; il est à mettre à jour.\n');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
