import type { FastifyInstance } from 'fastify';

/**
 * Ce qui tourne, exactement : version, commit, date de construction.
 *
 * Ces trois valeurs sont gravées dans l'image par la chaîne de publication
 * (`APP_VERSION`, `APP_REVISION`, `APP_BUILT_AT`, posées par le Dockerfile depuis
 * les arguments de construction). Hors conteneur, elles valent « dev » : c'est
 * exact aussi.
 *
 * Rien ici n'est secret : le dépôt est public sous AGPL, et l'étiquette en haut
 * de chaque page affiche déjà la même chose. Mais il faut pouvoir le lire sans
 * ouvrir un navigateur — pour savoir si le NAS tourne bien la dernière image.
 * La sonde `/healthz`, elle, reste muette : ce n'est pas son rôle.
 */
export const APP_VERSION = process.env['APP_VERSION'] ?? 'dev';
export const APP_REVISION = process.env['APP_REVISION'] ?? 'dev';
export const APP_BUILT_AT = process.env['APP_BUILT_AT'] ?? null;
/** Le stade du projet. « essai » tant que le monde bouge sous les pieds du joueur. */
export const APP_STAGE = 'essai' as const;

export function registerVersionRoutes(app: FastifyInstance): void {
  app.get('/v1/version', async (_request, reply) => {
    reply.header('cache-control', 'no-cache');
    return { version: APP_VERSION, revision: APP_REVISION, builtAt: APP_BUILT_AT, stage: APP_STAGE };
  });
}
