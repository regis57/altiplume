import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { isLocale } from '../auth/validation.ts';
import { localizeWorld } from '../world/index.ts';

const querySchema = {
  querystring: { type: 'object', additionalProperties: false, properties: { locale: { type: 'string', maxLength: 5 } } },
} as const;

/**
 * Le catalogue du monde, public et identique pour tout le monde : villages, avions,
 * pilotes (sans leurs histoires), cartes, décorations.
 *
 * Il est gardé en cache par le navigateur, mais **jamais servi sans demander** :
 * `no-cache` oblige à revalider, et l'empreinte du contenu répond « rien de
 * neuf » en quelques octets quand rien n'a changé. C'est la leçon du 13/10 : avec
 * une heure de cache sec, un joueur a lu une carte d'avant la mise à jour — vieux
 * texte, vieux tarif, et pas la mention « Fret lourd ». Un catalogue périmé fait
 * un jeu incohérent : l'écran promet ce que le serveur ne connaît plus.
 */
export function registerWorldRoutes(app: FastifyInstance): void {
  const cache = { fr: JSON.stringify(localizeWorld('fr')), en: JSON.stringify(localizeWorld('en')) };
  const etag = {
    fr: `"${createHash('sha256').update(cache.fr).digest('base64url').slice(0, 22)}"`,
    en: `"${createHash('sha256').update(cache.en).digest('base64url').slice(0, 22)}"`,
  };
  app.get('/v1/world', { schema: querySchema }, async (request, reply) => {
    const q = request.query as { locale?: string };
    const locale = isLocale(q.locale) ? q.locale : (request.player && isLocale(request.player.locale) ? request.player.locale : 'fr');
    reply.header('cache-control', 'no-cache').header('etag', etag[locale]);
    // Déjà à jour : on ne renvoie pas cent kilo-octets pour rien.
    if (request.headers['if-none-match'] === etag[locale]) return reply.code(304).send();
    return reply.type('application/json; charset=utf-8').send(cache[locale]);
  });
}
