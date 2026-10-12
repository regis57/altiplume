/**
 * Routes du jeu : la compagnie. Toutes exigent une session.
 *
 * Le navigateur n'envoie que des intentions (« fonde la compagnie sous ce nom ») ;
 * tout ce qui a une valeur — francs, cachets, avions, pilotes — vient du serveur.
 */
import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import { audit } from '../db/repos/audit.ts';
import { awardStamp, findCompanyByPlayer, foundCompany, loadCompanyState, renameCompany, type CompanyState } from '../db/repos/companies.ts';
import { requirePlayer } from '../auth/session.ts';
import { isLocale, type Locale } from '../auth/validation.ts';
import { gameDayIndex } from '../sim/day.ts';
import { deriveSeed } from '../sim/rng.ts';
import { findCard, findPilot, localizeScene } from '../world/index.ts';
import { cleanCompanyName, suggestNames } from '../world/names.ts';
import {
  busyUntil, currentFatigue, discardCard, dispatch, fatiguePoints, listFlights, listHand, listLedger, openRegion, pendingEvent, placeDecoration, planDispatch, playCard, restedAt, settle, unlockedRegions, upgradeZone, type News,
} from './sim.ts';
import type { Database } from '../db/database.ts';

const namesSchema = {
  querystring: {
    type: 'object', additionalProperties: false,
    // Les paramètres d'URL sont des chaînes et on ne convertit pas les types : un chiffre, c'est un motif.
    properties: { locale: { type: 'string', maxLength: 5 }, draw: { type: 'string', pattern: '^[0-9]$' } },
  },
} as const;

const foundSchema = {
  body: { type: 'object', required: ['name'], additionalProperties: false, properties: { name: { type: 'string', maxLength: 80 } } },
} as const;

const sceneSchema = {
  params: { type: 'object', required: ['pilot', 'index'], properties: { pilot: { type: 'string', maxLength: 32 }, index: { type: 'string', pattern: '^[0-9]$' } } },
  // La langue de la page, pas celle de l'inscription : on peut changer de langue après coup.
  querystring: { type: 'object', additionalProperties: false, properties: { locale: { type: 'string', maxLength: 5 } } },
} as const;

const dispatchSchema = {
  body: {
    type: 'object', required: ['card', 'plane', 'pilot'], additionalProperties: false,
    properties: {
      card: { type: 'string', maxLength: 40 }, plane: { type: 'string', maxLength: 40 }, pilot: { type: 'string', maxLength: 40 },
      // Fret lourd : le second équipage du convoi. Les deux, ou aucun.
      wingPlane: { type: 'string', maxLength: 40 }, wingPilot: { type: 'string', maxLength: 40 },
    },
    dependencies: { wingPlane: ['wingPilot'], wingPilot: ['wingPlane'] },
  },
} as const;

const playSchema = {
  params: { type: 'object', required: ['card'], properties: { card: { type: 'string', maxLength: 40 } } },
  body: { type: 'object', additionalProperties: false, properties: { choice: { type: 'string', maxLength: 20 } } },
} as const;

const cardSchema = {
  params: { type: 'object', required: ['card'], properties: { card: { type: 'string', maxLength: 40 } } },
} as const;

/** L'état de la compagnie tel que le client le reçoit, à l'instant `now`. */
function view(db: Database, state: CompanyState, now: number, news: News[] = []) {
  const rows = listFlights(db, state.company.id, now);
  const all = rows.map((f) => {
    const arrivesAt = f.departed_at + f.duration_ms;
    const back = busyUntil(f);
    const status = now >= back ? 'done' : now >= arrivesAt ? 'returning' : 'en_route';
    return {
      id: f.id, card: f.card, destination: f.destination, plane: f.plane_id, pilot: f.pilot_id,
      departedAt: f.departed_at, arrivesAt, busyUntil: back, deadlineAt: f.deadline_at, reward: f.reward, bonus: f.bonus,
      status, progress: Math.min(1, Math.max(0, (now - f.departed_at) / (2 * f.duration_ms))), settled: f.settled_at !== null,
      convoy: f.convoy,
    };
  });
  // Un convoi est un seul vol pour le joueur : la tête porte l'ailier, l'ailier ne s'affiche pas.
  const flights = all.filter((f) => f.convoy === null || f.convoy === f.id).map(({ convoy, ...f }) => {
    const wing = convoy ? all.find((w) => w.convoy === convoy && w.id !== f.id) : undefined;
    return wing ? { ...f, wing: { plane: wing.plane, pilot: wing.pilot } } : f;
  });
  // Mais les deux avions et les deux pilotes sont occupés.
  const busyPlanes = new Map(all.filter((f) => f.status !== 'done').map((f) => [f.plane, f.busyUntil]));
  const busyPilots = new Map(all.filter((f) => f.status !== 'done').map((f) => [f.pilot, f.busyUntil]));
  return {
    name: state.company.name,
    francs: state.company.francs,
    stamps: state.company.stamps,
    foundedAt: state.company.foundedAt,
    now,
    planes: state.planes.map((p) => ({ id: p.id, model: p.model, wear: p.wear, busyUntil: busyPlanes.get(p.id) ?? null })),
    pilots: state.pilots.map((p) => {
      const minutes = currentFatigue({ fatigue: p.fatigue, fatigue_at: p.fatigueAt }, now);
      return {
        id: p.id, pilot: p.pilot, affinity: p.affinity, morale: p.morale, scenesSeen: p.scenesSeen,
        fatigue: fatiguePoints(minutes), restedAt: restedAt(minutes, now), busyUntil: busyPilots.get(p.id) ?? null,
      };
    }),
    zones: state.zones,
    regions: unlockedRegions(db, state.company.id),
    decorations: state.decorations.map((d) => d.decoration),
    album: state.stamps.map((s) => ({ id: s.stamp, earnedAt: s.earnedAt })),
    hand: listHand(db, state.company.id),
    pendingEvent: pendingEvent(db, state.company),
    flights,
    logbook: listLedger(db, state.company.id),
    news,
  };
}

export function registerGameRoutes(app: FastifyInstance, ctx: AppContext): void {
  function localeOf(request: { player: { locale: string } | null }, query?: { locale?: string }): Locale {
    if (isLocale(query?.locale)) return query.locale;
    return request.player && isLocale(request.player.locale) ? request.player.locale : 'fr';
  }

  /** Trois noms proposés ; `draw` permet d'en tirer d'autres. Reproductible pour un joueur et un jour. */
  app.get('/v1/company/names', { schema: namesSchema, preHandler: requirePlayer }, async (request) => {
    const q = request.query as { locale?: string; draw?: string };
    const locale = localeOf(request, q);
    const seed = deriveSeed(request.player!.id, gameDayIndex(ctx.now()), `names:${locale}:${q.draw ?? 0}`);
    return { names: suggestNames(locale, seed, 3) };
  });

  /** Charge la compagnie après avoir rattrapé le temps écoulé. */
  function current(playerId: string, now: number) {
    const before = findCompanyByPlayer(ctx.db, playerId);
    if (!before) return null;
    const news = settle(ctx.db, before, playerId, now);
    const company = findCompanyByPlayer(ctx.db, playerId)!;
    return { company, news };
  }

  app.get('/v1/company', { preHandler: requirePlayer }, async (request, reply) => {
    const now = ctx.now();
    const c = current(request.player!.id, now);
    if (!c) return reply.code(404).send({ error: 'no_company' });
    return view(ctx.db, loadCompanyState(ctx.db, c.company), now, c.news);
  });

  /** Expédier : une carte contrat, un avion, un pilote. Le serveur calcule tout. */
  app.post('/v1/company/flights', {
    schema: dispatchSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const now = ctx.now();
    const playerId = request.player!.id;
    const c = current(playerId, now);
    if (!c) return reply.code(404).send({ error: 'no_company' });
    const body = request.body as { card: string; plane: string; pilot: string; wingPlane?: string; wingPilot?: string };
    const wing = body.wingPlane && body.wingPilot ? { plane: body.wingPlane, pilot: body.wingPilot } : undefined;
    const plan = planDispatch(ctx.db, c.company, body.card, body.plane, body.pilot, now, wing);
    if (!plan.ok) return reply.code(400).send({ error: plan.error });
    const flight = dispatch(ctx.db, c.company, playerId, plan.plan, now);
    audit(ctx.db, 'flight.dispatched', playerId, { destination: flight.destination, ...(plan.plan.wing ? { convoy: true } : {}) }, now);
    const state = loadCompanyState(ctx.db, findCompanyByPlayer(ctx.db, playerId)!);
    return reply.code(201).send({ flight: flight.id, ...view(ctx.db, state, now, c.news) });
  });

  /** Jouer un imprévu (avec un choix) ou saisir une opportunité. */
  app.post('/v1/company/cards/:card/play', {
    schema: playSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const now = ctx.now();
    const playerId = request.player!.id;
    const c = current(playerId, now);
    if (!c) return reply.code(404).send({ error: 'no_company' });
    const { card } = request.params as { card: string };
    const { choice } = request.body as { choice?: string };
    const result = playCard(ctx.db, c.company, card, choice, now);
    if (!result.ok) return reply.code(400).send({ error: result.error });
    audit(ctx.db, 'card.played', playerId, { card }, now);
    const state = loadCompanyState(ctx.db, findCompanyByPlayer(ctx.db, playerId)!);
    return reply.code(200).send({ effects: result.effects, ref: result.ref ?? null, ...view(ctx.db, state, now, c.news) });
  });

  /** Restaurer une zone : la piste, le hangar. */
  app.post('/v1/company/zones/:zone/upgrade', {
    schema: { params: { type: 'object', required: ['zone'], properties: { zone: { type: 'string', maxLength: 20 } } }, body: { type: 'object', additionalProperties: false, properties: {} } },
    preHandler: requirePlayer, config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const now = ctx.now();
    const playerId = request.player!.id;
    const c = current(playerId, now);
    if (!c) return reply.code(404).send({ error: 'no_company' });
    const { zone } = request.params as { zone: string };
    const result = upgradeZone(ctx.db, c.company, zone, now);
    if (!result.ok) return reply.code(result.error === 'zone_unknown' ? 404 : 400).send({ error: result.error });
    audit(ctx.db, 'company.built', playerId, { zone, level: result.level }, now);
    const state = loadCompanyState(ctx.db, findCompanyByPlayer(ctx.db, playerId)!);
    return reply.code(200).send(view(ctx.db, state, now, c.news));
  });

  /** Ouvrir la route d'une région, contre des cachets. */
  app.post('/v1/company/regions/:region/open', {
    schema: { params: { type: 'object', required: ['region'], properties: { region: { type: 'string', maxLength: 20 } } }, body: { type: 'object', additionalProperties: false, properties: {} } },
    preHandler: requirePlayer, config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const now = ctx.now();
    const playerId = request.player!.id;
    const c = current(playerId, now);
    if (!c) return reply.code(404).send({ error: 'no_company' });
    const { region } = request.params as { region: string };
    const result = openRegion(ctx.db, c.company, region, now);
    if (!result.ok) return reply.code(result.error === 'region_unknown' ? 404 : result.error === 'region_open' ? 409 : 400).send({ error: result.error });
    audit(ctx.db, 'route.opened', playerId, { region }, now);
    const state = loadCompanyState(ctx.db, findCompanyByPlayer(ctx.db, playerId)!);
    return reply.code(200).send(view(ctx.db, state, now, c.news));
  });

  /** Poser une décoration. */
  app.post('/v1/company/decorations/:decoration', {
    schema: { params: { type: 'object', required: ['decoration'], properties: { decoration: { type: 'string', maxLength: 20 } } }, body: { type: 'object', additionalProperties: false, properties: {} } },
    preHandler: requirePlayer, config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const now = ctx.now();
    const playerId = request.player!.id;
    const c = current(playerId, now);
    if (!c) return reply.code(404).send({ error: 'no_company' });
    const { decoration } = request.params as { decoration: string };
    const result = placeDecoration(ctx.db, c.company, decoration, now);
    if (!result.ok) return reply.code(result.error === 'decoration_unknown' ? 404 : 400).send({ error: result.error });
    audit(ctx.db, 'company.built', playerId, { decoration }, now);
    const state = loadCompanyState(ctx.db, findCompanyByPlayer(ctx.db, playerId)!);
    return reply.code(200).send(view(ctx.db, state, now, c.news));
  });

  /** Défausser une carte : elle ne reviendra pas aujourd'hui. */
  app.delete('/v1/company/cards/:card', { schema: cardSchema, preHandler: requirePlayer }, async (request, reply) => {
    const company = findCompanyByPlayer(ctx.db, request.player!.id);
    if (!company) return reply.code(404).send({ error: 'no_company' });
    const { card } = request.params as { card: string };
    if (findCard(card)?.kind === 'event') return reply.code(409).send({ error: 'event_must_decide' });
    if (!discardCard(ctx.db, company, card)) return reply.code(404).send({ error: 'card_unknown' });
    return reply.code(204).send();
  });

  /** Fondation : une fois, un nom propre, et tout l'état de départ. */
  app.post('/v1/company', {
    schema: foundSchema, preHandler: requirePlayer,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    const player = request.player!;
    if (findCompanyByPlayer(ctx.db, player.id)) return reply.code(409).send({ error: 'company_exists' });
    const name = cleanCompanyName((request.body as { name: string }).name);
    if (!name) return reply.code(400).send({ error: 'invalid', fields: ['company_name_invalid'] });
    const now = ctx.now();
    const company = foundCompany(ctx.db, player.id, name, now);
    audit(ctx.db, 'company.founded', player.id, {}, now);
    return reply.code(201).send(view(ctx.db, loadCompanyState(ctx.db, company), now, settle(ctx.db, company, player.id, now)));
  });

  app.patch('/v1/company', { schema: foundSchema, preHandler: requirePlayer }, async (request, reply) => {
    const company = findCompanyByPlayer(ctx.db, request.player!.id);
    if (!company) return reply.code(404).send({ error: 'no_company' });
    const name = cleanCompanyName((request.body as { name: string }).name);
    if (!name) return reply.code(400).send({ error: 'invalid', fields: ['company_name_invalid'] });
    renameCompany(ctx.db, company.id, name);
    audit(ctx.db, 'company.renamed', request.player!.id, {}, ctx.now());
    return reply.code(204).send();
  });

  /**
   * Une scène d'histoire, si l'affinité avec ce pilote l'a débloquée. Les scènes
   * ne sont jamais dans le catalogue public : elles se gagnent, vol après vol.
   */
  app.get('/v1/company/pilots/:pilot/story/:index', { schema: sceneSchema, preHandler: requirePlayer }, async (request, reply) => {
    const { pilot: pilotId, index } = request.params as { pilot: string; index: string };
    const company = findCompanyByPlayer(ctx.db, request.player!.id);
    if (!company) return reply.code(404).send({ error: 'no_company' });
    const template = findPilot(pilotId);
    const hired = loadCompanyState(ctx.db, company).pilots.find((p) => p.pilot === pilotId);
    if (!template || !hired) return reply.code(404).send({ error: 'not_found' });
    const i = Number(index);
    const scene = template.story.scenes[i];
    if (!scene) return reply.code(404).send({ error: 'not_found' });
    if (hired.affinity < scene.affinity) return reply.code(403).send({ error: 'scene_locked', affinity: scene.affinity });
    if (hired.scenesSeen <= i) {
      ctx.db.prepare('UPDATE company_pilots SET scenes_seen = ? WHERE id = ?').run(i + 1, hired.id);
      // Première histoire entendue : une page dans l'album.
      if (i === 0) awardStamp(ctx.db, company.id, 's-histoire', ctx.now());
    }
    return localizeScene(template, i, localeOf(request, request.query as { locale?: string }));
  });
}
