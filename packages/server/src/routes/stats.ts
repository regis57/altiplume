import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';

/**
 * Le compteur mondial anonyme : « Ce mois-ci, les aviateurs du monde ont
 * acheminé N plis. » Un agrégat, rien d'autre — pas de classement, pas de nom,
 * pas de compte individuel. Calculé à la demande, mis en cache dix minutes :
 * c'est un chiffre d'ambiance, pas un tableau de bord.
 */
export function registerStatsRoutes(app: FastifyInstance, ctx: AppContext): void {
  let cached: { at: number; body: unknown } | null = null;
  const TTL_MS = 10 * 60_000;

  app.get('/v1/world/stats', async (_request, reply) => {
    const now = ctx.now();
    if (!cached || now - cached.at > TTL_MS) {
      const d = new Date(now);
      const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
      const month = ctx.db.prepare("SELECT COUNT(*) AS n FROM ledger WHERE kind = 'flight.arrived' AND at >= ?").get(monthStart) as { n: number };
      const total = ctx.db.prepare("SELECT COUNT(*) AS n FROM ledger WHERE kind = 'flight.arrived'").get() as { n: number };
      const companies = ctx.db.prepare('SELECT COUNT(*) AS n FROM companies').get() as { n: number };
      // Les compagnies s'arrondissent à la dizaine : un chiffre d'ambiance ne doit pas
      // permettre de deviner qu'une personne précise vient de s'inscrire.
      cached = { at: now, body: { deliveriesThisMonth: Number(month.n), deliveriesTotal: Number(total.n), companies: Math.floor(Number(companies.n) / 10) * 10 } };
    }
    return reply.header('cache-control', 'public, max-age=600').send(cached.body);
  });
}
