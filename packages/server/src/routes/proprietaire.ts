import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';

const DAY_MS = 24 * 3_600_000;

/**
 * Le compteur de l'éditeur : combien de personnes sont inscrites, exactement. Il est
 * pour une seule personne, celle dont l'adresse est dans `OWNER_EMAIL`, connectée.
 * Pour tout le monde d'autre (une personne inscrite, un visiteur, un robot) la route
 * répond « introuvable », comme si elle n'existait pas ; sans `OWNER_EMAIL`, elle
 * n'existe pas non plus. Que des nombres : aucun nom, aucune adresse, aucune liste.
 * La réponse n'est jamais mise en cache.
 */
export function registerOwnerRoutes(app: FastifyInstance, ctx: AppContext): void {
  const owner = ctx.config.ownerEmail;
  if (owner === null) return;

  app.get('/v1/owner/counts', async (request, reply) => {
    const player = request.player;
    if (!player || player.email.trim().toLowerCase() !== owner) return reply.code(404).send({ error: 'not_found' });
    const now = ctx.now();
    const count = (sql: string, ...args: number[]) => Number((ctx.db.prepare(sql).get(...args) as { n: number }).n);
    return reply.header('cache-control', 'no-store').send({
      players: count('SELECT COUNT(*) AS n FROM players'),
      companies: count('SELECT COUNT(*) AS n FROM companies'),
      registeredLast7Days: count('SELECT COUNT(*) AS n FROM players WHERE created_at >= ?', now - 7 * DAY_MS),
      registeredLast30Days: count('SELECT COUNT(*) AS n FROM players WHERE created_at >= ?', now - 30 * DAY_MS),
      at: now,
    });
  });
}
