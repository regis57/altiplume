import type { FastifyInstance } from 'fastify';
import { isLocale } from '../auth/validation.ts';
import { localizeWorld } from '../world/index.ts';

const querySchema = {
  querystring: { type: 'object', additionalProperties: false, properties: { locale: { type: 'string', maxLength: 5 } } },
} as const;

/**
 * Le catalogue du monde, public et identique pour tout le monde : villages, avions,
 * pilotes (sans leurs histoires), cartes, décorations. Mis en cache une heure.
 */
export function registerWorldRoutes(app: FastifyInstance): void {
  const cache = { fr: JSON.stringify(localizeWorld('fr')), en: JSON.stringify(localizeWorld('en')) };
  app.get('/v1/world', { schema: querySchema }, async (request, reply) => {
    const q = request.query as { locale?: string };
    const locale = isLocale(q.locale) ? q.locale : (request.player && isLocale(request.player.locale) ? request.player.locale : 'fr');
    return reply.header('cache-control', 'public, max-age=3600').type('application/json; charset=utf-8').send(cache[locale]);
  });
}
