import type { FastifyInstance } from 'fastify';

/**
 * Sonde de vivacité, utilisée par Docker et par le tunnel.
 *
 * Elle ne révèle rien d'exploitable : pas de version de dépendance, pas de chemin,
 * pas de variable d'environnement. La version de l'application, elle, se lit sur
 * `/v1/version` — elle est publique et affichée sur chaque page.
 */
export function registerHealth(app: FastifyInstance): void {
  app.get('/healthz', async () => ({ status: 'ok' as const }));
}
