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
import { findPilot, localizeScene } from '../world/index.ts';
import { cleanCompanyName, suggestNames } from '../world/names.ts';

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
} as const;

/** L'état de la compagnie tel que le client le reçoit. */
function view(state: CompanyState) {
  return {
    name: state.company.name,
    francs: state.company.francs,
    stamps: state.company.stamps,
    foundedAt: state.company.foundedAt,
    planes: state.planes.map((p) => ({ id: p.id, model: p.model, wear: p.wear })),
    pilots: state.pilots.map((p) => ({ id: p.id, pilot: p.pilot, affinity: p.affinity, morale: p.morale, fatigue: p.fatigue, scenesSeen: p.scenesSeen })),
    zones: state.zones,
    decorations: state.decorations.map((d) => d.decoration),
    album: state.stamps.map((s) => ({ id: s.stamp, earnedAt: s.earnedAt })),
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

  app.get('/v1/company', { preHandler: requirePlayer }, async (request, reply) => {
    const company = findCompanyByPlayer(ctx.db, request.player!.id);
    if (!company) return reply.code(404).send({ error: 'no_company' });
    return view(loadCompanyState(ctx.db, company));
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
    return reply.code(201).send(view(loadCompanyState(ctx.db, company)));
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
    return localizeScene(template, i, localeOf(request));
  });
}
